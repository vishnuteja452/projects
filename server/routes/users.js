const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const User = require('../models/User');

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/users
// @desc    Add new employee/technician/customer (admin only)
// @access  Private
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const { name, email, role, phone } = req.body;
        if (!name || !email || !role) {
            return res.status(400).json({ success: false, message: 'Name, email and role are required.' });
        }
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(409).json({ success: false, message: 'User already exists.' });
        }
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            role,
            phone: phone || '',
            status: 'Inactive', // will be set to Active after password is set
            passwordSet: false
        });
        await newUser.save();
        res.status(201).json({ success: true, userId: newUser._id, message: 'User created. Invite them to set password.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user (admin only)
// @access  Private
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent admin from deleting themselves
        if (req.user.id === id) {
            return res.status(400).json({ success: false, message: 'Admin cannot delete own account.' });
        }
        const deleted = await User.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, message: 'User removed.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   GET /api/users/me
// @desc    Get profile of logged‑in user
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
