import { useTranslations } from "next-intl";

const SEGMENTS = [
  { key: "strongBuy", color: "bg-emerald-400" },
  { key: "buy", color: "bg-green-400" },
  { key: "hold", color: "bg-zinc-400" },
  { key: "sell", color: "bg-orange-400" },
  { key: "strongSell", color: "bg-red-400" },
] as const;

export type AnalystCounts = Record<(typeof SEGMENTS)[number]["key"], number>;

export function AnalystDistribution({ counts }: { counts: AnalystCounts }) {
  const t = useTranslations("stockAnalysis.analystRatings");
  const total = SEGMENTS.reduce((a, s) => a + counts[s.key], 0);
  if (total === 0) return <p className="text-sm text-muted">{t("none")}</p>;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
        {SEGMENTS.map((s) =>
          counts[s.key] > 0 ? (
            <div key={s.key} className={s.color} style={{ width: `${(counts[s.key] / total) * 100}%` }} title={`${t(s.key)}: ${counts[s.key]}`} />
          ) : null
        )}
      </div>
      <ul className="mt-3 grid grid-cols-5 gap-1 text-center text-xs">
        {SEGMENTS.map((s) => (
          <li key={s.key}>
            <div className="flex items-center justify-center gap-1.5 text-muted">
              <span className={`inline-block h-2 w-2 rounded-full ${s.color}`} />
              <span className="truncate">{t(s.key)}</span>
            </div>
            <div className="mt-0.5 font-mono text-sm text-foreground">{counts[s.key]}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
