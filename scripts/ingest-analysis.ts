import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchEod, fetchFundamentals, fetchIndexComponents } from "./lib/eodhdClient";
import { mapAnalysts, mapBars, mapFundamentals, mapGeneral, type GeneralInfo } from "./lib/eodhdMapper";
import { NASDAQ100_TICKERS, SP500_TICKERS } from "./lib/usIndices";
import { analyzeStock } from "@/lib/analysis/engine";
import { addToPeers, emptyPeerMultiples, VALUATION_METRICS, type PeerMultiples } from "@/lib/analysis/fundamental";
import { analystCount } from "@/lib/analysis/analysts";
import type { AnalystConsensus, ChartData, Fundamentals, InsiderActivity, PriceBar } from "@/lib/analysis/model";
import { METHODOLOGY_VERSION } from "@/lib/methodology";

/**
 * Daily stock analysis for S&P 500 + Nasdaq-100 + STOXX Europe 600:
 *
 *   1. Build the universe (US: static index lists in scripts/lib/usIndices.ts;
 *      Europe: current STOXX 600 constituents from EODHD).
 *   2. Fetch ~2 years of daily prices and the fundamentals document (incl.
 *      analyst consensus) per stock.
 *   3. Collect insider purchases/sales of the last 90 days from our own
 *      `transactions` table.
 *   4. Build sector peer groups (valuation is scored relative to the sector)
 *      and run lib/analysis/engine.ts for every stock.
 *   5. Upsert `stock_analysis` (current state) + `stock_analysis_history`.
 *
 * Run after the US close so both US and European prices are final for the day.
 * Optional env: ANALYSIS_LIMIT=20 to test with a small subset.
 */

const STOXX600_INDEX_SYMBOL = process.env.STOXX600_INDEX_SYMBOL || "SXXP.INDX";
const HISTORY_CALENDAR_DAYS = 730; // SMA200 über den gesamten Chartzeitraum braucht >450 Handelstage
const CHART_BARS = 252;
const INSIDER_LOOKBACK_DAYS = 90;
const CONCURRENCY = 4;
const UPSERT_BATCH = 100;
const MIN_PEERS = 5;

type IndexCode = "SP500" | "NDX100" | "STOXX600";

interface UniverseEntry {
  symbol: string;
  ticker: string;
  exchange: string;
  name: string;
  sector: string | null;
  indices: Set<IndexCode>;
}

interface Collected {
  entry: UniverseEntry;
  bars: PriceBar[];
  general: GeneralInfo;
  fundamentals: Fundamentals | null;
  analysts: AnalystConsensus | null;
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}

async function buildUniverse(): Promise<{ universe: UniverseEntry[]; complete: boolean }> {
  const bySymbol = new Map<string, UniverseEntry>();
  const add = (ticker: string, exchange: string, name: string, sector: string | null, index: IndexCode) => {
    const symbol = `${ticker}.${exchange}`;
    const existing = bySymbol.get(symbol);
    if (existing) {
      existing.indices.add(index);
      return;
    }
    bySymbol.set(symbol, { symbol, ticker, exchange, name, sector, indices: new Set([index]) });
  };

  for (const t of SP500_TICKERS) add(t, "US", t, null, "SP500");
  for (const t of NASDAQ100_TICKERS) add(t, "US", t, null, "NDX100");

  let complete = true;
  try {
    const components = await fetchIndexComponents(STOXX600_INDEX_SYMBOL);
    if (components.length < 500) {
      console.error(`STOXX 600 (${STOXX600_INDEX_SYMBOL}): only ${components.length} constituents returned — check the index symbol / plan.`);
      complete = false;
    }
    for (const c of components) add(c.code, c.exchange, c.name, c.sector, "STOXX600");
  } catch (err) {
    console.error(`Could not load STOXX 600 constituents (${STOXX600_INDEX_SYMBOL}):`, err);
    complete = false;
  }

  let universe = [...bySymbol.values()];
  const limit = Number(process.env.ANALYSIS_LIMIT);
  if (limit > 0) {
    universe = universe.slice(0, limit);
    complete = false;
  }
  return { universe, complete };
}

