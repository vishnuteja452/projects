const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    employeeName: { type: String, required: true },
    date: { type: String, required: true },
    checkIn: { type: String, required: true },
    checkOut: { type: String, default: '' },
    location: { type: String, default: '' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
