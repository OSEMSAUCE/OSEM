import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Optional Supabase - allows demo mode without credentials
const supabaseUrl = PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
