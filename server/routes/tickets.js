const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const adminOnly = require('../middleware/adminOnly');
const protect = require('../middleware/auth');

// @route   GET /api/tickets
// @desc    Get all tickets (admin) or tickets assigned to logged‑in tech / customer
router.get('/', protect, async (req, res) => {
  try {
    const { role, id } = req.user;
    let tickets;
    if (role === 'admin') {
      tickets = await Ticket.find();
    } else if (role === 'employee') {
      tickets = await Ticket.find({ assignedTech: id });
    } else {
      // customer – only tickets belonging to their email (stored in customerEmail field)
      tickets = await Ticket.find({ customerEmail: req.user.email });
    }
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tickets
// @desc    Create a new ticket (admin or employee)
router.post('/', protect, async (req, res) => {
  try {
    const { role, id } = req.user;
    if (!['admin', 'employee'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const ticket = new Ticket({ ...req.body, createdBy: id });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tickets/:id
// @desc    Update ticket (admin can edit any, employee can edit assigned)
router.put('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const { role, id } = req.user;
    if (role === 'admin' || (role === 'employee' && ticket.assignedTech?.toString() === id)) {
      Object.assign(ticket, req.body);
      await ticket.save();
      return res.json(ticket);
    }
    return res.status(403).json({ message: 'Forbidden' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tickets/:id
// @desc    Delete ticket (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
