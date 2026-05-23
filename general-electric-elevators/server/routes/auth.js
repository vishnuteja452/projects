const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/auth');

// Helper: generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// @route   GET /api/auth/check-admin
// @desc    Check if any admin exists (used on first load)
// @access  Public
router.get('/check-admin', async (req, res) => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        res.json({ adminExists: !!adminExists });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/auth/setup-admin
// @desc    First-time admin registration (only if no admin exists)
// @access  Public
router.post('/setup-admin', async (req, res) => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(400).json({ success: false, message: 'Admin already exists. Cannot create another.' });
        }

        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'admin',
            status: 'Active',
            passwordSet: true,
            roleDetail: 'System Administrator'
        });

        const token = generateToken(user._id);
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                roleDetail: user.roleDetail
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/auth/login
// @desc    Login with email + password
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'No account found with this email.' });
        }

        // Check if user needs to set password first
        if (!user.passwordSet || !user.password) {
            return res.status(200).json({
                success: false,
                needsPasswordSetup: true,
                userId: user._id,
                userName: user.name,
                userEmail: user.email,
                message: 'Please set your password to continue.'
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
        }

        const token = generateToken(user._id);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                roleDetail: user.roleDetail,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/auth/setup-password
// @desc    First-time user sets their own password
// @access  Public (uses userId from login response)
router.post('/setup-password', async (req, res) => {
    try {
        const { userId, password, confirmPassword } = req.body;
        if (!userId || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        if (user.passwordSet) {
            return res.status(400).json({ success: false, message: 'Password has already been set. Please login normally.' });
        }

        user.password = password;
        user.passwordSet = true;
        user.status = 'Active';
        await user.save();

        const token = generateToken(user._id);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                roleDetail: user.roleDetail,
                phone: user.phone
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current logged-in user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
