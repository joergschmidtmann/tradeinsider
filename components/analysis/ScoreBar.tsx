import { recommendationForScore } from "@/lib/analysis/engine";
import type { Recommendation } from "@/lib/analysis/model";

const COLORS: Record<Recommendation, string> = {
  STRONG_BUY: "bg-emerald-400",
  BUY: "bg-green-400",
  HOLD: "bg-zinc-400",
  SELL: "bg-orange-400",
  STRONG_SELL: "bg-red-400",
};

/** Horizontaler 0-100-Balken; Farbe folgt den Empfehlungsschwellen aus lib/methodology.ts. */
export function scoreColor(score: number): string {
  return COLORS[recommendationForScore(score)];
}

export function ScoreBar({ score, label, className }: { score: number | null; label?: string; className?: string }) {
  return (
    <div className={"flex items-center gap-2 " + (className ?? "")}>
      <div className="h-1.5 w-full min-w-10 overflow-hidden rounded-full bg-surface-2" role="presentation">
        {score !== null && <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: `${score}%` }} />}
      </div>
      <span className="w-7 shrink-0 text-right font-mono text-xs text-foreground tabular-nums" aria-label={label}>
        {score ?? "–"}
      </span>
    </div>
  );
}
