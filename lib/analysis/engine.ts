import type {
  AnalysisResult,
  AnalystConsensus,
  CategoryKey,
  CategoryResult,
  Fundamentals,
  InsiderActivity,
  PriceBar,
  Recommendation,
} from "./model";
import { scoreTechnical } from "./technical";
import { scoreGrowth, scoreQuality, scoreValuation, type PeerMultiples } from "./fundamental";
import { analystUpside, scoreAnalysts, scoreInsider } from "./analysts";
import { round } from "./scoring";
import {
  MIN_COVERAGE_FOR_ACTION,
  RECOMMENDATION_THRESHOLDS,
  SCORE_CATEGORIES,
  STRONG_CONFIRMATION_SCORE,
} from "@/lib/methodology";

export interface AnalysisInput {
  bars: PriceBar[];
  fundamentals: Fundamentals | null;
  analysts: AnalystConsensus | null;
  insider: InsiderActivity | null;
  sectorPeers: PeerMultiples;
}

const EMPTY: CategoryResult = { score: null, signals: [] };

export function recommendationForScore(score: number): Recommendation {
  for (const t of RECOMMENDATION_THRESHOLDS) {
    if (score >= t.minScore) return t.recommendation;
  }
  return "STRONG_SELL";
}

export function analyzeStock(input: AnalysisInput): AnalysisResult | null {
  const { result: technical, snapshot } = scoreTechnical(input.bars);
  const price = snapshot?.price ?? null;

  const categories: Record<CategoryKey, CategoryResult> = {
    technical,
    quality: input.fundamentals ? scoreQuality(input.fundamentals) : EMPTY,
    growth: input.fundamentals ? scoreGrowth(input.fundamentals) : EMPTY,
    valuation: input.fundamentals ? scoreValuation(input.fundamentals, input.sectorPeers) : EMPTY,
    analysts: scoreAnalysts(input.analysts, price),
    insider: scoreInsider(input.insider),
  };

  let sum = 0;
  let usedWeight = 0;
  let totalWeight = 0;
  for (const c of SCORE_CATEGORIES) {
    totalWeight += c.weight;
    const s = categories[c.key].score;
    if (s === null) continue;
    sum += s * c.weight;
    usedWeight += c.weight;
  }
  if (usedWeight === 0) return null;

  // Die Insider-Kategorie ist immer "neutral verfügbar" und zählt daher nicht
  // zur Datenabdeckung — sonst würde sie fehlende echte Daten kaschieren.
  const insiderWeight = SCORE_CATEGORIES.find((c) => c.key === "insider")?.weight ?? 0;
  const coverage =
    (usedWeight - (categories.insider.score !== null ? insiderWeight : 0)) / (totalWeight - insiderWeight);

  const scoreOverall = round(sum / usedWeight);
  let recommendation = recommendationForScore(scoreOverall);

  if (coverage < MIN_COVERAGE_FOR_ACTION) {
    recommendation = "HOLD";
  } else {
    const tech = categories.technical.score;
    const analysts = categories.analysts.score;
    if (recommendation === "STRONG_BUY") {
      const contradicted = [tech, analysts].some((s) => s !== null && s < STRONG_CONFIRMATION_SCORE);
      if (contradicted) recommendation = "BUY";
    } else if (recommendation === "STRONG_SELL") {
      const contradicted = [tech, analysts].some((s) => s !== null && s > 100 - STRONG_CONFIRMATION_SCORE);
      if (contradicted) recommendation = "SELL";
    }
  }

  return {
    recommendation,
    scoreOverall,
    dataCoverage: round(coverage, 2),
    categories,
    technical: snapshot,
    analystUpside: analystUpside(input.analysts, price),
  };
}
