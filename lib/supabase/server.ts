import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Auth-aware client for Server Components, Server Actions and Route Handlers.
 * Reads/writes the session via cookies, so `auth.getUser()` reflects the
 * signed-in user on the current request. */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render, where cookies can't be
          // written — proxy.ts refreshes the session cookie instead.
        }
      },
    },
  });
}
