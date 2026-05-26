const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // parse JSON bodies

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/attendance', require('./routes/attendance'));

const path = require('path');

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
