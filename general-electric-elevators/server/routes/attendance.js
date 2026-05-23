const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const protect = require('../middleware/auth');

// GET all attendance logs – admin sees all, employee sees own only
router.get('/', protect, async (req, res) => {
  try {
    const { role, _id } = req.user;
    const query = role === 'admin' ? {} : { employeeId: _id };
    const logs = await Attendance.find(query);
    res.json({ success: true, logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /attendance/clockin – create a new clock‑in record
router.post('/clockin', protect, async (req, res) => {
  try {
    const { _id, name } = req.user;
    const { location } = req.body;
    const log = await Attendance.create({
      employeeId: _id,
      employeeName: name,
      date: new Date().toISOString().split('T')[0],
      checkIn: new Date().toISOString(),
      location: location || ''
    });
    res.status(201).json({ success: true, log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /attendance/clockout – update the latest clock‑in for today with a check‑out time
router.put('/clockout', protect, async (req, res) => {
  try {
    const { _id } = req.user;
    const today = new Date().toISOString().split('T')[0];
    const log = await Attendance.findOne({
      employeeId: _id,
      date: today,
      checkOut: ''
    }).sort({ createdAt: -1 });

    if (!log) {
      return res.status(404).json({ success: false, message: 'No active clock‑in found for today.' });
    }

    log.checkOut = new Date().toISOString();
    await log.save();
    res.json({ success: true, log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
