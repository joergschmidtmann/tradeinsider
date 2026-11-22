// Datenmodell der automatisierten Aktienanalyse (technisch + fundamental +
// Analysten + Insider). Bewusst provider-unabhängig: scripts/lib/eodhdMapper.ts
// übersetzt die Rohdaten des Datenanbieters in diese Typen, die gesamte
// Bewertungslogik in lib/analysis/* arbeitet nur hiermit. Ein Anbieterwechsel
// betrifft daher nur den Mapper/Client, nicht die Scores.

export interface PriceBar {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  /** Split-/dividendenbereinigter Schlusskurs. */
  close: number;
  volume: number;
}

/** Alle Kennzahlen als Dezimalwerte (0.12 = 12 %), null = nicht verfügbar. */
export interface Fundamentals {
  marketCap: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  evToEbitda: number | null;
  dividendYield: number | null;
  fcfYield: number | null;

  profitMargin: number | null;
  operatingMargin: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;

  revenueGrowthYoY: number | null;
  earningsGrowthYoY: number | null;
  revenueCagr3y: number | null;
  /** Erwartetes EPS-Wachstum laufendes -> nächstes Geschäftsjahr (Konsens). */
  epsGrowthNextYear: number | null;
}

export interface AnalystConsensus {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  /** Durchschnittliches Konsens-Kursziel in Handelswährung. */
  targetPrice: number | null;
}

export interface InsiderActivity {
  /** Insider-Käufe (Vorstand/Aufsichtsrat) der letzten 90 Tage. */
  purchases: number;
  /** Insider-Verkäufe der letzten 90 Tage. */
  sales: number;
  /** Höchster insider_score (0-100) unter diesen Käufen, null = keine Käufe. */
  bestPurchaseScore: number | null;
}

export type Tone = "bullish" | "bearish" | "neutral";

/** Ein einzelner, übersetzbarer Analysebefund. `code` ist der i18n-Schlüssel
 * unter stockAnalysis.signals.*, `values` die Platzhalter dafür. */
export interface Signal {
  code: string;
  tone: Tone;
  values?: Record<string, number>;
}

export type CategoryKey = "technical" | "quality" | "growth" | "valuation" | "analysts" | "insider";

export interface CategoryResult {
  /** 0-100 oder null, wenn für diese Kategorie keine Daten vorliegen. */
  score: number | null;
  signals: Signal[];
}

export type Recommendation = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";

export interface TechnicalSnapshot {
  price: number;
  sma50: number | null;
  sma200: number | null;
  rsi14: number | null;
  macdHistogram: number | null;
  return1m: number | null;
  return3m: number | null;
  return12m: number | null;
  high52w: number | null;
  low52w: number | null;
  volatility: number | null;
}

export interface AnalysisResult {
  recommendation: Recommendation;
  scoreOverall: number;
  /** Anteil (0-1) der Kategoriegewichte, für die Daten vorlagen. */
  dataCoverage: number;
  categories: Record<CategoryKey, CategoryResult>;
  technical: TechnicalSnapshot | null;
  analystUpside: number | null;
}

/** Kompakte Kursreihe (letzte ~12 Monate) für den Chart der Detailseite. */
export interface ChartData {
  dates: string[];
  close: number[];
  sma50: (number | null)[];
  sma200: (number | null)[];
}
