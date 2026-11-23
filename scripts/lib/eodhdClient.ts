/**
 * Fetch wrapper for EODHD (eodhd.com) — the single data source for the stock
 * analysis: end-of-day prices, fundamentals (incl. the Wall Street analyst
 * consensus in `AnalystRatings`) and index constituents, for US and European
 * exchanges alike.
 *
 * Plan requirement: "Fundamentals Data Feed" or "All-In-One" (EOD prices +
 * fundamentals). A fundamentals request costs 10 API calls, an EOD request 1,
 * so a full daily run over ~1,100 stocks costs roughly 12,000 calls — well
 * within the 100,000/day limit of the paid plans. The free plan (20 calls/day)
 * is NOT sufficient. Commercial display of the data on a public website needs
 * EODHD's commercial license — clarify with EODHD before launch.
 */
const API_TOKEN = process.env.EODHD_API_TOKEN;
if (!API_TOKEN) {
  throw new Error("EODHD_API_TOKEN environment variable is required.");
}

const BASE_URL = "https://eodhd.com/api";

// Paid plans allow 1,000 requests/minute; stay comfortably below.
const MIN_DELAY_MS = 120;
let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const wait = lastRequestAt + MIN_DELAY_MS - Date.now();
  lastRequestAt = Math.max(Date.now(), lastRequestAt + MIN_DELAY_MS);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}

async function getJson(path: string, params: Record<string, string> = {}): Promise<unknown> {
  const query = new URLSearchParams({ ...params, api_token: API_TOKEN as string, fmt: "json" });
  const url = `${BASE_URL}${path}?${query}`;
  for (let attempt = 1; ; attempt++) {
    await throttle();
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status === 404) return null;
    // 429 = rate limit, 5xx = transient: retry with backoff.
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise((resolve) => setTimeout(resolve, 2_000 * attempt));
      continue;
    }
    throw new Error(`EODHD ${path} failed: HTTP ${res.status}`);
  }
}

export interface EodhdBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

/** Daily bars from `from` (YYYY-MM-DD) until today, oldest first. */
export async function fetchEod(symbol: string, from: string): Promise<EodhdBar[]> {
  const data = await getJson(`/eod/${encodeURIComponent(symbol)}`, { from, period: "d", order: "a" });
  return Array.isArray(data) ? (data as EodhdBar[]) : [];
}

/** Only the sections the analysis needs — the full fundamentals document
 * (earnings history, holders, outstanding shares, ...) is several MB. */
const FUNDAMENTALS_FILTER = [
  "General",
  "Highlights",
  "Valuation",
  "Technicals",
  "AnalystRatings",
  "Financials::Balance_Sheet::yearly",
  "Financials::Cash_Flow::yearly",
  "Financials::Income_Statement::yearly",
].join(",");

export async function fetchFundamentals(symbol: string): Promise<Record<string, unknown> | null> {
  const data = await getJson(`/fundamentals/${encodeURIComponent(symbol)}`, { filter: FUNDAMENTALS_FILTER });
  return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
}

export interface IndexComponent {
  code: string;
  exchange: string;
  name: string;
  sector: string | null;
  industry: string | null;
}

/** Current constituents of an index, e.g. "SXXP.INDX" (STOXX Europe 600). */
export async function fetchIndexComponents(indexSymbol: string): Promise<IndexComponent[]> {
  type RawComponent = { Code?: string; Exchange?: string; Name?: string; Sector?: string; Industry?: string };
  const raw = (await getJson(`/fundamentals/${encodeURIComponent(indexSymbol)}`, { filter: "Components" })) as
    | Record<string, unknown>
    | null;
  if (!raw || typeof raw !== "object") return [];
  // A single filter returns the section itself; tolerate the wrapped form too.
  const data = (raw.Components ?? raw) as Record<string, RawComponent>;
  return Object.values(data)
    .filter((c) => c && c.Code && c.Exchange)
    .map((c) => ({
      code: c.Code as string,
      exchange: c.Exchange as string,
      name: c.Name ?? (c.Code as string),
      sector: c.Sector || null,
      industry: c.Industry || null,
    }));
}
