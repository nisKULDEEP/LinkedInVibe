const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/webhookController');

// Stripe requires raw body
router.post('/', express.raw({type: 'application/json'}), handleStripeWebhook);

module.exports = router;
