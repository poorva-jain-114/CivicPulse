import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sarthi_civic_secret_key_2026';

// 1. REGISTER
router.post('/register', async (req, res) => {
  const { username, password, role, department, ward } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Username, password, and role are required.' });
  }

  try {
    const existingUser = await db.users.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.users.create({
      username,
      password: hashedPassword,
      role,
      department: role === 'officer' ? (department || 'Roads & Buildings Maintenance') : null,
      ward: ward || 'Ward 5',
      points: 0
    });

    res.status(201).json({ message: 'User registered successfully.', userId: user._id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await db.users.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { 
        id: user._id || user.id, 
        username: user.username, 
        role: user.role,
        department: user.department,
        ward: user.ward
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        role: user.role,
        department: user.department,
        ward: user.ward,
        points: user.points || 0
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// 3. SEED ROUTE (To pre-populate demo users for the hackathon evaluation)
router.post('/seed', async (req, res) => {
  try {
    const usersToSeed = [
      { username: 'citizen', password: 'citizen123', role: 'citizen', ward: 'Ward 5', points: 120 },
      { username: 'officer_roads', password: 'officer123', role: 'officer', department: 'Roads & Buildings Maintenance', ward: 'Ward 5' },
      { username: 'officer_sanitation', password: 'officer123', role: 'officer', department: 'Public Health & Sanitation', ward: 'Ward 5' },
      { username: 'admin', password: 'admin123', role: 'admin', ward: 'Ward 5' },
      { username: 'analytics', password: 'analytics123', role: 'analytics', ward: 'Ward 5' }
    ];

    let count = 0;
    for (const u of usersToSeed) {
      const exists = await db.users.findOne({ username: u.username });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        await db.users.create({
          ...u,
          password: hashedPassword
        });
        count++;
      }
    }

    // Seed some initial incidents for the demo if there are none
    const existingIncidents = await db.incidents.find({});
    if (existingIncidents.length === 0) {
      const demoIncidents = [
        {
          title: 'Major Road Potholes',
          description: 'Huge pothole near City Center School causing major traffic jams and vehicles getting damaged.',
          category: 'Roads & Footpaths',
          priority: 88,
          status: 'Open',
          latitude: 18.5204, // Pune center reference
          longitude: 73.8567,
          department: 'Roads & Buildings Maintenance',
          brief: 'Sarthi AI parsed brief: Potholes reported near school zone on main road. Highly dangerous for two-wheelers, needs urgent repair before rain.',
          reportedBy: 'citizen',
          upvotes: ['citizen'],
          confirmations: 1,
          isClusterMaster: true,
          clusterId: null,
          escalated: false,
          beforeImage: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=400',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        },
        {
          title: 'Garbage Pile near Bus Stop',
          description: 'A massive pile of solid waste has accumulated near the main bus stop in Ward 5. Bad smell and stray dogs gather.',
          category: 'Sanitation & Solid Waste',
          priority: 62,
          status: 'Assigned',
          latitude: 18.5225,
          longitude: 73.8610,
          department: 'Public Health & Sanitation',
          brief: 'Sarthi AI parsed brief: Solid waste pile-up near transit station. Bad smell and stray animal congregation reported. Assigned to sanitation crew.',
          reportedBy: 'citizen',
          upvotes: [],
          confirmations: 1,
          isClusterMaster: true,
          clusterId: null,
          escalated: false,
          assignedOfficer: 'officer_sanitation',
          beforeImage: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=400',
          createdAt: new Date().toISOString()
        }
      ];

      for (const inc of demoIncidents) {
        await db.incidents.create(inc);
      }
    }

    res.json({ message: `Database seeded successfully. Seeded ${count} users and initial demo incidents.` });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ message: 'Internal database seeding error.' });
  }
});

export default router;
