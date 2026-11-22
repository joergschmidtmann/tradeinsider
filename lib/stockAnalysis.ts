import type { ChartData, Fundamentals, Recommendation, Signal, CategoryKey, TechnicalSnapshot } from "@/lib/analysis/model";

// Lesezugriff auf die von scripts/ingest-analysis.ts befüllten Tabellen.

export const INDEX_CODES = ["SP500", "NDX100", "STOXX600"] as const;
export type IndexCode = (typeof INDEX_CODES)[number];

export const RECOMMENDATIONS: Recommendation[] = ["STRONG_BUY", "BUY", "HOLD", "SELL", "STRONG_SELL"];

/** Filtergruppen der Übersicht ("Kaufen" umfasst auch "Starker Kauf"). */
export const RECOMMENDATION_FILTERS = {
  buy: ["STRONG_BUY", "BUY"],
  hold: ["HOLD"],
  sell: ["SELL", "STRONG_SELL"],
} as const satisfies Record<string, Recommendation[]>;
export type RecommendationFilter = keyof typeof RECOMMENDATION_FILTERS;

export const SORT_OPTIONS = ["score", "score_asc", "upside", "momentum", "name"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const LIST_COLUMNS =
  "symbol, ticker, name, exchange, country, currency, sector, indices, recommendation, score_overall, score_technical, score_quality, score_growth, score_valuation, score_analysts, score_insider, previous_recommendation, recommendation_changed_at, price, return_3m, analyst_count, analyst_upside";

export interface StockListRow {
  symbol: string;
  ticker: string;
  name: string;
  exchange: string | null;
  country: string | null;
  currency: string | null;
  sector: string | null;
  indices: IndexCode[];
  recommendation: Recommendation;
  score_overall: number;
  score_technical: number | null;
  score_quality: number | null;
  score_growth: number | null;
  score_valuation: number | null;
  score_analysts: number | null;
  score_insider: number | null;
  previous_recommendation: Recommendation | null;
  recommendation_changed_at: string | null;
  price: number | null;
  return_3m: number | null;
  analyst_count: number | null;
  analyst_upside: number | null;
}

export interface StockDetailRow extends StockListRow {
  isin: string | null;
  industry: string | null;
  data_coverage: number;
  price_date: string | null;
  return_1m: number | null;
  return_12m: number | null;
  analyst_strong_buy: number | null;
  analyst_buy: number | null;
  analyst_hold: number | null;
  analyst_sell: number | null;
  analyst_strong_sell: number | null;
  analyst_target: number | null;
  market_cap: number | null;
  fundamentals: Fundamentals | null;
  technical: TechnicalSnapshot | null;
  signals: Partial<Record<CategoryKey, Signal[]>>;
  chart: ChartData | null;
  methodology_version: string;
  analyzed_at: string;
}

/** URL-Slug ohne Punkt: Pfade mit "." schließt der Proxy-Matcher (proxy.ts)
 * als Dateien aus, die Locale-Weiterleitung würde dann nicht greifen.
 * "BRK-B.US" -> "BRK-B_US". */
export function symbolToSlug(symbol: string): string {
  return symbol.replace(".", "_");
}

export function slugToSymbol(slug: string): string | null {
  const decoded = decodeURIComponent(slug).toUpperCase();
  if (!/^[A-Z0-9-]{1,15}_[A-Z0-9]{1,10}$/.test(decoded)) return null;
  return decoded.replace("_", ".");
}

/** Fundamental-Gesamtwert für kompakte Darstellungen: gewichtetes Mittel
 * aus Qualität, Wachstum und Bewertung (gleiche Gewichte wie im Gesamtscore). */
export function fundamentalScore(row: Pick<StockListRow, "score_quality" | "score_growth" | "score_valuation">): number | null {
  const parts = [
    { s: row.score_quality, w: 0.2 },
    { s: row.score_growth, w: 0.15 },
    { s: row.score_valuation, w: 0.15 },
  ].filter((p) => p.s !== null) as { s: number; w: number }[];
  if (parts.length === 0) return null;
  const w = parts.reduce((a, p) => a + p.w, 0);
  return Math.round(parts.reduce((a, p) => a + p.s * p.w, 0) / w);
}
