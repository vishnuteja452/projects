const express = require('express');
const router = express.Router();
const threadController = require('../controllers/threadController');
const { isLoggedIn, restrictBoardAccess, verifyToken } = require('../middleware/auth');

router.post('/', isLoggedIn, restrictBoardAccess, threadController.createThread);
router.get('/me', verifyToken, threadController.getMyThreads); // Must be before /:id
router.get('/', isLoggedIn, restrictBoardAccess, threadController.getThreads);
router.get('/:id', threadController.getThreadById);
router.post('/tag', verifyToken, threadController.assignTag);

module.exports = router;
