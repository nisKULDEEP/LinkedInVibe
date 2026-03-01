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

// Local AI (Z-Image)
const { generateLocalImage } = require('../controllers/localAiController');
router.post('/generate-image-local', verifyAuth, generateLocalImage);

// Programmatic Image Rendering (Zero Cost, BYOK uses this directly)
const { renderTemplate } = require('../controllers/imageController');
router.post('/render-image', renderTemplate); // No verifyAuth needed since it's just a canvas operation

// HTML to PDF conversion for tailored resumes
const { generatePdf } = require('../controllers/pdfController');
router.post('/generate-pdf', generatePdf);

module.exports = router;
