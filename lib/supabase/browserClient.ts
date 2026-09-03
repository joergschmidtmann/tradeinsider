import { createBrowserClient } from "@supabase/ssr";

/** Auth-aware client for Client Components (e.g. Header — needs to react to
 * sign-in/sign-out via `auth.onAuthStateChange` without a full page reload). */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  return createBrowserClient(url, anonKey);
}
