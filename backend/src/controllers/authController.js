const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ MISSING SUPABASE CREDENTIALS in Backend ENV. Token refresh will fail.");
}

const supabase = (supabaseUrl && supabaseKey) 
    ? createClient(supabaseUrl, supabaseKey) 
    : null;

async function refreshToken(req, res) {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({ success: false, error: "Refresh token required" });
        }

        if (!supabase) {
            console.error("❌ Supabase client not initialized.");
            return res.status(503).json({ success: false, error: "Server Configuration Error" });
        }

        const { data, error } = await supabase.auth.refreshSession({ refresh_token });

        if (error) {
            console.error("Supabase Refresh Error:", error);
            return res.status(401).json({ success: false, error: error.message });
        }

        if (data.session) {
             console.log("✅ Token Refreshed via Backend");
             res.json({
                 success: true,
                 access_token: data.session.access_token,
                 refresh_token: data.session.refresh_token
             });
        } else {
             res.status(401).json({ success: false, error: "Invalid session" });
        }

    } catch (e) {
        console.error("Refresh Logic Failed:", e);
        res.status(500).json({ success: false, error: e.message });
    }
}

module.exports = { refreshToken };
