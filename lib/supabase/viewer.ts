import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Login- und Abo-Status des aktuellen Besuchers (Server Components). Für
 * Pro-Inhalte VOR jeder Datenabfrage prüfen, damit Nicht-Pro-Besucher die
 * geschützten Daten gar nicht erst ausgeliefert bekommen — gleiches Muster
 * wie der Vorstand-Tab in app/[locale]/insider-kaeufe/page.tsx. */
export async function getViewerAccess(): Promise<{ isLoggedIn: boolean; isPro: boolean }> {
  const authClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return { isLoggedIn: false, isPro: false };
  const { data: profile } = await authClient.from("profiles").select("tier").eq("id", user.id).single();
  return { isLoggedIn: true, isPro: profile?.tier === "pro" };
}
