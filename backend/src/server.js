import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from backend folder or root folder
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { checkDatabaseConnection } from './config/db.js';
import { initTables } from './scripts/initDb.js';
import clientRoutes from './routes/clientRoutes.js';
import caRoutes from './routes/caRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*', // Allow frontend development server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/clients', clientRoutes);
app.use('/api/cas', caRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbOk = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    databaseConnected: dbOk,
    timestamp: new Date().toISOString()
  });
});

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
  console.log(`  Client-CA Backend running on port ${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);

  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      await initTables();
    } else {
      console.warn('⚠️  Database not connected. Please ensure DATABASE_URL is set correctly in .env.');
    }
  } catch (initErr) {
    console.error('⚠️  Database initialization warning:', initErr.message);
  }
});
