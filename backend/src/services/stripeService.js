const stripe = require('../config/stripe');
const supabase = require('../config/supabase');

async function handleCheckoutSessionCompleted(session) {
    const userId = session.client_reference_id;
    if (userId) {
        await supabase.from('profiles').update({ subscription_status: 'active' }).eq('id', userId);
        console.log(`✅ User ${userId} upgraded to Pro!`);
    } else {
        console.warn("⚠️ Webhook received but no client_reference_id found.");
    }
}

function constructEvent(body, signature, secret) {
    return stripe.webhooks.constructEvent(body, signature, secret);
}

module.exports = { handleCheckoutSessionCompleted, constructEvent };
