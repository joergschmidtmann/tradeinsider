import { test } from "node:test";
import assert from "node:assert/strict";
import { emaSeries, macd, periodReturn, rsi, sma } from "./indicators";
import { linearScore, percentileRank, weightedAverage } from "./scoring";
import { scoreTechnical } from "./technical";
import { addToPeers, emptyPeerMultiples, scoreGrowth, scoreQuality, scoreValuation } from "./fundamental";
import { consensusMean, scoreAnalysts, scoreInsider } from "./analysts";
import { analyzeStock, recommendationForScore } from "./engine";
import type { Fundamentals, PriceBar } from "./model";

function bars(closes: number[]): PriceBar[] {
  return closes.map((c, i) => ({
    date: new Date(Date.UTC(2025, 0, 1) + i * 86_400_000).toISOString().slice(0, 10),
    open: c,
    high: c * 1.01,
    low: c * 0.99,
    close: c,
    volume: 1_000_000,
  }));
}

/** Gleichmäßiger Trend mit leichtem Rauschen, damit RSI/MACD definiert sind. */
function trend(n: number, start: number, dailyDrift: number): number[] {
  const out: number[] = [];
  let p = start;
  for (let i = 0; i < n; i++) {
    p *= 1 + dailyDrift + (i % 2 === 0 ? 0.004 : -0.004);
    out.push(p);
  }
  return out;
}

const baseFundamentals: Fundamentals = {
  marketCap: 1e11,
  trailingPE: 20,
  forwardPE: 18,
  pegRatio: 1.5,
  priceToBook: 4,
  priceToSales: 3,
  evToEbitda: 12,
  dividendYield: 0.02,
  fcfYield: 0.04,
  profitMargin: 0.12,
  operatingMargin: 0.15,
  returnOnEquity: 0.15,
  returnOnAssets: 0.07,
  debtToEquity: 0.8,
  currentRatio: 1.4,
  revenueGrowthYoY: 0.06,
  earningsGrowthYoY: 0.08,
  revenueCagr3y: 0.05,
  epsGrowthNextYear: 0.07,
};

test("sma / ema basics", () => {
  assert.equal(sma([1, 2, 3, 4, 5], 5), 3);
  assert.equal(sma([1, 2], 5), null);
  const e = emaSeries([1, 2, 3, 4, 5, 6], 3);
  assert.equal(e[1], null);
  assert.equal(e[2], 2);
  assert.equal(e[3], 3); // 4*0.5 + 2*0.5
});

test("rsi is 100 for a strictly rising series and ~0 for a falling one", () => {
  const up = Array.from({ length: 30 }, (_, i) => 10 + i);
  assert.equal(rsi(up), 100);
  const down = up.slice().reverse();
  assert.ok((rsi(down) as number) < 1);
});

test("macd histogram is positive in an accelerating uptrend", () => {
  const closes = Array.from({ length: 80 }, (_, i) => 100 + i * i * 0.05);
  const m = macd(closes);
  assert.ok(m && m.macd > 0);
});

test("periodReturn with skipRecent", () => {
  const closes = [100, 110, 120, 130];
  assert.ok(Math.abs((periodReturn(closes, 3) as number) - 0.3) < 1e-9);
  assert.ok(Math.abs((periodReturn(closes, 2, 1) as number) - 0.2) < 1e-9);
  assert.equal(periodReturn(closes, 10), null);
});

test("scoring helpers", () => {
  assert.equal(linearScore(5, 0, 10), 50);
  assert.equal(linearScore(20, 0, 10), 100);
  assert.equal(linearScore(1, 2, 0), 50); // niedriger ist besser
  assert.equal(weightedAverage([{ score: null, weight: 1 }, { score: 80, weight: 1 }]), 80);
  assert.equal(weightedAverage([{ score: null, weight: 1 }]), null);
  assert.equal(percentileRank(5, [1, 2, 3, 4, 6, 7, 8, 9]), 50);
});

test("technical score: uptrend clearly beats downtrend", () => {
  const up = scoreTechnical(bars(trend(300, 50, 0.002))).result.score as number;
  const down = scoreTechnical(bars(trend(300, 150, -0.002))).result.score as number;
  assert.ok(up > 60, `uptrend score ${up}`);
  assert.ok(down < 35, `downtrend score ${down}`);
  const sig = scoreTechnical(bars(trend(300, 50, 0.002))).result.signals.map((s) => s.code);
  assert.ok(sig.includes("aboveSma200"));
});

test("technical score is null without enough history", () => {
  assert.equal(scoreTechnical(bars([1, 2, 3])).result.score, null);
});

test("quality and growth reward better fundamentals", () => {
  const strong: Fundamentals = { ...baseFundamentals, returnOnEquity: 0.3, operatingMargin: 0.32, debtToEquity: 0.1, revenueGrowthYoY: 0.3, epsGrowthNextYear: 0.3 };
  const weak: Fundamentals = { ...baseFundamentals, returnOnEquity: 0.01, operatingMargin: -0.05, debtToEquity: 3, revenueGrowthYoY: -0.1, epsGrowthNextYear: -0.2 };
  assert.ok((scoreQuality(strong).score as number) > (scoreQuality(weak).score as number) + 40);
  assert.ok((scoreGrowth(strong).score as number) > (scoreGrowth(weak).score as number) + 40);
});

