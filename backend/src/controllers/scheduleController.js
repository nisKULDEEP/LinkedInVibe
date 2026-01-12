const supabase = require('../config/supabase');

// GET /api/schedule
async function getSchedule(req, res) {
    try {
        const { id: userId } = req.user;
        const { data, error } = await supabase
            .from('scheduled_posts')
            .select('*')
            .eq('user_id', userId)
            .order('scheduled_time', { ascending: true });

        if (error) throw error;
        res.json({ success: true, schedule: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

// POST /api/schedule
async function createSchedule(req, res) {
    try {
        const { id: userId } = req.user;
        const { scheduled_time, topic, custom_instructions, auto_post } = req.body;

        if (!scheduled_time || !topic) {
            return res.status(400).json({ error: "Time and Topic required" });
        }

        // We need updates to go through Service Role (backend) because RLS relies on Auth.
        // OR we can rely on RLS if we authenticated the supabase client with the user token.
        // Since 'supabase' in config is Service Role usually, let's use it but manually enforce user_id match?
        // Actually, schema RLS says 'auth.uid() = user_id'. 
        // Our 'config/supabase.js' uses ENV variables. If SUPABASE_KEY is Service Role, it bypasses RLS.
        // If it's Anon, it fails without token. 
        // Best Practice: Since this is the Backend API, we should trust `req.user.id` (verified by auth middleware).
        
        const { data, error } = await supabase
            .from('scheduled_posts')
            .insert([{
                user_id: userId,
                scheduled_time,
                topic,
                custom_instructions,
                auto_post,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
             console.error("DB Error:", error);
             throw error;
        }
        res.json({ success: true, item: data });

    } catch (error) {
        console.error("Create Schedule Error:", error);
        res.status(500).json({ success: false, error: "DEBUG: " + error.message });
    }
}

// DELETE /api/schedule/:id
async function deleteSchedule(req, res) {
    try {
        const { id: userId } = req.user;
        const { id } = req.params;

        const { error } = await supabase
            .from('scheduled_posts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId); // Ensure ownership

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

// POST /api/schedule/:id/complete (Called by Extension when posted)
async function markComplete(req, res) {
    try {
        const { id: userId } = req.user;
        const { id } = req.params;
        const { status } = req.body; // 'posted' or 'failed'

        const { error } = await supabase
            .from('scheduled_posts')
            .update({ status: status })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { getSchedule, createSchedule, deleteSchedule, markComplete };
