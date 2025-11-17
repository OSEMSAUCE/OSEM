import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Optional Supabase client - returns null if env vars not set
// OSEM uses mock data by default, but you can connect your own Supabase
export const supabase =
	env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_ANON_KEY
		? createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY)
		: null;
