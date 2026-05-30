const Comment = require('../models/Comment');
const Tag = require('../models/Tag');

exports.createComment = async (req, res) => {
    try {
        const { threadId, content, parentId } = req.body;
        const comment = new Comment({ threadId, content, parentId, author: req.user.username || 'analyst' });
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

        if (!req.user) return res.status(401).json({ msg: 'Registered users only' });

        const existingTag = await Tag.findOne({ targetId: id, givenBy: req.user.id });
        if (existingTag) return res.status(400).json({ msg: 'Tag already assigned' });

        const comment = await Comment.findById(id);
        if (!comment) return res.status(404).send("Not found");
        
        if (tagType === 'Useful') { comment.usefulTags += 1; }
        else if (tagType === 'Average') { comment.averageTags += 1; }
        else if (tagType === 'Memes') { comment.memeTags += 1; }
        else { return res.status(400).json({ msg: 'Invalid tag type' }); }
        
        comment.calculateQuality();
        await comment.save();

        const tag = new Tag({ targetType: 'comment', targetId: id, tagType, givenBy: req.user.id });
        await tag.save();

        res.json(comment);
    } catch (err) { res.status(500).send("Tag Error"); }
};
