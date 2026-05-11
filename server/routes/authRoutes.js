const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const guestController = require('../controllers/guestController');
const { verifyToken } = require('../middleware/auth');
const passport = require('passport');
const jwt = require('jsonwebtoken');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/auth/guest', guestController.guestLogin);
router.get('/profile', verifyToken, authController.getProfile);
router.post('/join-board', verifyToken, authController.joinBoard);

// Google OAuth Routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.redirect(`/?token=${token}`);
  }
);

module.exports = router;
