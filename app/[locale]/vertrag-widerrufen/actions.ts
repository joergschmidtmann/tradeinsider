"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

export type WithdrawState = { success?: boolean; error?: string } | undefined;

// Digital equivalent of the model withdrawal form in app/[locale]/widerruf —
// requires the `contract_requests` table, see supabase/schema.sql.
export async function submitWithdrawal(_prevState: WithdrawState, formData: FormData): Promise<WithdrawState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const plan = String(formData.get("plan") ?? "").trim() || null;
  const orderDate = String(formData.get("orderDate") ?? "").trim() || null;

  if (!name || !email) {
    return { error: "Bitte gib deinen Namen und deine Email-Adresse an." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("contract_requests").insert({
    type: "withdrawal",
    email,
    name,
    plan,
    requested_termination: orderDate,
  });

  if (error) {
    return { error: "Dein Widerruf konnte nicht übermittelt werden. Bitte versuch es erneut oder schreib uns direkt an info@tradeinsider.io." };
  }

  // TODO: Bestätigungs-E-Mail an `email` versenden, sobald ein E-Mail-Versand
  // (z. B. über STRATO) im Code angebunden ist.
  return { success: true };
}
