const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('../server/config/db');
const path = require('path');

dotenv.config();

// Connect MongoDB once per serverless container
let isConnected = false;
const connectDbIfNeeded = async () => {
  if (isConnected) return;
  await connectDB();
  isConnected = true;
};

const app = express();

app.use(cors());
app.use(express.json());

// Ensure DB is connected before any request
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
app.use('/api/auth', require('../server/routes/auth'));
app.use('/api/users', require('../server/routes/users'));
app.use('/api/projects', require('../server/routes/projects'));
app.use('/api/tickets', require('../server/routes/tickets'));
app.use('/api/attendance', require('../server/routes/attendance'));

app.get('/api', (req, res) => {
  res.send('🚀 GE Backend is running');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error' });
});

module.exports = app;
