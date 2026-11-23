import type { CategoryResult, Fundamentals, Signal } from "./model";
import { linearScore, median, percentileRank, round, weightedAverage } from "./scoring";

// Fundamentalanalyse in drei Kategorien:
//   - Qualität:   Profitabilität, Kapitalrendite, Verschuldung, Liquidität
//   - Wachstum:   Umsatz-/Gewinnwachstum (berichtet + Konsens-Erwartung)
//   - Bewertung:  Multiples relativ zur eigenen Branche (Sektor-Peers aus dem
//                 gesamten Analyse-Universum), da "KGV 25" bei Software etwas
//                 anderes bedeutet als bei Versorgern.

function pct(v: number): number {
  return round(v * 100, 1);
}

export function scoreQuality(f: Fundamentals): CategoryResult {
  const signals: Signal[] = [];

  const roe = f.returnOnEquity;
  // Extrem hohe ROE entsteht oft durch sehr kleines/negatives Eigenkapital
  // (Aktienrückkäufe) — daher bei 40 % kappen statt weiter zu belohnen.
  const roeScore = roe === null ? null : linearScore(Math.min(roe, 0.4), 0, 0.25);
  if (roe !== null) {
    if (roe >= 0.2) signals.push({ code: "highRoe", tone: "bullish", values: { pct: pct(roe) } });
    else if (roe < 0.05) signals.push({ code: "lowRoe", tone: "bearish", values: { pct: pct(roe) } });
  }

  const om = f.operatingMargin;
  const marginScore = om === null ? null : linearScore(om, 0, 0.3);
  if (om !== null) {
    if (om >= 0.25) signals.push({ code: "highMargin", tone: "bullish", values: { pct: pct(om) } });
    else if (om < 0) signals.push({ code: "negativeMargin", tone: "bearish", values: { pct: pct(om) } });
  }

  const de = f.debtToEquity;
  let debtScore: number | null = null;
  if (de !== null) {
    // Negative D/E = negatives Eigenkapital -> neutral-schwach statt "schuldenfrei".
    debtScore = de < 0 ? 30 : linearScore(de, 2.5, 0.2);
    if (de >= 0 && de < 0.3) signals.push({ code: "lowDebt", tone: "bullish", values: { ratio: round(de, 2) } });
    else if (de > 2) signals.push({ code: "highDebt", tone: "bearish", values: { ratio: round(de, 2) } });
  }

  const cr = f.currentRatio;
  const liquidityScore = cr === null ? null : linearScore(cr, 0.7, 2);

  const pm = f.profitMargin;
  const profitScore = pm === null ? null : linearScore(pm, -0.05, 0.2);

  const score = weightedAverage([
    { score: roeScore, weight: 0.3 },
    { score: marginScore, weight: 0.25 },
    { score: profitScore, weight: 0.15 },
    { score: debtScore, weight: 0.2 },
    { score: liquidityScore, weight: 0.1 },
  ]);
  return { score: score === null ? null : round(score), signals };
}

export function scoreGrowth(f: Fundamentals): CategoryResult {
  const signals: Signal[] = [];

  const rev = f.revenueGrowthYoY;
  const eps = f.earningsGrowthYoY;
  const cagr = f.revenueCagr3y;
  const fwd = f.epsGrowthNextYear;

  if (rev !== null) {
    if (rev >= 0.15) signals.push({ code: "strongRevenueGrowth", tone: "bullish", values: { pct: pct(rev) } });
    else if (rev < 0) signals.push({ code: "revenueDecline", tone: "bearish", values: { pct: pct(rev) } });
  }
  if (fwd !== null) {
    if (fwd >= 0.15) signals.push({ code: "strongEpsOutlook", tone: "bullish", values: { pct: pct(fwd) } });
    else if (fwd < 0) signals.push({ code: "weakEpsOutlook", tone: "bearish", values: { pct: pct(fwd) } });
  }

  // Gewinnwachstum ist bei kleinen Basiswerten extrem volatil -> kappen.
  const clampGrowth = (g: number) => Math.max(-1, Math.min(g, 1));
  const score = weightedAverage([
    { score: rev === null ? null : linearScore(rev, -0.1, 0.25), weight: 0.3 },
    { score: cagr === null ? null : linearScore(cagr, -0.05, 0.2), weight: 0.2 },
    { score: eps === null ? null : linearScore(clampGrowth(eps), -0.2, 0.3), weight: 0.2 },
    { score: fwd === null ? null : linearScore(clampGrowth(fwd), -0.1, 0.25), weight: 0.3 },
  ]);
  return { score: score === null ? null : round(score), signals };
}

