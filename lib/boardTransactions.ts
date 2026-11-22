import type { SupabaseClient } from "@supabase/supabase-js";

// Vorstand-/Aufsichtsrats-Transaktionen sind per RLS Pro-only
// (supabase/migrations/2026-11-22_paywall_rls.sql). Startseite und Dashboard
// zeigen daraus bewusst einen Ausschnitt auch für Nicht-Pro-Besucher — dafür
// gibt es zwei eng begrenzte SECURITY-DEFINER-Funktionen in der Datenbank,
// statt der Website den Service-Role-Schlüssel zu geben.
//
// Solange die Migration noch nicht ausgeführt ist, existieren die Funktionen
// nicht; dann wird auf die bisherige direkte Tabellenabfrage zurückgefallen
// (die ohne die neuen Policies noch für alle lesbar ist).

const BOARD_ROLES = ["management_board", "supervisory_board"];

/** Nur Volumen und Währung der Vorstandskäufe im Zeitraum — für die
 * öffentliche Wochenstatistik der Startseite (keine Namen). */
export async function fetchBoardPurchaseValues(
  supabase: SupabaseClient,
  from: string,
  to: string
): Promise<{ total_value: number | null; currency: string }[]> {
  const { data, error } = await supabase.rpc("board_purchase_values", { p_from: from, p_to: to });
  if (!error) return (data ?? []) as { total_value: number | null; currency: string }[];

  const fallback = await supabase
    .from("transactions")
    .select("total_value, currency")
    .in("role", BOARD_ROLES)
    .eq("transaction_code", "P")
    .gte("transaction_date", from)
    .lte("transaction_date", to);
  return fallback.data ?? [];
}

export interface BoardTransactionRow {
  id: number;
  issuer_name: string;
  issuer_ticker: string | null;
  owner_name: string;
  owner_title: string | null;
  source_country: string;
  transaction_date: string;
  transaction_code: string;
  shares: number | null;
  price_per_share: number | null;
  total_value: number | null;
  currency: string;
}

const DASHBOARD_COLUMNS =
  "id, issuer_name, issuer_ticker, owner_name, owner_title, source_country, transaction_date, transaction_code, shares, price_per_share, total_value, currency";

/** Vorstandskäufe und -verkäufe ab `from` für das Dashboard eingeloggter
 * Nutzer. Muss mit dem Session-Client (Nutzer eingeloggt) aufgerufen werden —
 * die Funktion ist nur für die Rolle `authenticated` freigegeben. */
export async function fetchDashboardBoardTransactions(supabase: SupabaseClient, from: string): Promise<BoardTransactionRow[]> {
  const { data, error } = await supabase.rpc("dashboard_board_transactions", { p_from: from });
  if (!error) return (data ?? []) as BoardTransactionRow[];

  const fallback = await supabase
    .from("transactions")
    .select(DASHBOARD_COLUMNS)
    .in("role", BOARD_ROLES)
    .in("transaction_code", ["P", "S"])
    .gte("transaction_date", from)
    .order("transaction_date", { ascending: false })
    .order("id", { ascending: false });
  return (fallback.data ?? []) as BoardTransactionRow[];
}
