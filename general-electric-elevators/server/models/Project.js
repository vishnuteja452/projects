const mongoose = require('mongoose');

const StageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    date: { type: String, default: '' }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
    buildingName: {
        type: String,
        required: [true, 'Building name is required'],
        trim: true
    },
    clientName: {
        type: String,
        required: true,
        trim: true
    },
    clientEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    progress: {
        type: Number,
        default: 10,
        min: 0,
        max: 100
    },
    currentStage: {
        type: Number,
        default: 0
    },
    handoverDate: {
        type: String,
        required: true
    },
    stages: {
        type: [StageSchema],
        default: [
            { name: 'Site Readiness Inspection', status: 'in-progress', date: '' },
            { name: 'Shaft Plumb Line Verification', status: 'pending', date: '' },
            { name: 'Bracket & Guide Rail Mounting', status: 'pending', date: '' },
            { name: 'Landing Door Alignment', status: 'pending', date: '' },
            { name: 'Car Frame & Cabin Assembly', status: 'pending', date: '' },
            { name: 'Traction Machine & Rope Laying', status: 'pending', date: '' },
            { name: 'Electrical Wiring & Control Panel', status: 'pending', date: '' },
            { name: 'Safety Gear & Speed Governor Calibration', status: 'pending', date: '' },
            { name: 'Final Inspection & Licensing Signoff', status: 'pending', date: '' }
        ]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', ProjectSchema);
