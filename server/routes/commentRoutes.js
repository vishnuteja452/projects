const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, commentController.createComment);
router.get('/:threadId', commentController.getComments);
router.post('/:id/tag', verifyToken, commentController.tagComment);

module.exports = router;
