const supabase = require('../config/supabase');

async function verifyAuth(req, res, next) {
    const authHeader = req.headers['authorization']; // "Bearer <TOKEN>"
    
    if (!authHeader) {
        return res.status(401).json({ error: "Missing Auth Token" });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    try {
        // 1. Verify User with Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
             return res.status(401).json({ error: "Invalid Token" });
        }

        // 2. Check Subscription Status in DB
        const { data: profile, error: dbError } = await supabase
            .from('profiles')
            .select('subscription_status, credits')
            .eq('id', user.id)
            .single();
            
        // Default to free if no profile found
        const plan = profile?.subscription_status || 'free';
        const credits = profile?.credits || 0;

        req.user = { id: user.id, plan, credits };
        next();

    } catch (e) {
        console.error("Auth Error:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = verifyAuth;
