import { createClient } from "@supabase/supabase-js";

/** Read-only client for the frontend (Server Components). Uses the public anon
 * key, which is safe to expose to the browser — Row Level Security in
 * supabase/schema.sql restricts it to SELECT only. */
export function createSupabaseReadClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  return createClient(url, anonKey);
}
