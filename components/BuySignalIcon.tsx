import type { BuySignalTier } from "@/lib/buySignal";

const TIER_COLOR: Record<BuySignalTier, string> = {
  strong: "#22c55e",
  medium: "#eab308",
  weak: "#ef4444",
};

/** Rising-arrow buy-signal icon, color-coded by purchase-size tier — replaces
 * the old numeric 0-100 insider-score ring. Purely presentational: callers
 * pass the already-translated `label` (used as both the accessible name and
 * the hover tooltip). */
export function BuySignalIcon({ tier, label, size = 28 }: { tier: BuySignalTier; label: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={TIER_COLOR[tier]}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <polyline points="2.5 17 9 10.5 13 14.5 21.5 5" />
      <polyline points="15 5 21.5 5 21.5 11.5" />
    </svg>
  );
}
