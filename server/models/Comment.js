const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true },
    author: { type: String, default: 'analyst' },
    content: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    usefulTags: { type: Number, default: 0 },
    averageTags: { type: Number, default: 0 },
    memeTags: { type: Number, default: 0 },
    tagQualityScore: { type: Number, default: 0 },
    qualityColor: { type: String, enum: ['green', 'orange', 'red'], default: 'orange' },
    createdAt: { type: Date, default: Date.now }
});

CommentSchema.methods.calculateQuality = function() {
    this.tagQualityScore = (this.usefulTags * 2) + (this.averageTags * 1) - (this.memeTags * 2);
};

module.exports = mongoose.model('Comment', CommentSchema);
