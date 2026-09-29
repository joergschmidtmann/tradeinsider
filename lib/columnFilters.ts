import type { SupabaseClient } from "@supabase/supabase-js";
import { HEDGE_FUNDS } from "@/scripts/lib/hedgeFunds";
import { COUNTRIES, countryLabel } from "@/lib/countries";
import type { Locale } from "@/i18n/routing";

export interface BaseTransactionFilters {
  // Array rather than a single value because "Vorstand" in the UI covers both
  // role="management_board" and role="supervisory_board" rows underneath —
  // see the `roles` expansion in app/insider-kaeufe/page.tsx.
  roles: string[];
  q: string;
}

/** Applies the same role/search filters used by the main transactions query
 * on `/insider-kaeufe` (app/insider-kaeufe/page.tsx) to any Supabase query
 * builder — shared so the column-filter dropdowns' value lists stay in sync
 * with what the table itself would show for the same filter state. Country
 * is deliberately not part of this base filter set — it's an exact-match
 * column filter applied separately in page.tsx, same as company/insider. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase's query builder type changes shape with each chained call
export function applyBaseFilters(query: any, filters: BaseTransactionFilters) {
  query = query.in("role", filters.roles).eq("transaction_code", "P");

  // Postgrest's .or() mini-language uses "," and "(" ")" as structural characters,
  // so strip them from user input before building the filter string.
  const safeQuery = filters.q.replace(/[,()]/g, "");
  if (safeQuery) {
    query = query.or(`issuer_name.ilike.%${safeQuery}%,issuer_ticker.ilike.%${safeQuery}%`);
  }
  return query;
}

export interface ColumnFilterOption {
  value: string;
  label?: string;
  count: number;
}

/** Computes the "which values appear, how often" list behind the Unternehmen/
 * Insider column-header dropdowns. Not exhaustive for very large result sets:
 * capped at the first 1000 matching rows (Supabase's project-level row cap —
 * an explicit .range() beyond it is silently truncated, it does not raise the
 * cap) — acceptable for a filter dropdown, since the free-text search box
 * remains exact regardless of this cap, *except* for the hedge-fund Insider
 * dropdown (see isHedgeFundOwnerQuery below): a single 13F filing produces one
 * row per portfolio position, so a large fund's own filing alone can fill the
 * entire 1000-row window and push every other fund out of the list — that
 * case gets an exact-count query instead of this scan-and-dedupe approach. */
export async function fetchDistinctValues(
  supabase: SupabaseClient,
  column: "issuer_name" | "owner_name" | "source_country" | "transaction_date",
  filters: BaseTransactionFilters,
  locale: Locale
): Promise<ColumnFilterOption[]> {
  if (isHedgeFundOwnerQuery(column, filters)) {
    return fetchHedgeFundCounts(supabase, filters);
  }
  if (column === "source_country") {
    return fetchCountryCounts(supabase, filters, locale);
  }
  if (column === "transaction_date") {
    return fetchDateCounts(supabase, filters, locale);
  }

  const query = applyBaseFilters(supabase.from("transactions").select(column), filters).range(0, 999);
  const { data, error } = await query;
  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data as Record<string, string | null>[]) {
    const value = row[column];
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}

function isHedgeFundOwnerQuery(
  column: "issuer_name" | "owner_name" | "source_country" | "transaction_date",
  filters: BaseTransactionFilters
): boolean {
  return column === "owner_name" && filters.roles.length === 1 && filters.roles[0] === "hedge_fund";
}

/** Exact per-fund transaction counts for the curated HEDGE_FUNDS list, via one
 * cheap head-only count query per fund rather than scanning rows — correct
 * regardless of how many portfolio-position rows any single fund's filings
 * contribute, unlike the generic scan-and-dedupe approach above. */
