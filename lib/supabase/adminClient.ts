import { createClient } from "@supabase/supabase-js";

/** Service-role client for the Stripe webhook, which has no logged-in user's
 * cookies to work with — bypasses RLS, so it's only used server-side here. */
export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}
