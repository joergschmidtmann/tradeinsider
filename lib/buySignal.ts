export type BuySignalTier = "strong" | "medium" | "weak";

const STRONG_THRESHOLD_USD = 500_000;
const MEDIUM_THRESHOLD_USD = 100_000;

/** Single source of truth for tier colors, shared by every buy-signal UI so
 * they never drift apart. */
export const BUY_SIGNAL_COLOR: Record<BuySignalTier, string> = {
  strong: "#22c55e",
  medium: "#eab308",
  weak: "#ef4444",
};

/** Classifies a purchase into a buy-signal tier by its USD-converted value —
 * replaces the old 0-100 insider_score. Purely a function of purchase size:
 * >= $500k is "strong", $100k-$499,999 is "medium", $1-$99,999 is "weak". */
export function buySignalTier(valueUsd: number | null): BuySignalTier | null {
  if (valueUsd === null || valueUsd <= 0) return null;
  if (valueUsd >= STRONG_THRESHOLD_USD) return "strong";
  if (valueUsd >= MEDIUM_THRESHOLD_USD) return "medium";
  return "weak";
}
