import { useTranslations } from "next-intl";
import type { Recommendation } from "@/lib/analysis/model";

const STYLES: Record<Recommendation, string> = {
  STRONG_BUY: "bg-emerald-500/20 text-emerald-300 ring-emerald-400/40",
  BUY: "bg-green-500/15 text-green-300 ring-green-400/30",
  HOLD: "bg-zinc-500/15 text-zinc-300 ring-zinc-400/30",
  SELL: "bg-orange-500/15 text-orange-300 ring-orange-400/30",
  STRONG_SELL: "bg-red-500/20 text-red-300 ring-red-400/40",
};

export function RecommendationBadge({ value, size = "sm" }: { value: Recommendation; size?: "sm" | "lg" }) {
  const t = useTranslations("stockAnalysis.recommendations");
  const sizing = size === "lg" ? "px-4 py-1.5 text-base" : "px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ring-1 ring-inset ${sizing} ${STYLES[value]}`}>
      {t(value)}
    </span>
  );
}
