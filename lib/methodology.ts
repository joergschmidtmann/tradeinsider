// TODO – Methodik vor Launch final festlegen. Diese Datei ist eine vorläufige,
// leicht änderbare Konfiguration für die noch nicht gebaute TradeInsider-
// Intelligence-Bewertungslogik (Scores, Ratings, Kursziele). Sie speist sowohl
// die /methodik-Seite als auch (künftig) die echte Scoring-Implementierung.
//
// TODO LEGAL REVIEW – Rating-System: Gewichtung, Score-Bänder und die
// BUY/HOLD/SELL-Schwellen unten sind fachlich und rechtlich (Kapitalmarktrecht,
// insb. MAR Art. 20 und die Delegierte Verordnung (EU) 2016/958 zur sachgerechten
// Darstellung von Anlageempfehlungen) vor dem kommerziellen Launch zu prüfen.

export const SCORE_CATEGORIES = [
  { key: "fundamental", label: "Fundamental", weight: 0.3 },
  { key: "growth", label: "Growth", weight: 0.2 },
  { key: "valuation", label: "Valuation", weight: 0.2 },
  { key: "technical", label: "Technical", weight: 0.15 },
  { key: "insiderActivity", label: "Insider Activity", weight: 0.15 },
] as const;

export type ScoreCategoryKey = (typeof SCORE_CATEGORIES)[number]["key"];

export const SCORE_BANDS = [
  { min: 90, max: 100, label: "Exceptional" },
  { min: 80, max: 89, label: "Strong" },
  { min: 70, max: 79, label: "Positive" },
  { min: 50, max: 69, label: "Neutral" },
  { min: 30, max: 49, label: "Weak" },
  { min: 0, max: 29, label: "Very Weak" },
] as const;

export type Rating = "BUY" | "HOLD" | "SELL";

// Erwartetes Kurspotenzial über den Analyse-Horizont (Standard-Vorschlag: 12 Monate).
export const RATING_THRESHOLDS: { rating: Rating; description: string }[] = [
  { rating: "BUY", description: "erwartetes Kurspotenzial > +15 %" },
  { rating: "HOLD", description: "zwischen -10 % und +15 %" },
  { rating: "SELL", description: "unter -10 %" },
];

export const DEFAULT_ANALYSIS_HORIZON_MONTHS = 12;

export const METHODOLOGY_VERSION = "0.1.0-draft";
