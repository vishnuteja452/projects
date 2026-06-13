const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to MongoDB (lazy for serverless)
let isConnected = false;
const connectDbIfNeeded = async () => {
  if (isConnected) return;
  await connectDB();
  isConnected = true;
};

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // parse JSON bodies

// Ensure DB is connected before any API request
app.use(async (req, res, next) => {
  try {
    await connectDbIfNeeded();
    next();
  } catch (error) {
    console.error('DB connection error:', error);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/attendance', require('./routes/attendance'));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

// Simple health check for api
app.get('/api', (req, res) => {
  res.send('🚀 GE Backend is running');
});

// Global error handler (fallback)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error' });
});

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
  });
}

module.exports = app;
