const mongoose = require('mongoose');

const ThreadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true }, // p/ board
    image: { type: String },
    uri: { type: String },
    participationScore: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0 },
    tagQualityScore: { type: Number, default: 0 },
    usefulTags: { type: Number, default: 0 },
    importantTags: { type: Number, default: 0 },
    wasteTags: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    uniqueContributors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    isCollaboration: { type: Boolean, default: false }
});

// Post-creation Logic: Calculate scores
ThreadSchema.methods.calculateTrending = function() {
    const hoursSinceStart = (Date.now() - this.createdAt) / (1000 * 60 * 60);
    const recencyScore = 1 / (hoursSinceStart + 1);
    
    // Tag Quality Score = (useful * 2) + (important * 3) - (waste * 1)
    this.tagQualityScore = (this.usefulTags * 2) + (this.importantTags * 3) - (this.wasteTags * 1);
    
    // Participation Score = (numComments * 2) + unique_contributors
    this.participationScore = (this.commentCount * 2) + this.uniqueContributors.length;

    // Trending Score = (PartScore * 0.5) + (TagScore * 0.3) + (Recency * 0.2)
    this.trendingScore = (this.participationScore * 0.5) + (this.tagQualityScore * 0.3) + (recencyScore * 0.2);
    
    return this.trendingScore;
};

module.exports = mongoose.model('Thread', ThreadSchema);
