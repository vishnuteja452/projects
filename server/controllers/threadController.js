const Thread = require('../models/Thread');
const Tag = require('../models/Tag');

exports.createThread = async (req, res) => {
    try {
        const { title, description, category, image, uri, isCollaboration } = req.body;
        const thread = new Thread({
            title, description, category, image, uri, isCollaboration,
            author: req.user ? req.user.id : null // Anonymous allowed
        });
        await thread.save();
        res.json(thread);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getThreads = async (req, res) => {
    try {
        const { category, sortBy } = req.query;
        let query = {};
        if (category) query.category = category;

        let threads = await Thread.find(query).populate('author', 'username');

        // Apply Trending Algorithm to each thread before returning
        threads.forEach(t => t.calculateTrending());
        
        // Dynamic sort
        if (sortBy === 'trending') {
            threads.sort((a, b) => b.trendingScore - a.trendingScore);
        } else if (sortBy === 'recent') {
            threads.sort((a, b) => b.createdAt - a.createdAt);
        } else {
            threads.sort((a, b) => b.trendingScore - a.trendingScore);
        }

        res.json(threads);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getThreadById = async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id).populate('author', 'username');
        if (!thread) return res.status(404).json({ msg: 'Thread not found' });
        thread.calculateTrending();
        res.json(thread);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.assignTag = async (req, res) => {
    try {
        const { targetType, targetId, tagType } = req.body;
        if (!req.user) return res.status(401).json({ msg: 'Registered users only' });

        const existingTag = await Tag.findOne({ targetId, givenBy: req.user.id });
        if (existingTag) return res.status(400).json({ msg: 'Tag already assigned' });

        const tag = new Tag({ targetType, targetId, tagType, givenBy: req.user.id });
        await tag.save();

        if (targetType === 'thread') {
            const thread = await Thread.findById(targetId);
            if (tagType === 'Useful') thread.usefulTags++;
            if (tagType === 'Important') thread.importantTags++;
            if (tagType === 'Waste') thread.wasteTags++;
            thread.calculateTrending();
            await thread.save();
        } else {
            const Comment = require('../models/Comment');
            const comment = await Comment.findById(targetId);
            if (tagType === 'Useful') comment.usefulTags++;
            if (tagType === 'Important') comment.importantTags++;
            if (tagType === 'Waste') comment.wasteTags++;
            comment.calculateQuality();
            await comment.save();
        }

        res.json({ msg: 'Tag assigned successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getMyThreads = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ msg: 'User not authenticated' });
        
        let threads = await Thread.find({ author: req.user.id }).sort({ createdAt: -1 });
        threads.forEach(t => t.calculateTrending());
        
        res.json(threads);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
