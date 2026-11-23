/**
 * Translates raw EODHD responses into the provider-neutral model in
 * lib/analysis/model.ts. Pure functions (no network) so they can be tested
 * against fixtures — see eodhdMapper.test.ts.
 *
 * EODHD returns most numbers as strings, uses null/"0"/"NA" inconsistently
 * for missing values, and — when several `filter` sections are requested —
 * keys the response by the filter path ("Financials::Balance_Sheet::yearly")
 * instead of nesting it. Both shapes are accepted here.
 */
import type { AnalystConsensus, Fundamentals, PriceBar } from "@/lib/analysis/model";
import type { EodhdBar } from "./eodhdClient";

type Obj = Record<string, unknown>;

export function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "" || value === "NA" || value === "None") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Like num(), but treats 0 as "missing" — EODHD reports unavailable ratios as 0. */
function ratio(value: unknown): number | null {
  const n = num(value);
  return n === 0 ? null : n;
}

function section(doc: Obj, path: string): Obj | null {
  if (doc[path] && typeof doc[path] === "object") return doc[path] as Obj;
  let cur: unknown = doc;
  for (const part of path.split("::")) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Obj)[part];
  }
  return cur && typeof cur === "object" ? (cur as Obj) : null;
}

/** Yearly statement entries, newest first. */
function yearly(doc: Obj, path: string): Obj[] {
  const s = section(doc, path);
  if (!s) return [];
  return Object.values(s)
    .filter((e): e is Obj => !!e && typeof e === "object" && typeof (e as Obj).date === "string")
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function mapBars(raw: EodhdBar[]): PriceBar[] {
  const out: PriceBar[] = [];
  for (const b of raw) {
    const close = num(b.close);
    const adj = num(b.adjusted_close) ?? close;
    if (close === null || adj === null || close <= 0 || adj <= 0) continue;
    // Scale OHLC by the adjustment factor so splits don't show up as crashes.
    const f = adj / close;
    out.push({
      date: b.date,
      open: (num(b.open) ?? close) * f,
      high: (num(b.high) ?? close) * f,
      low: (num(b.low) ?? close) * f,
      close: adj,
      volume: num(b.volume) ?? 0,
    });
  }
  return out;
}

export interface GeneralInfo {
  name: string | null;
  isin: string | null;
  lei: string | null;
  currency: string | null;
  country: string | null;
  sector: string | null;
  industry: string | null;
  exchange: string | null;
}

export function mapGeneral(doc: Obj): GeneralInfo {
  const g = section(doc, "General") ?? {};
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    name: str(g.Name),
    isin: str(g.ISIN),
    lei: str(g.LEI),
    currency: str(g.CurrencyCode),
    country: str(g.CountryISO) ?? str(g.CountryName),
    sector: str(g.Sector) ?? str(g.GicSector),
    industry: str(g.Industry) ?? str(g.GicIndustry),
    exchange: str(g.Exchange),
  };
}

export function mapFundamentals(doc: Obj): Fundamentals | null {
  const h = section(doc, "Highlights");
  const v = section(doc, "Valuation");
  if (!h && !v) return null;
  const hl = h ?? {};
  const val = v ?? {};

  const balance = yearly(doc, "Financials::Balance_Sheet::yearly");
  const cashflow = yearly(doc, "Financials::Cash_Flow::yearly");
  const income = yearly(doc, "Financials::Income_Statement::yearly");

  const bs = balance[0];
  const equity = bs ? num(bs.totalStockholderEquity) : null;
  const debt = bs ? (num(bs.shortLongTermDebtTotal) ?? sumNullable(num(bs.longTermDebt), num(bs.shortTermDebt))) : null;
  const curAssets = bs ? num(bs.totalCurrentAssets) : null;
  const curLiab = bs ? num(bs.totalCurrentLiabilities) : null;

  const marketCap = num(hl.MarketCapitalization);
  const fcf = cashflow[0] ? num(cashflow[0].freeCashFlow) : null;

  let revenueCagr3y: number | null = null;
  if (income.length >= 4) {
    const rNow = num(income[0].totalRevenue);
    const rThen = num(income[3].totalRevenue);
    if (rNow && rThen && rNow > 0 && rThen > 0) revenueCagr3y = (rNow / rThen) ** (1 / 3) - 1;
  }

  const epsCur = num(hl.EPSEstimateCurrentYear);
  const epsNext = num(hl.EPSEstimateNextYear);
  const epsGrowthNextYear = epsCur && epsNext && epsCur > 0 ? epsNext / epsCur - 1 : null;

  return {
    marketCap,
    trailingPE: ratio(val.TrailingPE) ?? ratio(hl.PERatio),
    forwardPE: ratio(val.ForwardPE),
    pegRatio: ratio(hl.PEGRatio),
    priceToBook: ratio(val.PriceBookMRQ),
    priceToSales: ratio(val.PriceSalesTTM),
    evToEbitda: ratio(val.EnterpriseValueEbitda),
    dividendYield: num(hl.DividendYield),
    fcfYield: fcf !== null && marketCap && marketCap > 0 ? fcf / marketCap : null,
    profitMargin: num(hl.ProfitMargin),
    operatingMargin: num(hl.OperatingMarginTTM),
    returnOnEquity: num(hl.ReturnOnEquityTTM),
    returnOnAssets: num(hl.ReturnOnAssetsTTM),
    debtToEquity: debt !== null && equity !== null && equity !== 0 ? debt / equity : null,
    currentRatio: curAssets !== null && curLiab ? curAssets / curLiab : null,
    revenueGrowthYoY: num(hl.QuarterlyRevenueGrowthYOY),
    earningsGrowthYoY: num(hl.QuarterlyEarningsGrowthYOY),
    revenueCagr3y,
    epsGrowthNextYear,
  };
}

function sumNullable(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return (a ?? 0) + (b ?? 0);
}

export function mapAnalysts(doc: Obj): AnalystConsensus | null {
  const a = section(doc, "AnalystRatings");
  if (!a) return null;
  const c: AnalystConsensus = {
    strongBuy: num(a.StrongBuy) ?? 0,
    buy: num(a.Buy) ?? 0,
    hold: num(a.Hold) ?? 0,
    sell: num(a.Sell) ?? 0,
    strongSell: num(a.StrongSell) ?? 0,
    targetPrice: ratio(a.TargetPrice) ?? ratio(section(doc, "Highlights")?.WallStreetTargetPrice),
  };
  const total = c.strongBuy + c.buy + c.hold + c.sell + c.strongSell;
  return total === 0 && c.targetPrice === null ? null : c;
}
