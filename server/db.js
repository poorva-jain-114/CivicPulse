import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JSON_DB_PATH = path.join(__dirname, 'db.json');

// Initialize local JSON DB if it doesn't exist
if (!fs.existsSync(JSON_DB_PATH)) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify({
    users: [],
    incidents: [],
    alerts: []
  }, null, 2));
}

let dbMode = 'local'; // 'mongodb' or 'local'

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/civic_pulse';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000 // 2 seconds timeout
    });
    dbMode = 'mongodb';
    console.log('>>> Sarthi DB: Connected successfully to MongoDB.');
  } catch (error) {
    dbMode = 'local';
    console.log('>>> Sarthi DB: MongoDB connection failed or timed out. Falling back to Local JSON Database.');
  }
}

// Read JSON DB helper
function readJsonDB() {
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], incidents: [], alerts: [] };
  }
}

// Write JSON DB helper
function writeJsonDB(data) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2));
}

// Generate unique ID for JSON fallback
function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Define local operations
const localDB = {
  users: {
    find: async (query = {}) => {
      const data = readJsonDB();
      return data.users.filter(u => {
        return Object.keys(query).every(key => u[key] === query[key]);
      });
    },
    findOne: async (query = {}) => {
      const data = readJsonDB();
      return data.users.find(u => {
        return Object.keys(query).every(key => u[key] === query[key]);
      }) || null;
    },
    findById: async (id) => {
      const data = readJsonDB();
      return data.users.find(u => u._id === id || u.id === id) || null;
    },
    create: async (userData) => {
      const data = readJsonDB();
      const newUser = {
        _id: generateId(),
        points: 0,
        ...userData,
        createdAt: new Date().toISOString()
      };
      data.users.push(newUser);
      writeJsonDB(data);
      return newUser;
    },
    updateOne: async (query, update) => {
      const data = readJsonDB();
      const userIndex = data.users.findIndex(u => {
        return Object.keys(query).every(key => u[key] === query[key]);
      });
      if (userIndex === -1) return { nModified: 0 };
      
      const user = data.users[userIndex];
      const fieldsToUpdate = { ...update.$set };
      if (!update.$set) {
        Object.assign(fieldsToUpdate, update);
      }
      let updated = { ...user, ...fieldsToUpdate };
      delete updated.$set;
      delete updated.$inc;
      
      data.users[userIndex] = updated;
      writeJsonDB(data);
      return { nModified: 1 };
    },
    findByIdAndUpdate: async (id, update) => {
      const data = readJsonDB();
      const userIndex = data.users.findIndex(u => u._id === id || u.id === id);
      if (userIndex === -1) return null;
      
      const user = data.users[userIndex];
      const fieldsToUpdate = { ...update.$set };
      if (!update.$set && !update.$inc) {
        Object.assign(fieldsToUpdate, update);
      }
      
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          user[k] = (user[k] || 0) + v;
        }
      }

      let updated = { ...user, ...fieldsToUpdate };
      delete updated.$set;
      delete updated.$inc;

      data.users[userIndex] = updated;
      writeJsonDB(data);
      return data.users[userIndex];
    }
  },
  incidents: {
    find: async (query = {}) => {
      const data = readJsonDB();
      return data.incidents.filter(item => {
        return Object.keys(query).every(key => {
          if (query[key] && typeof query[key] === 'object' && query[key].$ne !== undefined) {
            return item[key] !== query[key].$ne;
          }
          if (key === 'upvotes' && query[key] && query[key].$in) {
            return item.upvotes && item.upvotes.some(v => query[key].$in.includes(v));
          }
          return item[key] === query[key];
        });
      });
    },
    findOne: async (query = {}) => {
      const data = readJsonDB();
      return data.incidents.find(item => {
        return Object.keys(query).every(key => item[key] === query[key]);
      }) || null;
    },
    findById: async (id) => {
      const data = readJsonDB();
      return data.incidents.find(item => item._id === id || item.id === id) || null;
    },
    create: async (incidentData) => {
      const data = readJsonDB();
      const newIncident = {
        _id: generateId(),
        status: 'Open',
        upvotes: [],
        confirmations: 1,
        isClusterMaster: true,
        clusterId: null,
        escalated: false,
        createdAt: new Date().toISOString(),
        ...incidentData
      };
      data.incidents.push(newIncident);
      writeJsonDB(data);
      return newIncident;
    },
    findByIdAndUpdate: async (id, update) => {
      const data = readJsonDB();
      const index = data.incidents.findIndex(item => item._id === id || item.id === id);
      if (index === -1) return null;
      
      const item = data.incidents[index];
      let fieldsToUpdate = { ...update.$set };
      
      if (!update.$set && !update.$inc && !update.$push && !update.$addToSet) {
        fieldsToUpdate = { ...update };
      }

      let updated = { ...item, ...fieldsToUpdate };

      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          updated[k] = (item[k] || 0) + v;
        }
      }

      if (update.$push) {
        for (const [k, v] of Object.entries(update.$push)) {
          updated[k] = [...(item[k] || []), v];
        }
      }

      if (update.$addToSet) {
        for (const [k, v] of Object.entries(update.$addToSet)) {
          const list = item[k] || [];
          if (!list.includes(v)) {
            updated[k] = [...list, v];
          }
        }
      }

      delete updated.$set;
      delete updated.$inc;
      delete updated.$push;
      delete updated.$addToSet;

      data.incidents[index] = updated;
      writeJsonDB(data);
      return updated;
    },
    updateOne: async (query, update) => {
      const data = readJsonDB();
      const index = data.incidents.findIndex(item => {
        return Object.keys(query).every(key => item[key] === query[key]);
      });
      if (index === -1) return { nModified: 0 };
      
      const item = data.incidents[index];
      const fieldsToUpdate = update.$set || update;
      data.incidents[index] = { ...item, ...fieldsToUpdate };
      writeJsonDB(data);
      return { nModified: 1 };
    }
  },
  alerts: {
    find: async (query = {}) => {
      const data = readJsonDB();
      return data.alerts.filter(item => {
        return Object.keys(query).every(key => item[key] === query[key]);
      });
    },
    create: async (alertData) => {
      const data = readJsonDB();
      const newAlert = {
        _id: generateId(),
        createdAt: new Date().toISOString(),
        ...alertData
      };
      data.alerts.push(newAlert);
      writeJsonDB(data);
      return newAlert;
    }
  }
};

