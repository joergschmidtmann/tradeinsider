// Zentrale, leicht änderbare Konfiguration der automatisierten Aktienanalyse.
// Speist sowohl die Berechnung (lib/analysis/engine.ts) als auch die
// /methodik-Seite, damit dokumentierte und tatsächlich angewendete Methodik
// nicht auseinanderlaufen. Jede Änderung an Gewichten/Schwellen => Version
// hochzählen; die Version wird mit jeder Analyse gespeichert.
//
// TODO LEGAL REVIEW – Rating-System: Gewichtung, Score-Bänder und die
// Empfehlungs-Schwellen sind vor dem kommerziellen Launch rechtlich zu prüfen
// (Kapitalmarktrecht, insb. MAR Art. 20 und Delegierte Verordnung (EU)
// 2016/958 zur sachgerechten Darstellung von Anlageempfehlungen).

import type { CategoryKey, Recommendation } from "@/lib/analysis/model";

export const SCORE_CATEGORIES: { key: CategoryKey; label: string; weight: number }[] = [
  { key: "technical", label: "Technische Analyse", weight: 0.2 },
  { key: "quality", label: "Fundamental: Qualität", weight: 0.2 },
  { key: "growth", label: "Fundamental: Wachstum", weight: 0.15 },
  { key: "valuation", label: "Fundamental: Bewertung", weight: 0.15 },
  { key: "analysts", label: "Analysten-Konsens", weight: 0.2 },
  { key: "insider", label: "Insider-Aktivität", weight: 0.1 },
];

/** Gesamtscore-Schwellen für die Empfehlung (jeweils "mindestens"). */
export const RECOMMENDATION_THRESHOLDS: { recommendation: Recommendation; minScore: number }[] = [
  { recommendation: "STRONG_BUY", minScore: 72 },
  { recommendation: "BUY", minScore: 60 },
  { recommendation: "HOLD", minScore: 41 },
  { recommendation: "SELL", minScore: 29 },
  { recommendation: "STRONG_SELL", minScore: 0 },
];

/** Unterhalb dieses Datenabdeckungsgrads (Anteil der Kategoriegewichte mit
 * Daten) wird keine Kauf-/Verkaufsempfehlung ausgesprochen, sondern HOLD. */
export const MIN_COVERAGE_FOR_ACTION = 0.6;

/** Konsistenzregel: Ein "STRONG_*"-Rating setzt voraus, dass Technik und
 * Analysten nicht klar gegen die Richtung zeigen. */
export const STRONG_CONFIRMATION_SCORE = 45;

// Ältere, dreistufige Darstellung (u. a. lib/analysis/types.ts).
export type Rating = "BUY" | "HOLD" | "SELL";

export const DEFAULT_ANALYSIS_HORIZON_MONTHS = 12;

export const METHODOLOGY_VERSION = "1.0.0";
