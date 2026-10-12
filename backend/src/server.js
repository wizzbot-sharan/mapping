import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load .env from backend folder or root folder
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { checkDatabaseConnection, ensureDbPool, hibernateDbPool } from './config/db.js';
import { initTables } from './scripts/initDb.js';
import clientRoutes from './routes/clientRoutes.js';
import caRoutes from './routes/caRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// --- Inactivity & Hibernation Tracker (10-minute sleep) ---
let lastActivity = Date.now();
let isSleeping = false;
const HIBERNATION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Middleware: Track activity and wake up if sleeping
app.use((req, res, next) => {
  if (isSleeping) {
    console.log(`[PowerSaver]: Incoming request (${req.method} ${req.url}). Waking up server and restoring DB pool...`);
    isSleeping = false;
    ensureDbPool();
  }
  lastActivity = Date.now();
  next();
});

// Periodic idle check (every 30 seconds)
const hibernationMonitor = setInterval(async () => {
  const idleTime = Date.now() - lastActivity;
  if (!isSleeping && idleTime >= HIBERNATION_TIMEOUT_MS) {
    isSleeping = true;
    console.log(`[PowerSaver]: No user activity detected for 10 minutes. Hibernating server to drop CPU to 0% and minimize RAM.`);
    await hibernateDbPool();
    if (global.gc) {
      global.gc();
      console.log('[PowerSaver]: Memory compacted via garbage collection.');
    }
  }
}, 30000);
hibernationMonitor.unref();

// Standard middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api/clients', clientRoutes);
app.use('/api/cas', caRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbOk = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    databaseConnected: dbOk,
    isSleeping,
    idleSeconds: Math.floor((Date.now() - lastActivity) / 1000),
    timestamp: new Date().toISOString()
  });
});

// Production Static Frontend Serving (Single Unified Service)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`[Production]: Serving static frontend assets from ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  // Catch-all route to serve index.html for client-side routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server & verify DB
app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`  Client-CA Service running on port ${PORT}`);
  console.log(`  PowerSaver 10m Idle Hibernation: ACTIVE`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);

  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      await initTables();
    } else {
      console.warn('⚠️  Database not connected. Please ensure DATABASE_URL is set in environment variables.');
    }
  } catch (initErr) {
    console.error('⚠️  Database initialization warning:', initErr.message);
  }
});
