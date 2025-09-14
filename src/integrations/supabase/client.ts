import { createClient } from '@supabase/supabase-js';

// --- DEBUGGING VERCEL ENV VARIABLES ---
// This will help us see if the keys are being loaded in the live environment.
console.log("Attempting to load Supabase keys...");
console.log("VITE_SUPABASE_URL is set:", !!import.meta.env.VITE_SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY is set:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
// --- END DEBUGGING ---

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("CRITICAL: Supabase environment variables are missing. The application cannot start.");
  throw new Error("Supabase URL and Anon Key must be defined in the environment variables");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);