async function fetchHedgeFundCounts(supabase: SupabaseClient, filters: BaseTransactionFilters): Promise<ColumnFilterOption[]> {
  const counts = await Promise.all(
    HEDGE_FUNDS.map(async (fund) => {
      const { count, error } = await applyBaseFilters(
        supabase.from("transactions").select("id", { count: "exact", head: true }),
        filters
      ).eq("owner_name", fund.name);
      if (error) throw error;
      return { value: fund.name, count: count ?? 0 };
    })
  );
  return counts.filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
}

/** Exact per-country counts, same reasoning as fetchHedgeFundCounts above:
 * the universe of countries is small and fixed, so an exact count per code
 * is both cheap and correct — no risk of the scan-and-dedupe row cap ever
 * hiding a country. */
async function fetchCountryCounts(supabase: SupabaseClient, filters: BaseTransactionFilters, locale: Locale): Promise<ColumnFilterOption[]> {
  const counts = await Promise.all(
    COUNTRIES.map(async (country) => {
      const { count, error } = await applyBaseFilters(
        supabase.from("transactions").select("id", { count: "exact", head: true }),
        filters
      ).eq("source_country", country.code);
      if (error) throw error;
      return { value: country.code, label: countryLabel(country.code, locale), count: count ?? 0 };
    })
  );
  return counts.filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
}

// Same 3-entry locale map every other file in this codebase keeps locally
// (see TransactionsTable.tsx) rather than a shared export — small enough
// that a shared util would be more indirection than it saves.
const INTL_LOCALES: Record<Locale, string> = { de: "de-DE", en: "en-US", es: "es-ES" };

/** Distinct transaction dates, scan-and-dedupe like issuer_name/owner_name
 * above (same "not exhaustive for huge result sets" caveat — there's no
 * small fixed universe of dates the way there is for countries/hedge funds).
 * Sorted newest-first rather than by count, since that's what's useful for a
 * date filter. */
async function fetchDateCounts(supabase: SupabaseClient, filters: BaseTransactionFilters, locale: Locale): Promise<ColumnFilterOption[]> {
  const query = applyBaseFilters(supabase.from("transactions").select("transaction_date"), filters).range(0, 999);
  const { data, error } = await query;
  if (error || !data) return [];

  const counts = new Map<string, number>();
  for (const row of data as { transaction_date: string }[]) {
    counts.set(row.transaction_date, (counts.get(row.transaction_date) ?? 0) + 1);
  }

  const formatter = new Intl.DateTimeFormat(INTL_LOCALES[locale], { year: "numeric", month: "short", day: "numeric" });
  return [...counts.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([value, count]) => ({ value, label: formatter.format(new Date(value)), count }));
}

const SIGNAL_TIERS = ["strong", "medium", "weak"] as const;
export type SignalTier = (typeof SIGNAL_TIERS)[number];

/** Exact per-tier counts for the buy-signal filter. Deliberately applies the
 * same $500k/$100k thresholds directly to the stored total_value regardless
 * of its currency, unlike the displayed badge (which converts to USD via
 * live FX rates first) — an accepted simplification: exact at the currency
 * boundary would need the same live-rate conversion pushed into the SQL
 * filter, which isn't practical here. Small and fixed like COUNTRIES/
 * HEDGE_FUNDS, so exact counts per tier rather than a scan. */
export async function fetchSignalCounts(supabase: SupabaseClient, filters: BaseTransactionFilters): Promise<ColumnFilterOption[]> {
  const counts = await Promise.all(
    SIGNAL_TIERS.map(async (tier) => {
      let q = applyBaseFilters(supabase.from("transactions").select("id", { count: "exact", head: true }), filters);
      q = applySignalRange(q, tier);
      const { count, error } = await q;
      if (error) throw error;
      return { value: tier, count: count ?? 0 };
    })
  );
  return counts.filter((c) => c.count > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same query-builder typing issue as applyBaseFilters
export function applySignalRange(query: any, tier: string) {
  if (tier === "strong") return query.gte("total_value", 500_000);
  if (tier === "medium") return query.gte("total_value", 100_000).lt("total_value", 500_000);
  if (tier === "weak") return query.gt("total_value", 0).lt("total_value", 100_000);
  return query;
}
