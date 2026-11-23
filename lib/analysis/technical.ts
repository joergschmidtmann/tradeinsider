import type { CategoryResult, PriceBar, Signal, TechnicalSnapshot } from "./model";
import { annualizedVolatility, macd, periodReturn, rsi, sma } from "./indicators";
import { linearScore, round, weightedAverage } from "./scoring";

// Technische Analyse: Trend (gleitende Durchschnitte), Momentum (Renditen),
// MACD, RSI und Abstand zum 52-Wochen-Hoch. Mindestens ~1 Jahr Historie
// liefert alle Teilwerte; mit weniger fallen einzelne Teile weg und der Rest
// wird renormalisiert.

const TRADING_DAYS_1M = 21;
const TRADING_DAYS_3M = 63;
const TRADING_DAYS_12M = 252;

export function technicalSnapshot(bars: PriceBar[]): TechnicalSnapshot | null {
  if (bars.length < 30) return null;
  const closes = bars.map((b) => b.close);
  const last252 = bars.slice(-TRADING_DAYS_12M);
  const m = macd(closes);
  return {
    price: closes[closes.length - 1],
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    rsi14: rsi(closes, 14),
    macdHistogram: m?.histogram ?? null,
    return1m: periodReturn(closes, TRADING_DAYS_1M),
    return3m: periodReturn(closes, TRADING_DAYS_3M),
    return12m: periodReturn(closes, TRADING_DAYS_12M),
    high52w: Math.max(...last252.map((b) => b.high)),
    low52w: Math.min(...last252.map((b) => b.low)),
    volatility: annualizedVolatility(closes),
  };
}

function pct(value: number): number {
  return round(value * 100, 1);
}

export function scoreTechnical(bars: PriceBar[]): { result: CategoryResult; snapshot: TechnicalSnapshot | null } {
  const snap = technicalSnapshot(bars);
  if (!snap) return { result: { score: null, signals: [] }, snapshot: null };

  const closes = bars.map((b) => b.close);
  const signals: Signal[] = [];
  const { price, sma50, sma200 } = snap;

  // --- Trend ---------------------------------------------------------------
  let trend: number | null = null;
  if (sma200 !== null && sma50 !== null) {
    let t = 0;
    t += price > sma200 ? 35 : 0;
    t += price > sma50 ? 25 : 0;
    t += sma50 > sma200 ? 25 : 0;
    // Steigung des 200-Tage-Durchschnitts über einen Monat
    const sma200Prev = sma(closes.slice(0, -TRADING_DAYS_1M), 200);
    if (sma200Prev !== null && sma200 > sma200Prev) t += 15;
    trend = t;

    const dist = price / sma200 - 1;
    signals.push(
      price > sma200
        ? { code: "aboveSma200", tone: "bullish", values: { pct: pct(dist) } }
        : { code: "belowSma200", tone: "bearish", values: { pct: pct(Math.abs(dist)) } }
    );
    const sma50Prev = sma(closes.slice(0, -5), 50);
    const sma200Prev5 = sma(closes.slice(0, -5), 200);
    if (sma50Prev !== null && sma200Prev5 !== null) {
      if (sma50Prev <= sma200Prev5 && sma50 > sma200) signals.push({ code: "goldenCross", tone: "bullish" });
      else if (sma50Prev >= sma200Prev5 && sma50 < sma200) signals.push({ code: "deathCross", tone: "bearish" });
      else signals.push(sma50 > sma200 ? { code: "uptrend", tone: "bullish" } : { code: "downtrend", tone: "bearish" });
    }
  } else if (sma50 !== null) {
    trend = price > sma50 ? 65 : 35;
  }

  // --- Momentum ------------------------------------------------------------
  // 12-1-Monats-Momentum (letzter Monat ausgeklammert, vermeidet den
  // kurzfristigen Umkehreffekt) plus 3-Monats-Momentum.
  const mom12_1 = periodReturn(closes, TRADING_DAYS_12M - TRADING_DAYS_1M, TRADING_DAYS_1M);
  const momentum = weightedAverage([
    { score: mom12_1 === null ? null : linearScore(mom12_1, -0.3, 0.4), weight: 0.6 },
    { score: snap.return3m === null ? null : linearScore(snap.return3m, -0.15, 0.2), weight: 0.4 },
  ]);
  if (snap.return12m !== null) {
    if (snap.return12m > 0.25) signals.push({ code: "strongMomentum", tone: "bullish", values: { pct: pct(snap.return12m) } });
    else if (snap.return12m < -0.2) signals.push({ code: "weakMomentum", tone: "bearish", values: { pct: pct(snap.return12m) } });
  }

  // --- MACD ----------------------------------------------------------------
  let macdScore: number | null = null;
  const m = macd(closes);
  if (m) {
    const rising = m.prevHistogram !== null && m.histogram > m.prevHistogram;
    if (m.histogram > 0) macdScore = rising ? 85 : 65;
    else macdScore = rising ? 40 : 15;
    if (m.prevHistogram !== null && m.prevHistogram <= 0 && m.histogram > 0) {
      signals.push({ code: "macdBullishCross", tone: "bullish" });
    } else if (m.prevHistogram !== null && m.prevHistogram >= 0 && m.histogram < 0) {
      signals.push({ code: "macdBearishCross", tone: "bearish" });
    }
  }

  // --- RSI -----------------------------------------------------------------
  let rsiScore: number | null = null;
  const r = snap.rsi14;
  if (r !== null) {
    if (r < 30) rsiScore = 60; // überverkauft: Gegenbewegung wahrscheinlicher
    else if (r < 45) rsiScore = 35;
    else if (r < 55) rsiScore = 50;
    else if (r < 70) rsiScore = 75; // gesunder Aufwärtstrend
    else if (r < 80) rsiScore = 55;
    else rsiScore = 30; // stark überkauft
    const rv = round(r, 0);
    if (r >= 70) signals.push({ code: "rsiOverbought", tone: "bearish", values: { rsi: rv } });
    else if (r <= 30) signals.push({ code: "rsiOversold", tone: "bullish", values: { rsi: rv } });
    else signals.push({ code: "rsiNeutral", tone: "neutral", values: { rsi: rv } });
  }

  // --- Nähe zum 52-Wochen-Hoch ----------------------------------------------
  let highScore: number | null = null;
  if (snap.high52w && snap.high52w > 0) {
    const fromHigh = price / snap.high52w - 1; // <= 0
    highScore = linearScore(fromHigh, -0.4, 0);
    if (fromHigh > -0.03) signals.push({ code: "near52wHigh", tone: "bullish" });
    else if (snap.low52w && price / snap.low52w - 1 < 0.05) signals.push({ code: "near52wLow", tone: "bearish" });
  }

  const score = weightedAverage([
    { score: trend, weight: 0.3 },
    { score: momentum, weight: 0.3 },
    { score: macdScore, weight: 0.15 },
    { score: rsiScore, weight: 0.15 },
    { score: highScore, weight: 0.1 },
  ]);

  return { result: { score: score === null ? null : round(score), signals }, snapshot: snap };
}