test("valuation is sector-relative", () => {
  const peers = emptyPeerMultiples();
  for (const pe of [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]) {
    addToPeers(peers, { ...baseFundamentals, forwardPE: pe, trailingPE: pe + 2, evToEbitda: pe / 2, priceToSales: pe / 6, priceToBook: pe / 5, pegRatio: pe / 12 });
  }
  const cheap = scoreValuation({ ...baseFundamentals, forwardPE: 9, trailingPE: 10, evToEbitda: 4, priceToSales: 1, priceToBook: 1.5, pegRatio: 0.7 }, peers);
  const pricey = scoreValuation({ ...baseFundamentals, forwardPE: 40, trailingPE: 45, evToEbitda: 25, priceToSales: 8, priceToBook: 10, pegRatio: 4 }, peers);
  assert.ok((cheap.score as number) > 70, `cheap ${cheap.score}`);
  assert.ok((pricey.score as number) < 30, `pricey ${pricey.score}`);
  assert.ok(cheap.signals.some((s) => s.code === "cheapVsSector"));
  const loss = scoreValuation({ ...baseFundamentals, forwardPE: -5, trailingPE: -8 }, peers);
  assert.ok(loss.signals.some((s) => s.code === "lossMaking"));
});

test("analyst consensus and confidence shrinkage", () => {
  const bullish = { strongBuy: 20, buy: 10, hold: 2, sell: 0, strongSell: 0, targetPrice: 130 };
  assert.ok((consensusMean(bullish) as number) > 4.4);
  assert.ok((scoreAnalysts(bullish, 100).score as number) > 80);
  // nur ein Analyst: stark Richtung 50 gezogen
  const single = { strongBuy: 1, buy: 0, hold: 0, sell: 0, strongSell: 0, targetPrice: 200 };
  const s = scoreAnalysts(single, 100).score as number;
  assert.ok(s > 50 && s < 60, `single ${s}`);
  const bearish = { strongBuy: 0, buy: 1, hold: 5, sell: 6, strongSell: 3, targetPrice: 80 };
  assert.ok((scoreAnalysts(bearish, 100).score as number) < 25);
});

test("insider: purchases bullish, nothing neutral", () => {
  assert.equal(scoreInsider({ purchases: 0, sales: 0, bestPurchaseScore: null }).score, 50);
  assert.ok((scoreInsider({ purchases: 2, sales: 0, bestPurchaseScore: 80 }).score as number) > 80);
  assert.ok((scoreInsider({ purchases: 0, sales: 5, bestPurchaseScore: null }).score as number) < 40);
});

test("recommendation thresholds", () => {
  assert.equal(recommendationForScore(80), "STRONG_BUY");
  assert.equal(recommendationForScore(65), "BUY");
  assert.equal(recommendationForScore(50), "HOLD");
  assert.equal(recommendationForScore(35), "SELL");
  assert.equal(recommendationForScore(10), "STRONG_SELL");
});

test("engine: strong stock gets a buy, weak stock a sell", () => {
  const peers = emptyPeerMultiples();
  for (const pe of [10, 12, 14, 16, 18, 20, 22, 24, 26, 28]) {
    addToPeers(peers, { ...baseFundamentals, forwardPE: pe, trailingPE: pe, evToEbitda: pe / 2, priceToSales: pe / 6, priceToBook: pe / 5, pegRatio: pe / 12 });
  }
  const good = analyzeStock({
    bars: bars(trend(300, 50, 0.002)),
    fundamentals: { ...baseFundamentals, returnOnEquity: 0.3, operatingMargin: 0.3, debtToEquity: 0.2, revenueGrowthYoY: 0.25, epsGrowthNextYear: 0.25, revenueCagr3y: 0.2, earningsGrowthYoY: 0.3, forwardPE: 13, evToEbitda: 6, priceToSales: 2, fcfYield: 0.07, pegRatio: 0.8 },
    analysts: { strongBuy: 15, buy: 10, hold: 2, sell: 0, strongSell: 0, targetPrice: 0 },
    insider: { purchases: 1, sales: 0, bestPurchaseScore: 70 },
    sectorPeers: peers,
  });
  assert.ok(good);
  assert.ok(good.recommendation === "BUY" || good.recommendation === "STRONG_BUY", `${good.recommendation} ${good.scoreOverall}`);

  const bad = analyzeStock({
    bars: bars(trend(300, 150, -0.002)),
    fundamentals: { ...baseFundamentals, returnOnEquity: -0.05, operatingMargin: -0.1, profitMargin: -0.15, debtToEquity: 3, currentRatio: 0.6, revenueGrowthYoY: -0.15, epsGrowthNextYear: -0.3, revenueCagr3y: -0.05, earningsGrowthYoY: -0.5, forwardPE: -10, trailingPE: -12, evToEbitda: 40, priceToSales: 6, fcfYield: -0.02, pegRatio: null },
    analysts: { strongBuy: 0, buy: 1, hold: 6, sell: 6, strongSell: 3, targetPrice: 0 },
    insider: { purchases: 0, sales: 4, bestPurchaseScore: null },
    sectorPeers: peers,
  });
  assert.ok(bad);
  assert.ok(bad.recommendation === "SELL" || bad.recommendation === "STRONG_SELL", `${bad.recommendation} ${bad.scoreOverall}`);
});

test("engine: low data coverage forces HOLD", () => {
  const r = analyzeStock({
    bars: bars(trend(300, 50, 0.003)),
    fundamentals: null,
    analysts: null,
    insider: { purchases: 3, sales: 0, bestPurchaseScore: 90 },
    sectorPeers: emptyPeerMultiples(),
  });
  assert.ok(r);
  assert.equal(r.recommendation, "HOLD");
  assert.ok(r.dataCoverage < 0.6);
});
