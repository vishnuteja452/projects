const Comment = require('../models/Comment');

exports.createComment = async (req, res) => {
    try {
        const { threadId, content, parentId } = req.body;
        const comment = new Comment({ threadId, content, parentId, author: req.user.username });
        await comment.save();
        res.json(comment);
    } catch (err) { res.status(500).send("Create Error"); }
};

exports.getComments = async (req, res) => {
    try {
        const comments = await Comment.find({ threadId: req.params.threadId }).sort({ createdAt: -1 });
        res.json(comments);
    } catch (err) { res.status(500).send("Fetch Error"); }
};

exports.tagComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { tagType } = req.body;
        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).send("Not found");
        
        if (tagType === 'Useful') { comment.usefulTags += 1; comment.qualityColor = 'green'; }
        else if (tagType === 'Average') { comment.averageTags += 1; comment.qualityColor = 'orange'; }
        else if (tagType === 'Memes') { comment.memeTags += 1; comment.qualityColor = 'red'; }
        
        comment.calculateQuality();
        await comment.save();
        res.json(comment);
    } catch (err) { res.status(500).send("Tag Error"); }
};
