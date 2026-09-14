import type { BuySignalTier } from "@/lib/buySignal";
import { BuySignalBadge } from "./BuySignalBadge";

export function HeroSignalCard({
  ticker,
  issuerName,
  roleLabel,
  amountLabel,
  tier,
  tierLabel,
  pctChange,
  size = "md",
  style,
  className = "",
}: {
  ticker: string;
  issuerName: string;
  roleLabel: string | null;
  amountLabel: string;
  tier: BuySignalTier;
  tierLabel: string;
  pctChange: number | null;
  size?: "sm" | "md";
  style?: React.CSSProperties;
  className?: string;
}) {
  const positive = pctChange !== null && pctChange >= 0;
  return (
    <div
      className={`rounded-2xl border p-4 shadow-[0_0_24px_-8px_rgba(120,255,70,0.25)] backdrop-blur-sm ${size === "sm" ? "w-44" : "w-56"} ${className}`}
      style={{ background: "rgba(5, 15, 11, 0.88)", borderColor: "rgba(120,255,70,0.25)", ...style }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-mono text-base font-bold text-foreground">{ticker}</div>
          <div className="truncate text-xs text-muted">{issuerName}</div>
        </div>
        {pctChange !== null && (
          <span className={`shrink-0 text-sm font-semibold whitespace-nowrap ${positive ? "text-[var(--accent-from)]" : "text-red-400"}`}>
            {positive ? "↗" : "↘"} {positive ? "+" : ""}
            {pctChange.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <BuySignalBadge tier={tier} label={tierLabel} animated />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
        {roleLabel && <span className="truncate">{roleLabel}</span>}
        <span className="shrink-0 font-semibold text-foreground">{amountLabel}</span>
      </div>
    </div>
  );
}
