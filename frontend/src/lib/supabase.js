import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
//export const API_URL = import.meta.env.VITE_API_URL || 'https://linkedinvibe.onrender.com';
export const API_URL = 'https://linkedinvibe.onrender.com';

export const supabase = createClient(supabaseUrl, supabaseKey);
