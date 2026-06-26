import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';

import authRouter from './routes/auth.js';
import incidentsRouter from './routes/incidents.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and parsing middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    sarthiOS: 'running',
    mode: 'Sarthi AI Civic Intelligence Engine v1.0'
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/analytics', analyticsRouter);

// Initialize DB and Start Server
async function startServer() {
  console.log('>>> Civic Pulse: Initializing Sarthi AI platform...');
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`>>> Civic Pulse Backend API running on http://localhost:${PORT}`);
  });
}

startServer();
