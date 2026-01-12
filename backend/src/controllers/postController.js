const { generatePost } = require('../services/geminiService');

async function handleGeneratePost(req, res) {
    try {
        const { systemPrompt, userMessage } = req.body;
        const { plan, credits, id: userId } = req.user;
        
        console.log(`Generating post for user ${userId} (Plan: ${plan}, Credits: ${credits})...`);

        // 1. Check Permissions
        const isPro = (plan === 'active' || plan === 'pro');
        
        if (!isPro && credits <= 0) {
            return res.status(403).json({ 
                error: "Free limit reached. Upgrade to Pro for unlimited posts." 
            });
        }

        // 2. Generate Content
        const text = await generatePost(systemPrompt, userMessage);

        // 3. Deduct Credit (if not pro)
        if (!isPro) {
            // We need a scoped client to update the user's profile RLS
            const { createClient } = require('@supabase/supabase-js');
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_KEY;
            
            const userSupabase = createClient(supabaseUrl, supabaseKey, {
                global: { headers: { Authorization: req.headers.authorization } }
            });

            // Decrement safely
            const { error: updateError } = await userSupabase
                .from('profiles')
                .update({ credits: credits - 1 })
                .eq('id', userId);
                
            if (updateError) {
                console.error("Failed to deduct credit:", updateError);
                // We don't fail the request, just log it. Freebie for them if it fails.
            } else {
                console.log(`Deducted 1 credit for user ${userId}. Remaining: ${credits - 1}`);
            }
        }

        res.json({ success: true, text: text });

    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { handleGeneratePost };
