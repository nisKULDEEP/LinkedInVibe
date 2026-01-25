const { constructEvent, handleCheckoutSessionCompleted } = require('../services/stripeService');

async function handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        await handleCheckoutSessionCompleted(event.data.object);
    }

    res.json({received: true});
}

module.exports = { handleStripeWebhook };
