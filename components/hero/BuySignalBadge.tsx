import { BUY_SIGNAL_COLOR, type BuySignalTier } from "@/lib/buySignal";
import { BuySignalIcon } from "@/components/BuySignalIcon";

/** Uppercase tier pill for the hero's floating signal cards — same tier
 * colors as BuySignalIcon, but with the label spelled out (the icon here is
 * decorative since the text already says it). */
export function BuySignalBadge({ tier, label, animated = false }: { tier: BuySignalTier; label: string; animated?: boolean }) {
  const color = BUY_SIGNAL_COLOR[tier];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase"
      style={{ color, backgroundColor: `${color}26` }}
    >
      <BuySignalIcon tier={tier} size={12} animated={animated} />
      {label}
    </span>
  );
}