async function collect(entry: UniverseEntry, fromDate: string): Promise<Collected | null> {
  const [rawBars, doc] = await Promise.all([fetchEod(entry.symbol, fromDate), fetchFundamentals(entry.symbol)]);
  const bars = mapBars(rawBars);
  if (bars.length < 30 && !doc) return null;
  return {
    entry,
    bars,
    general: doc ? mapGeneral(doc) : mapGeneral({}),
    fundamentals: doc ? mapFundamentals(doc) : null,
    analysts: doc ? mapAnalysts(doc) : null,
  };
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Insider activity keyed by US ticker and by ISIN/LEI (EU rows carry the
 * issuer's LEI or ISIN in issuer_cik, see scripts/ingest-de.ts / ingest-es.ts). */
async function loadInsiderActivity(supabase: SupabaseClient): Promise<Map<string, InsiderActivity>> {
  const since = new Date();
  since.setDate(since.getDate() - INSIDER_LOOKBACK_DAYS);
  const map = new Map<string, InsiderActivity>();
  const bump = (key: string | null, code: string, score: number | null) => {
    if (!key) return;
    const a = map.get(key) ?? { purchases: 0, sales: 0, bestPurchaseScore: null };
    if (code === "P") {
      a.purchases++;
      if (score !== null) a.bestPurchaseScore = Math.max(a.bestPurchaseScore ?? 0, score);
    } else {
      a.sales++;
    }
    map.set(key, a);
  };

  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("issuer_ticker, issuer_cik, transaction_code, insider_score, source_country")
      .in("role", ["management_board", "supervisory_board"])
      .in("transaction_code", ["P", "S"])
      .gte("transaction_date", since.toISOString().slice(0, 10))
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (row.source_country === "US") bump(row.issuer_ticker ? `T:${row.issuer_ticker}` : null, row.transaction_code, row.insider_score);
      else bump(row.issuer_cik ? `I:${row.issuer_cik}` : null, row.transaction_code, row.insider_score);
    }
    if (data.length < PAGE) break;
  }
  return map;
}

function insiderFor(c: Collected, activity: Map<string, InsiderActivity>): InsiderActivity {
  const keys =
    c.entry.exchange === "US"
      ? [`T:${c.entry.ticker}`, `T:${c.entry.ticker.replace("-", ".")}`]
      : [c.general.isin ? `I:${c.general.isin}` : "", c.general.lei ? `I:${c.general.lei}` : ""];
  for (const k of keys) {
    const a = k && activity.get(k);
    if (a) return a;
  }
  return { purchases: 0, sales: 0, bestPurchaseScore: null };
}

function sectorOf(c: Collected): string {
  return c.general.sector ?? c.entry.sector ?? "Unknown";
}

function buildPeers(collected: Collected[]): (c: Collected) => PeerMultiples {
  const all = emptyPeerMultiples();
  const bySector = new Map<string, PeerMultiples>();
  for (const c of collected) {
    if (!c.fundamentals) continue;
    addToPeers(all, c.fundamentals);
    const s = sectorOf(c);
    if (!bySector.has(s)) bySector.set(s, emptyPeerMultiples());
    addToPeers(bySector.get(s) as PeerMultiples, c.fundamentals);
  }
  // Je Kennzahl: Branchen-Peers, falls genug vorhanden, sonst Gesamtuniversum.
  return (c) => {
    const sector = bySector.get(sectorOf(c));
    const out = emptyPeerMultiples();
    for (const m of VALUATION_METRICS) {
      out[m] = sector && sector[m].length >= MIN_PEERS ? sector[m] : all[m];
    }
    return out;
  };
}

function chartFrom(bars: PriceBar[]): ChartData {
  const closes = bars.map((b) => b.close);
  const start = Math.max(0, bars.length - CHART_BARS);
  const avg = (end: number, period: number) => {
    if (end + 1 < period) return null;
    let s = 0;
    for (let i = end - period + 1; i <= end; i++) s += closes[i];
    return round4(s / period);
  };
  const chart: ChartData = { dates: [], close: [], sma50: [], sma200: [] };
  for (let i = start; i < bars.length; i++) {
    chart.dates.push(bars[i].date);
    chart.close.push(round4(closes[i]));
    chart.sma50.push(avg(i, 50));
    chart.sma200.push(avg(i, 200));
  }
  return chart;
}

function round4(v: number): number {
  return Number(v.toPrecision(6));
}

