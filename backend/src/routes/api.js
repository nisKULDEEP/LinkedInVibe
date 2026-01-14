const express = require('express');
const router = express.Router();
const { handleGeneratePost } = require('../controllers/postController');
const { getSchedule, createSchedule, deleteSchedule, markComplete } = require('../controllers/scheduleController');
const { refreshToken } = require('../controllers/authController');
const verifyAuth = require('../middleware/auth');

router.post('/refresh-token', refreshToken);
router.post('/generate', verifyAuth, handleGeneratePost);

// Scheduling Routes (Phase 4)
router.get('/schedule', verifyAuth, getSchedule);
router.post('/schedule', verifyAuth, createSchedule);
router.delete('/schedule/:id', verifyAuth, deleteSchedule);
router.post('/schedule/:id/complete', verifyAuth, markComplete);

module.exports = router;
