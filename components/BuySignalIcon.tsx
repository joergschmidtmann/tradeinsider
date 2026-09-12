import { BUY_SIGNAL_COLOR, type BuySignalTier } from "@/lib/buySignal";

/** Rising-arrow buy-signal icon, color-coded by purchase-size tier — replaces
 * the old numeric 0-100 insider-score ring. Purely presentational: callers
 * pass the already-translated `label`, used as both the accessible name and
 * the hover tooltip. Omit `label` for a purely decorative use (e.g. next to
 * visible text that already says it) — the icon is then aria-hidden instead.
 * `animated` draws the two strokes in on mount, left-to-right — used for the
 * homepage hero's signal cards only; every other usage stays static. */
export function BuySignalIcon({
  tier,
  label,
  size = 28,
  animated = false,
}: {
  tier: BuySignalTier;
  label?: string;
  size?: number;
  animated?: boolean;
}) {
  const strokeStyle = animated
    ? { strokeDasharray: 40, strokeDashoffset: 40, animation: "hero-line-draw 0.8s 0.2s ease-out forwards" }
    : undefined;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={BUY_SIGNAL_COLOR[tier]}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      {label && <title>{label}</title>}
      <polyline points="2.5 17 9 10.5 13 14.5 21.5 5" style={strokeStyle} />
      <polyline points="15 5 21.5 5 21.5 11.5" style={strokeStyle} />
    </svg>
  );
}