function nullableRound(v: number | null | undefined, digits = 4): number | null {
  if (v === null || v === undefined || !Number.isFinite(v)) return null;
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

async function main() {
  const supabase = supabaseAdmin();
  const { universe, complete } = await buildUniverse();
  console.log(`Universe: ${universe.length} stocks (${complete ? "complete" : "partial"}).`);

  const from = new Date();
  from.setDate(from.getDate() - HISTORY_CALENDAR_DAYS);
  const fromDate = from.toISOString().slice(0, 10);

  let failed = 0;
  const collectedRaw = await mapWithConcurrency(universe, CONCURRENCY, async (entry, i) => {
    try {
      const c = await collect(entry, fromDate);
      if ((i + 1) % 100 === 0) console.log(`  fetched ${i + 1}/${universe.length}`);
      return c;
    } catch (err) {
      failed++;
      console.error(`Fetch failed for ${entry.symbol}:`, err instanceof Error ? err.message : err);
      return null;
    }
  });
  const collected = collectedRaw.filter((c): c is Collected => c !== null);
  console.log(`Fetched ${collected.length} stocks (${failed} failed, ${universe.length - collected.length - failed} without data).`);

  const insider = await loadInsiderActivity(supabase);
  const peersFor = buildPeers(collected);

  const { data: previousRows, error: prevError } = await supabase
    .from("stock_analysis")
    .select("symbol, recommendation, previous_recommendation, recommendation_changed_at");
  if (prevError) throw prevError;
  const previous = new Map((previousRows ?? []).map((r) => [r.symbol as string, r]));

  const today = new Date().toISOString().slice(0, 10);
  const rows: Record<string, unknown>[] = [];
  const history: Record<string, unknown>[] = [];

  for (const c of collected) {
    const result = analyzeStock({
      bars: c.bars,
      fundamentals: c.fundamentals,
      analysts: c.analysts,
      insider: insiderFor(c, insider),
      sectorPeers: peersFor(c),
    });
    if (!result) continue;

    const prev = previous.get(c.entry.symbol);
    const changed = prev && prev.recommendation !== result.recommendation;
    const lastBar = c.bars[c.bars.length - 1];
    const t = result.technical;

    rows.push({
      symbol: c.entry.symbol,
      ticker: c.entry.ticker,
      name: c.general.name ?? c.entry.name,
      isin: c.general.isin,
      exchange: c.entry.exchange,
      country: c.general.country ?? (c.entry.exchange === "US" ? "US" : null),
      currency: c.general.currency,
      sector: sectorOf(c) === "Unknown" ? null : sectorOf(c),
      industry: c.general.industry,
      indices: [...c.entry.indices],

      recommendation: result.recommendation,
      score_overall: result.scoreOverall,
      score_technical: result.categories.technical.score,
      score_quality: result.categories.quality.score,
      score_growth: result.categories.growth.score,
      score_valuation: result.categories.valuation.score,
      score_analysts: result.categories.analysts.score,
      score_insider: result.categories.insider.score,
      data_coverage: result.dataCoverage,

      previous_recommendation: changed ? prev.recommendation : (prev?.previous_recommendation ?? null),
      recommendation_changed_at: changed ? today : (prev?.recommendation_changed_at ?? (prev ? null : today)),

      price: lastBar ? nullableRound(lastBar.close) : null,
      price_date: lastBar?.date ?? null,
      return_1m: nullableRound(t?.return1m),
      return_3m: nullableRound(t?.return3m),
      return_12m: nullableRound(t?.return12m),

      analyst_count: c.analysts ? analystCount(c.analysts) : null,
      analyst_strong_buy: c.analysts?.strongBuy ?? null,
      analyst_buy: c.analysts?.buy ?? null,
      analyst_hold: c.analysts?.hold ?? null,
      analyst_sell: c.analysts?.sell ?? null,
      analyst_strong_sell: c.analysts?.strongSell ?? null,
      analyst_target: c.analysts?.targetPrice ?? null,
      analyst_upside: nullableRound(result.analystUpside),

      market_cap: c.fundamentals?.marketCap ?? null,
      fundamentals: c.fundamentals,
      technical: t,
      signals: Object.fromEntries(Object.entries(result.categories).map(([k, v]) => [k, v.signals])),
      chart: c.bars.length > 0 ? chartFrom(c.bars) : null,

      methodology_version: METHODOLOGY_VERSION,
      analyzed_at: new Date().toISOString(),
    });
    history.push({
      symbol: c.entry.symbol,
      analysis_date: today,
      recommendation: result.recommendation,
      score_overall: result.scoreOverall,
      price: lastBar ? nullableRound(lastBar.close) : null,
      methodology_version: METHODOLOGY_VERSION,
    });
  }

  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const { error } = await supabase.from("stock_analysis").upsert(rows.slice(i, i + UPSERT_BATCH), { onConflict: "symbol" });
    if (error) throw error;
    const { error: hError } = await supabase
      .from("stock_analysis_history")
      .upsert(history.slice(i, i + UPSERT_BATCH), { onConflict: "symbol,analysis_date" });
    if (hError) throw hError;
  }

  // Aktien, die aus allen Indizes gefallen sind, entfernen — nur nach einem
  // vollständigen Lauf, sonst würde ein Teilausfall die Tabelle leeren.
  if (complete && rows.length > 0.9 * universe.length) {
    const keep = new Set(universe.map((u) => u.symbol));
    const stale = [...previous.keys()].filter((s) => !keep.has(s));
    if (stale.length > 0) {
      const { error } = await supabase.from("stock_analysis").delete().in("symbol", stale);
      if (error) throw error;
      console.log(`Removed ${stale.length} stock(s) no longer in any index.`);
    }
  }

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.recommendation as string;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Done. ${rows.length} analyses written.`, counts);

  if (rows.length === 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