// Define Mongoose Schemas & Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['citizen', 'officer', 'admin', 'analytics'], required: true },
  department: { type: String, default: null },
  ward: { type: String, default: 'Ward 5' },
  points: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const incidentSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  priority: Number,
  status: { type: String, enum: ['Open', 'Assigned', 'In_Progress', 'Resolved', 'Verified'], default: 'Open' },
  latitude: Number,
  longitude: Number,
  department: String,
  brief: String,
  reportedBy: String,
  upvotes: [String],
  clusterId: String,
  isClusterMaster: { type: Boolean, default: true },
  confirmations: { type: Number, default: 1 },
  escalated: { type: Boolean, default: false },
  beforeImage: String,
  afterImage: String,
  resolutionBrief: String,
  assignedOfficer: String,
  createdAt: { type: Date, default: Date.now }
});

const alertSchema = new mongoose.Schema({
  title: String,
  description: String,
  ward: String,
  severity: String,
  createdAt: { type: Date, default: Date.now }
});

const MongooseModels = {
  User: mongoose.model('User', userSchema),
  Incident: mongoose.model('Incident', incidentSchema),
  Alert: mongoose.model('Alert', alertSchema)
};

// Wrapper that checks DB mode and delegates accordingly
export const db = {
  getMode: () => dbMode,
  users: {
    find: (q) => dbMode === 'mongodb' ? MongooseModels.User.find(q) : localDB.users.find(q),
    findOne: (q) => dbMode === 'mongodb' ? MongooseModels.User.findOne(q) : localDB.users.findOne(q),
    findById: (id) => dbMode === 'mongodb' ? MongooseModels.User.findById(id) : localDB.users.findById(id),
    create: (data) => dbMode === 'mongodb' ? MongooseModels.User.create(data) : localDB.users.create(data),
    updateOne: (q, u) => dbMode === 'mongodb' ? MongooseModels.User.updateOne(q, u) : localDB.users.updateOne(q, u),
    findByIdAndUpdate: (id, u) => dbMode === 'mongodb' ? MongooseModels.User.findByIdAndUpdate(id, u, { new: true }) : localDB.users.findByIdAndUpdate(id, u)
  },
  incidents: {
    find: (q) => dbMode === 'mongodb' ? MongooseModels.Incident.find(q).sort({ createdAt: -1 }) : localDB.incidents.find(q),
    findOne: (q) => dbMode === 'mongodb' ? MongooseModels.Incident.findOne(q) : localDB.incidents.findOne(q),
    findById: (id) => dbMode === 'mongodb' ? MongooseModels.Incident.findById(id) : localDB.incidents.findById(id),
    create: (data) => dbMode === 'mongodb' ? MongooseModels.Incident.create(data) : localDB.incidents.create(data),
    updateOne: (q, u) => dbMode === 'mongodb' ? MongooseModels.Incident.updateOne(q, u) : localDB.incidents.updateOne(q, u),
    findByIdAndUpdate: (id, u) => dbMode === 'mongodb' ? MongooseModels.Incident.findByIdAndUpdate(id, u, { new: true }) : localDB.incidents.findByIdAndUpdate(id, u)
  },
  alerts: {
    find: (q) => dbMode === 'mongodb' ? MongooseModels.Alert.find(q).sort({ createdAt: -1 }) : localDB.alerts.find(q),
    create: (data) => dbMode === 'mongodb' ? MongooseModels.Alert.create(data) : localDB.alerts.create(data)
  }
};
