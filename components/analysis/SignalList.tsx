import { useTranslations } from "next-intl";
import type { Signal } from "@/lib/analysis/model";

const TONE: Record<Signal["tone"], string> = {
  bullish: "bg-green-400",
  bearish: "bg-red-400",
  neutral: "bg-zinc-500",
};

export function SignalList({ signals }: { signals: Signal[] }) {
  const t = useTranslations("stockAnalysis.signals");
  if (signals.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1.5 text-sm">
      {signals.map((s, i) => (
        <li key={`${s.code}-${i}`} className="flex items-start gap-2 text-muted">
          <span className={`mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${TONE[s.tone]}`} aria-hidden />
          <span>{t.has(s.code) ? t(s.code, s.values ?? {}) : s.code}</span>
        </li>
      ))}
    </ul>
  );
}
