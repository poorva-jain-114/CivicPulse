import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  filterSpam,
  parseComplaint,
  calculateDistance,
  calculatePriorityScore,
  verifyResolutionImages
} from '../services/sarthi.js';

const router = express.Router();

// 1. GET ALL INCIDENTS
router.get('/', async (req, res) => {
  try {
    const list = await db.incidents.find({});
    // Return sorted by date
    const sorted = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 1.5. GET ALL AUDIT LOGS
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    const list = await db.auditLogs.find({});
    const sorted = list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(sorted);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 2. SUBMIT A NEW GRIEVANCE
router.post('/submit', authenticateToken, async (req, res) => {
  const { description, latitude, longitude, beforeImage } = req.body;
  const username = req.user.username;

  if (!description || !latitude || !longitude) {
    return res.status(400).json({ message: 'Description and location coordinates (lat/lng) are required.' });
  }

  try {
    // A. SPAM FILTER CHECK
    const spamCheck = filterSpam(description);
    if (spamCheck.isSpam) {
      // Archive spam to prevent system cluttering
      const spamIncident = await db.incidents.create({
        title: 'Spam / Non-Civic Submission',
        description,
        latitude,
        longitude,
        status: 'Verified', // Mark verified spam/archived
        category: 'Spam',
        priority: 0,
        department: 'Archived / Filtered',
        brief: `Sarthi AI automatic spam blocker: ${spamCheck.reason}`,
        reportedBy: username,
        isClusterMaster: false,
        isSpam: true,
        beforeImage
      });

      // Log to Audits
      await db.auditLogs.create({
        action: 'SPAM_FILTERED',
        details: `Spam blocked by Sarthi AI Spam Guard: ${spamCheck.reason}`,
        operatorId: username,
        incidentId: spamIncident._id || spamIncident.id
      });

      return res.status(400).json({
        message: 'Submission rejected by Sarthi AI Spam Guard.',
        reason: spamCheck.reason,
        incident: spamIncident
      });
    }

    // B. AI UNDERSTANDING & ROUTING
    const aiParsed = await parseComplaint(description);

    // C. DUPLICATE & CLUSTER AGENT (Search within 100m)
    const openIncidents = await db.incidents.find({
      department: aiParsed.department,
      isSpam: { $ne: true }
    });

    let clusterMaster = null;
    for (const inc of openIncidents) {
      if (inc.isClusterMaster && inc.status !== 'Resolved' && inc.status !== 'Verified') {
        const dist = calculateDistance(latitude, longitude, inc.latitude, inc.longitude);
        if (dist < 100) {
          clusterMaster = inc;
          break;
        }
      }
    }

    if (clusterMaster) {
      // Merging: Add citizen to confirmations and upvotes of master
      const upvotes = clusterMaster.upvotes || [];
      if (!upvotes.includes(username)) {
        await db.incidents.findByIdAndUpdate(clusterMaster._id || clusterMaster.id, {
          $addToSet: { upvotes: username },
          $inc: { confirmations: 1 }
        });
      }

      // Create subordinate incident for the individual citizen tracking
      const newIncident = await db.incidents.create({
        title: aiParsed.title,
        description,
        category: aiParsed.category,
        priority: clusterMaster.priority,
        status: clusterMaster.status,
        latitude,
        longitude,
        department: aiParsed.department,
        brief: `[Clustered Issue] ${clusterMaster.brief}`,
        reportedBy: username,
        isClusterMaster: false,
        clusterId: clusterMaster._id || clusterMaster.id,
        beforeImage,
        assignedOfficer: clusterMaster.assignedOfficer
      });

      // Log to Audits
      await db.auditLogs.create({
        action: 'INCIDENT_CLUSTERED',
        details: `Incident clustered under verified master ticket ID: ${clusterMaster._id || clusterMaster.id}.`,
        operatorId: username,
        incidentId: clusterMaster._id || clusterMaster.id
      });

      // Reward points for duplicate report validation (+5 pts)
      await db.users.findByIdAndUpdate(req.user.id, {
        $inc: { points: 5 }
      });

      return res.status(201).json({
        message: 'Civic Grievance clustered under an active verified incident.',
        clustered: true,
        masterId: clusterMaster._id || clusterMaster.id,
        incident: newIncident
      });
    }

    // D. NEW INCIDENT CREATION
    // Calculate priority score (ML mock engine)
    const priority = calculatePriorityScore({ description }, aiParsed);

    const newIncident = await db.incidents.create({
      title: aiParsed.title,
      description,
      category: aiParsed.category,
      priority,
      status: 'Open',
      latitude,
      longitude,
      department: aiParsed.department,
      brief: aiParsed.officerBrief,
      reportedBy: username,
      upvotes: [username],
      isClusterMaster: true,
      clusterId: null,
      beforeImage
    });

    // Log to Audits
    await db.auditLogs.create({
      action: 'INCIDENT_SUBMISSION',
      details: `Grievance submitted. Routed by Sarthi AI to: ${aiParsed.department}. Priority Score: ${priority}`,
      operatorId: username,
      incidentId: newIncident._id || newIncident.id
    });

    // Reward points for creating a fresh, valid report (+15 pts)
    await db.users.findByIdAndUpdate(req.user.id, {
      $inc: { points: 15 }
    });

    return res.status(201).json({
      message: 'Grievance submitted successfully. Sarthi AI routed to ' + aiParsed.department,
      clustered: false,
      incident: newIncident
    });

  } catch (error) {
    console.error('Error submitting incident:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 3. UPVOTE / CONFIRM AN INCIDENT (Citizen upvotes neighboring issue)
router.post('/:id/upvote', authenticateToken, async (req, res) => {
  const username = req.user.username;
  try {
    const incident = await db.incidents.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found.' });
    }

    if (incident.upvotes && incident.upvotes.includes(username)) {
      return res.status(400).json({ message: 'You have already confirmed/upvoted this incident.' });
    }

    // Update master incident upvotes and confirmations
    const updated = await db.incidents.findByIdAndUpdate(req.params.id, {
      $addToSet: { upvotes: username },
      $inc: { confirmations: 1 }
    });

    // If it's a sub-incident, also update the master
    if (!incident.isClusterMaster && incident.clusterId) {
      await db.incidents.findByIdAndUpdate(incident.clusterId, {
        $addToSet: { upvotes: username },
        $inc: { confirmations: 1 }
      });
    }

    // Log to Audits
    await db.auditLogs.create({
      action: 'INCIDENT_UPVOTE',
      details: `Incident upvoted/confirmed by citizen: ${username}. Total confirmations: ${updated.confirmations || 1}`,
      operatorId: username,
      incidentId: req.params.id
    });

    // Award Citizen 10 Civic Honor Points
    await db.users.findByIdAndUpdate(req.user.id, {
      $inc: { points: 10 }
    });

    res.json({ message: 'Incident confirmed! +10 Civic Honor Points rewarded.', incident: updated });
  } catch (error) {
    console.error('Error upvoting incident:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 4. ASSIGN AN OFFICER (Admin/Ward level)
router.post('/:id/assign', authenticateToken, async (req, res) => {
  const { officerUsername } = req.body;
  if (!officerUsername) {
    return res.status(400).json({ message: 'Officer username is required.' });
  }

  try {
    const incident = await db.incidents.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found.' });
    }

    // Assign officer
    const updated = await db.incidents.findByIdAndUpdate(req.params.id, {
      $set: { 
        assignedOfficer: officerUsername,
        status: 'Assigned'
      }
    });

    // Auto-update all sub-clustered incidents
    if (incident.isClusterMaster) {
      const children = await db.incidents.find({ clusterId: incident._id || incident.id });
      for (const child of children) {
        await db.incidents.findByIdAndUpdate(child._id || child.id, {
          $set: { 
            assignedOfficer: officerUsername,
            status: 'Assigned'
          }
        });
      }
    }

    // Log to Audits
    await db.auditLogs.create({
      action: 'INCIDENT_ASSIGNMENT',
      details: `Incident manually assigned to field officer: @${officerUsername} (Department override)`,
      operatorId: req.user.username,
      incidentId: req.params.id
    });

    res.json({ message: `Incident assigned to ${officerUsername} successfully.`, incident: updated });
  } catch (error) {
    console.error('Error assigning officer:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 5. RESOLVE INCIDENT (Officer resolves with proof upload)
router.post('/:id/resolve', authenticateToken, async (req, res) => {
  const { afterImage, resolutionBrief } = req.body;

  if (!afterImage || !resolutionBrief) {
    return res.status(400).json({ message: 'After-resolution proof photo and brief are required.' });
  }

  try {
    const incident = await db.incidents.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found.' });
    }

    // Run Double-Blind Verification
    const verification = verifyResolutionImages(incident.beforeImage, afterImage);

    // Save proof and set status
    const status = verification.verified ? 'Verified' : 'Resolved'; // 'Verified' if passes, else 'Resolved' pending admin check
    const updated = await db.incidents.findByIdAndUpdate(req.params.id, {
      $set: {
        afterImage,
        resolutionBrief,
        status,
        brief: incident.brief + `\n[Sarthi CV Verification: Confidence ${verification.confidence}%. ${verification.details}]`
      }
    });

    // Update child/clustered incidents as well
    if (incident.isClusterMaster) {
      const children = await db.incidents.find({ clusterId: incident._id || incident.id });
      for (const child of children) {
        await db.incidents.findByIdAndUpdate(child._id || child.id, {
          $set: {
            afterImage,
            resolutionBrief,
            status
          }
        });
      }

      // Reward original reporter +50 points and upvoters +25 points
      const reporter = await db.users.findOne({ username: incident.reportedBy });
      if (reporter) {
        await db.users.findByIdAndUpdate(reporter._id || reporter.id, {
          $inc: { points: 50 }
        });
      }
      for (const upvoter of (incident.upvotes || [])) {
        if (upvoter !== incident.reportedBy) {
          const user = await db.users.findOne({ username: upvoter });
          if (user) {
            await db.users.findByIdAndUpdate(user._id || user.id, {
              $inc: { points: 25 }
            });
          }
        }
      }
    }

    // Log to Audits
    await db.auditLogs.create({
      action: 'INCIDENT_RESOLUTION',
      details: `Resolution proof uploaded by officer. Double-blind verification confidence: ${verification.confidence}%. Status set to: ${status}`,
      operatorId: req.user.username,
      incidentId: req.params.id
    });

    res.json({
      message: verification.verified 
        ? 'Resolution verified by Sarthi AI. Status set to Verified.' 
        : 'Proof uploaded. Sarthi AI recommends further check (low confidence similarity).',
      verification,
      incident: updated
    });

  } catch (error) {
    console.error('Error resolving incident:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 6. SIMULATE 48H ESCALATION TRIGGER (Ward oversight)
router.post('/:id/escalate', authenticateToken, async (req, res) => {
  try {
    const incident = await db.incidents.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found.' });
    }

    const updated = await db.incidents.findByIdAndUpdate(req.params.id, {
      $set: { escalated: true }
    });

    // Log to Audits
    await db.auditLogs.create({
      action: 'INCIDENT_ESCALATION',
      details: `Ticket manually escalated to Ward Municipal Commissioner. SLA breached.`,
      operatorId: req.user.username,
      incidentId: req.params.id
    });

    res.json({
      message: 'Ticket successfully escalated to Ward Municipal Commissioner. Notifications fired.',
      incident: updated
    });
  } catch (error) {
    console.error('Error escalating incident:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// SLA Monitoring background daemon (Runs every 30 seconds to simulate ticket aging)
setInterval(async () => {
  try {
    const list = await db.incidents.find({
      status: { $ne: 'Verified' },
      isSpam: { $ne: true },
      escalated: { $ne: true }
    });

    const now = new Date();
    for (const inc of list) {
      const ageMs = now - new Date(inc.createdAt);
      // High priority SLA limit: 2 minutes (120000ms)
      // Medium priority SLA limit: 4 minutes (240000ms)
      // Low priority SLA limit: 6 minutes (360000ms)
      let limit = 360000;
      if (inc.priority >= 75) limit = 120000;
      else if (inc.priority >= 45) limit = 240000;

      if (ageMs > limit) {
        // Trigger auto-escalation
        await db.incidents.findByIdAndUpdate(inc._id || inc.id, {
          $set: { escalated: true }
        });
        
        await db.auditLogs.create({
          action: 'INCIDENT_ESCALATION',
          details: `AUTO-ESCALATION: SLA threshold exceeded. Ticket automatically escalated to Ward Municipal Commissioner.`,
          operatorId: 'SARTHI_AI_SLA_CLOCK',
          incidentId: inc._id || inc.id
        });

        console.log(`>>> Sarthi SLA Engine: Auto-escalated incident ID: ${inc._id || inc.id} (Priority: ${inc.priority})`);
      }
    }
  } catch (err) {
    console.error('Sarthi SLA Clock daemon error:', err);
  }
}, 30000);

export default router;
