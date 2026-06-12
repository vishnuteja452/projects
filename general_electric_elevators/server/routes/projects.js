const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const Project = require('../models/Project');

// @route   GET /api/projects
// @desc    Get all projects (admin) or own projects (customer)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const projects = await Project.find();
            return res.json({ success: true, projects });
        }
        // For customers return only projects linked to their email
        const projects = await Project.find({ clientEmail: req.user.email });
        res.json({ success: true, projects });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/projects
// @desc    Admin creates a new project (also creates a customer user if not exists)
// @access  Private, admin only
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const { buildingName, clientName, clientEmail, address, model, handoverDate } = req.body;
        if (!buildingName || !clientName || !clientEmail || !address || !model || !handoverDate) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const newProject = await Project.create({
            buildingName,
            clientName,
            clientEmail,
            address,
            model,
            handoverDate,
            progress: 10,
            currentStage: 0
        });
        res.status(201).json({ success: true, project: newProject });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