/** Bewertungs-Multiples, für die "niedriger = günstiger" gilt. */
export const VALUATION_METRICS = ["forwardPE", "trailingPE", "evToEbitda", "priceToSales", "priceToBook", "pegRatio"] as const;
export type ValuationMetric = (typeof VALUATION_METRICS)[number];

/** Werte jedes Multiples über alle Aktien derselben Branche (nur positive,
 * sinnvolle Werte — negative KGVs etc. sind nicht vergleichbar). */
export type PeerMultiples = Record<ValuationMetric, number[]>;

export function emptyPeerMultiples(): PeerMultiples {
  return { forwardPE: [], trailingPE: [], evToEbitda: [], priceToSales: [], priceToBook: [], pegRatio: [] };
}

/** Obergrenzen, oberhalb derer ein Multiple als Ausreißer gilt und nicht in
 * den Peer-Vergleich eingeht (verhindert, dass ein KGV von 900 den Median
 * verzerrt). */
const MULTIPLE_CAPS: Record<ValuationMetric, number> = {
  forwardPE: 200,
  trailingPE: 300,
  evToEbitda: 150,
  priceToSales: 80,
  priceToBook: 100,
  pegRatio: 20,
};

export function usableMultiple(metric: ValuationMetric, value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0 && value <= MULTIPLE_CAPS[metric];
}

export function addToPeers(peers: PeerMultiples, f: Fundamentals): void {
  for (const m of VALUATION_METRICS) {
    const v = f[m];
    if (usableMultiple(m, v)) peers[m].push(v);
  }
}

const VALUATION_WEIGHTS: Record<ValuationMetric, number> = {
  forwardPE: 0.3,
  trailingPE: 0.1,
  evToEbitda: 0.2,
  priceToSales: 0.15,
  priceToBook: 0.1,
  pegRatio: 0.15,
};

/** Mindestanzahl Peers, damit ein Branchenvergleich aussagekräftig ist. */
const MIN_PEERS = 5;

export function scoreValuation(f: Fundamentals, peers: PeerMultiples): CategoryResult {
  const signals: Signal[] = [];
  const parts: { score: number | null; weight: number }[] = [];

  for (const m of VALUATION_METRICS) {
    const v = f[m];
    const peerValues = peers[m];
    if (v === null) continue;
    if (m === "forwardPE" || m === "trailingPE") {
      // Verlust (negatives KGV) ist bewertungsseitig klar unattraktiv.
      if (v <= 0) {
        parts.push({ score: 10, weight: VALUATION_WEIGHTS[m] });
        continue;
      }
    }
    if (!usableMultiple(m, v)) {
      parts.push({ score: v > 0 ? 5 : null, weight: VALUATION_WEIGHTS[m] });
      continue;
    }
    if (peerValues.length < MIN_PEERS) continue;
    const rank = percentileRank(v, peerValues);
    if (rank === null) continue;
    parts.push({ score: 100 - rank, weight: VALUATION_WEIGHTS[m] });
  }

  // Free-Cashflow-Rendite absolut: 0 % -> 0, 8 % -> 100
  if (f.fcfYield !== null) parts.push({ score: linearScore(f.fcfYield, 0, 0.08), weight: 0.15 });

  const peMedian = median(peers.forwardPE);
  if (f.forwardPE !== null && f.forwardPE > 0 && peMedian !== null && peers.forwardPE.length >= MIN_PEERS) {
    const rel = f.forwardPE / peMedian - 1;
    if (rel <= -0.2) signals.push({ code: "cheapVsSector", tone: "bullish", values: { pe: round(f.forwardPE, 1), median: round(peMedian, 1) } });
    else if (rel >= 0.3) signals.push({ code: "expensiveVsSector", tone: "bearish", values: { pe: round(f.forwardPE, 1), median: round(peMedian, 1) } });
    else signals.push({ code: "fairVsSector", tone: "neutral", values: { pe: round(f.forwardPE, 1), median: round(peMedian, 1) } });
  } else if (f.forwardPE !== null && f.forwardPE <= 0) {
    signals.push({ code: "lossMaking", tone: "bearish" });
  }
  if (f.pegRatio !== null && f.pegRatio > 0 && f.pegRatio < 1) {
    signals.push({ code: "lowPeg", tone: "bullish", values: { peg: round(f.pegRatio, 2) } });
  }
  if (f.fcfYield !== null && f.fcfYield >= 0.06) {
    signals.push({ code: "highFcfYield", tone: "bullish", values: { pct: pct(f.fcfYield) } });
  }

  const score = weightedAverage(parts);
  return { score: score === null ? null : round(score), signals };
}
