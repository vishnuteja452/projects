const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ username, email, password });
        await user.save();

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, username: user.username } });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, username: user.username } });
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

exports.joinBoard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { board } = req.body;
        if (!user.joinedBoards.includes(board)) {
            user.joinedBoards.push(board);
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
};
