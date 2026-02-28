// NOTE: OSEM is a pure frontend client — it talks to the ReTreever API and does NOT
// connect to the database directly. This file is kept for legacy/future use only.
// The env vars below are placeholder values (see .env) — no real Supabase project needed.
// svelte-check requires the vars to exist in .env even though they're never used at runtime.
import { createClient } from "@supabase/supabase-js";
import {
    PUBLIC_SUPABASE_ANON_KEY,
    PUBLIC_SUPABASE_URL,
} from "$env/static/public";

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseKey = PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
