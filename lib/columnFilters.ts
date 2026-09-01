import type { SupabaseClient } from "@supabase/supabase-js";
import { HEDGE_FUNDS } from "@/scripts/lib/hedgeFunds";

export interface BaseTransactionFilters {
  // Array rather than a single value because "Vorstand" in the UI covers both
  // role="management_board" and role="supervisory_board" rows underneath —
  // see the `roles` expansion in app/insider-kaeufe/page.tsx.
  roles: string[];
  region: string;
  euCountries: string[];
  q: string;
}

/** Applies the same role/region/search filters used by the main transactions
 * query on `/insider-kaeufe` (app/insider-kaeufe/page.tsx) to any Supabase
 * query builder — shared so the column-filter dropdowns' value lists stay in
 * sync with what the table itself would show for the same filter state. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase's query builder type changes shape with each chained call
export function applyBaseFilters(query: any, filters: BaseTransactionFilters) {
  query = query.in("role", filters.roles).eq("transaction_code", "P");
  query = filters.region === "US" ? query.eq("source_country", "US") : query.in("source_country", filters.euCountries);

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
  column: "issuer_name" | "owner_name",
  filters: BaseTransactionFilters
): Promise<ColumnFilterOption[]> {
  if (isHedgeFundOwnerQuery(column, filters)) {
    return fetchHedgeFundCounts(supabase, filters);
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

function isHedgeFundOwnerQuery(column: "issuer_name" | "owner_name", filters: BaseTransactionFilters): boolean {
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
