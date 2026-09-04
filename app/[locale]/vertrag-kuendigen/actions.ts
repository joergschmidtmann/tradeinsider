"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/adminClient";

export type CancelState = { success?: boolean; error?: string } | undefined;

// Fallback/formal-record cancellation channel (§312k BGB Kündigungsbutton) —
// the primary, immediately-effective path for logged-in Pro users is the
// Stripe Billing Portal (see app/[locale]/konto/actions.ts openBillingPortal).
// Requires the `contract_requests` table — see supabase/schema.sql.
export async function submitCancellation(_prevState: CancelState, formData: FormData): Promise<CancelState> {
  const email = String(formData.get("email") ?? "").trim();
  const plan = String(formData.get("plan") ?? "").trim() || null;
  const requestedTermination = String(formData.get("requestedTermination") ?? "asap");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!email) {
    return { error: "Bitte gib deine Email-Adresse an." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("contract_requests").insert({
    type: "cancellation",
    email,
    plan,
    requested_termination: requestedTermination,
    reason,
  });

  if (error) {
    return { error: "Deine Kündigung konnte nicht übermittelt werden. Bitte versuch es erneut oder schreib uns direkt an info@tradeinsider.io." };
  }

  // TODO: Bestätigungs-E-Mail an `email` versenden, sobald ein E-Mail-Versand
  // (z. B. über STRATO) im Code angebunden ist — aktuell keine Infrastruktur
  // dafür vorhanden.
  return { success: true };
}
