import type { AnalystConsensus, CategoryResult, InsiderActivity, Signal } from "./model";
import { linearScore, round, weightedAverage } from "./scoring";

export function analystCount(c: AnalystConsensus): number {
  return c.strongBuy + c.buy + c.hold + c.sell + c.strongSell;
}

/** Konsens auf der Skala 1 (Strong Sell) bis 5 (Strong Buy). */
export function consensusMean(c: AnalystConsensus): number | null {
  const n = analystCount(c);
  if (n === 0) return null;
  return (c.strongBuy * 5 + c.buy * 4 + c.hold * 3 + c.sell * 2 + c.strongSell * 1) / n;
}

export function analystUpside(c: AnalystConsensus | null, price: number | null): number | null {
  if (!c || c.targetPrice === null || c.targetPrice <= 0 || !price || price <= 0) return null;
  return c.targetPrice / price - 1;
}

/** Ab dieser Analystenzahl gilt der Konsens als voll belastbar; darunter wird
 * der Score Richtung neutral (50) gezogen. */
const FULL_CONFIDENCE_ANALYSTS = 8;

export function scoreAnalysts(c: AnalystConsensus | null, price: number | null): CategoryResult {
  if (!c) return { score: null, signals: [] };
  const n = analystCount(c);
  const mean = consensusMean(c);
  const upside = analystUpside(c, price);
  if (mean === null && upside === null) return { score: null, signals: [] };

  const signals: Signal[] = [];
  if (mean !== null) {
    const buyShare = (c.strongBuy + c.buy) / n;
    const sellShare = (c.sell + c.strongSell) / n;
    const values = { n, pct: round(buyShare * 100, 0) };
    if (mean >= 4) signals.push({ code: "analystsBuy", tone: "bullish", values });
    else if (mean <= 2.6 || sellShare >= 0.3) signals.push({ code: "analystsSell", tone: "bearish", values: { n, pct: round(sellShare * 100, 0) } });
    else signals.push({ code: "analystsHold", tone: "neutral", values });
  }
  if (upside !== null) {
    const values = { pct: round(upside * 100, 1) };
    if (upside >= 0.15) signals.push({ code: "targetUpside", tone: "bullish", values });
    else if (upside <= -0.05) signals.push({ code: "targetDownside", tone: "bearish", values: { pct: round(-upside * 100, 1) } });
    else signals.push({ code: "targetLimited", tone: "neutral", values });
  }

  const raw = weightedAverage([
    { score: mean === null ? null : linearScore(mean, 2, 4.6), weight: 0.6 },
    { score: upside === null ? null : linearScore(upside, -0.1, 0.35), weight: 0.4 },
  ]);
  if (raw === null) return { score: null, signals };
  const confidence = Math.min(1, n / FULL_CONFIDENCE_ANALYSTS);
  return { score: round(50 + (raw - 50) * confidence), signals };
}

/** Insider-Aktivität: Käufe von Vorstand/Aufsichtsrat sind eines der
 * verlässlichsten positiven Signale; Verkäufe sind deutlich schwächer
 * (Diversifikation, Steuern, Optionsausübung) und werden milder gewichtet.
 * Keine Aktivität = neutral (50), damit fehlende Meldungen nicht bestrafen. */
export function scoreInsider(a: InsiderActivity | null): CategoryResult {
  if (!a) return { score: null, signals: [] };
  const signals: Signal[] = [];
  let score = 50;
  if (a.purchases > 0) {
    const strength = a.bestPurchaseScore ?? 50;
    score = 60 + (strength / 100) * 30 + Math.min(a.purchases - 1, 3) * 3;
    signals.push({ code: "insiderBuying", tone: "bullish", values: { n: a.purchases } });
  }
  if (a.sales > 0) {
    const net = a.sales - a.purchases;
    if (net >= 3) score -= 15;
    else if (net >= 1) score -= 7;
    if (a.purchases === 0) signals.push({ code: "insiderSelling", tone: net >= 3 ? "bearish" : "neutral", values: { n: a.sales } });
  }
  if (a.purchases === 0 && a.sales === 0) signals.push({ code: "insiderNone", tone: "neutral" });
  return { score: round(Math.max(0, Math.min(100, score))), signals };
}
