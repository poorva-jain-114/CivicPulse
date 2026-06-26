import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. GET ANALYTICS SUMMARY
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const incidents = await db.incidents.find({});
    
    // Aggregations
    const total = incidents.length;
    const resolved = incidents.filter(i => i.status === 'Resolved' || i.status === 'Verified').length;
    const open = incidents.filter(i => i.status === 'Open').length;
    const inProgress = incidents.filter(i => i.status === 'Assigned' || i.status === 'In_Progress').length;
    const escalated = incidents.filter(i => i.escalated === true).length;
    const spam = incidents.filter(i => i.isSpam === true).length;

    // Department Performance
    const departments = [
      'Roads & Buildings Maintenance',
      'Public Health & Sanitation',
      'Water Supply & Sewerage Board',
      'MSEDCL / Electricity Board',
      'Traffic Police / RTO'
    ];

    const departmentStats = departments.map(dept => {
      const deptIncidents = incidents.filter(i => i.department === dept && !i.isSpam);
      const deptTotal = deptIncidents.length;
      const deptResolved = deptIncidents.filter(i => i.status === 'Resolved' || i.status === 'Verified').length;
      const pct = deptTotal > 0 ? Math.round((deptResolved / deptTotal) * 100) : 100;
      
      // SLA Score calculation (simulate response time: base 95% minus 5% per open ticket)
      const openCount = deptIncidents.filter(i => i.status === 'Open' || i.status === 'Assigned').length;
      const sla = Math.max(100 - openCount * 8, 40);

      return {
        name: dept,
        total: deptTotal,
        resolved: deptResolved,
        percentage: pct,
        slaScore: sla
      };
    });

    // Ward level scores
    const wardScores = {
      'Ward 1': 88,
      'Ward 2': 74,
      'Ward 3': 69,
      'Ward 4': 92,
      'Ward 5': 78 // Default ward
    };

    res.json({
      totals: {
        total,
        resolved,
        open,
        inProgress,
        escalated,
        spam
      },
      departmentStats,
      wardScores
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 2. GET PREDICTIVE RISK ALERTS
router.get('/predictive-risks', authenticateToken, async (req, res) => {
  try {
    const alerts = await db.alerts.find({});

    // If alerts are empty, seed some predictive metrics
    if (alerts.length === 0) {
      const initialAlerts = [
        {
          title: 'Water Pipeline Structural Stress',
          description: 'Sarthi AI detected a water pipeline stress index of 87% in Ward 5. Localized pressure leakage reports and water contamination complaints have spiked 320% near City Center. High probability of pipe rupture within 72 hours.',
          ward: 'Ward 5',
          severity: 'High',
          category: 'Water'
        },
        {
          title: 'Substation Transformer Overload Threat',
          description: 'Streetlight flicker reports, hanging live wires, and power voltage complaints are up 45% this week in Ward 3. Phase L2 transformer load index is exceeding safe limits. Threat of localized grid blackout.',
          ward: 'Ward 3',
          severity: 'Medium',
          category: 'Electricity'
        },
        {
          title: 'Severe Waterlogging / Drainage Clog Alert',
          description: 'Accumulation of debris and unresolved waste reports near the main stormwater vents in Ward 5 indicates 85% drain blockage. Heavy rains predicted in 24 hours will cause severe intersection waterlogging.',
          ward: 'Ward 5',
          severity: 'High',
          category: 'Sanitation'
        }
      ];

      for (const a of initialAlerts) {
        await db.alerts.create(a);
      }
      
      return res.json(await db.alerts.find({}));
    }

    res.json(alerts);
  } catch (error) {
    console.error('Error fetching predictive risks:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
