/**
 * server.js — Express application entry point
 */

require('dotenv').config();

const express        = require('express');
const cors           = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());                          // Allow cross-origin requests from the frontend
app.use(express.json());                  // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/employees', employeeRoutes);

// Health-check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Employee Management API is running.' });
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'An unexpected server error occurred.' });
});

// ─── Start server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
  console.log(`📋  API base URL : http://localhost:${PORT}/api/employees`);
});
