const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.guestLogin = async (req, res) => {
    try {
        let user = await User.findOne({ username: "Guest Analyst" });
        if (!user) {
            user = new User({
                username: "Guest Analyst",
                email: "guest@postra.ai",
                googleId: "guest_id_" + Date.now(),
                participationScore: 500 // Full participation access
            });
            await user.save();
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, user: { username: user.username, participationScore: user.participationScore } });
    } catch (err) {
        res.status(500).json({ error: "Guest Authorization Fault." });
    }
};
