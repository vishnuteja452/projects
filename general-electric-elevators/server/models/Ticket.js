const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    elevatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    elevatorName: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'completed'],
        default: 'pending'
    },
    technicianId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    technicianName: { type: String, default: 'Unassigned' },
    resolutionNote: { type: String, default: '' },
    signatureData: { type: String, default: '' },
    signatureName: { type: String, default: '' },
    closedDate: { type: String, default: '' },
    createdByEmail: { type: String, default: '' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Ticket', TicketSchema);
