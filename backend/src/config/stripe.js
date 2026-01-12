require('dotenv').config();
const Stripe = require('stripe');

const mode = process.env.NODE_ENV || 'development';
const isProduction = mode === 'production';

// Select Key based on Mode
const apiKey = isProduction 
    ? process.env.STRIPE_SECRET_KEY_PROD 
    : process.env.STRIPE_SECRET_KEY_DEV;

// Fallback to legacy variable if specific ones aren't set
const finalKey = apiKey || process.env.STRIPE_SECRET_KEY;

if (!finalKey) {
    console.warn(`⚠️  Stripe API Key missing for mode: ${mode}`);
} else {
    console.log(`💳 Stripe configured in ${mode.toUpperCase()} mode.`);
}

const stripe = Stripe(finalKey);

module.exports = stripe;
