const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
    targetType: { type: String, enum: ['thread', 'comment'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    tagType: { type: String, enum: ['Useful', 'Important', 'Waste'], required: true },
    givenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tag', TagSchema);
