import type { SupabaseClient } from "@supabase/supabase-js";

export interface BaseTransactionFilters {
  role: string;
  region: string;
  euCountries: string[];
  type: string;
  q: string;
}

/** Applies the same role/region/search filters used by the main transactions
 * query on `/insider-kaeufe` (app/insider-kaeufe/page.tsx) to any Supabase
 * query builder — shared so the column-filter dropdowns' value lists stay in
 * sync with what the table itself would show for the same filter state. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase's query builder type changes shape with each chained call
export function applyBaseFilters(query: any, filters: BaseTransactionFilters) {
  query = query.eq("role", filters.role).eq("transaction_code", filters.type);
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
 * capped at the first 2000 matching rows (Supabase's own default cap is 1000
 * per request without an explicit range — see the hedge-fund ingest scripts'
 * pagination fix for that same limit) — acceptable for a filter dropdown,
 * since the free-text search box remains exact regardless of this cap. */
export async function fetchDistinctValues(
  supabase: SupabaseClient,
  column: "issuer_name" | "owner_name",
  filters: BaseTransactionFilters
): Promise<ColumnFilterOption[]> {
  const query = applyBaseFilters(supabase.from("transactions").select(column), filters).range(0, 1999);
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
