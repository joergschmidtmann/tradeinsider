import { useTranslations } from "next-intl";
import type { ChartData } from "@/lib/analysis/model";

const W = 720;
const H = 260;
const PAD = { top: 12, right: 56, bottom: 24, left: 8 };

function path(values: (number | null)[], x: (i: number) => number, y: (v: number) => number): string {
  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v === null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
    pen = true;
  });
  return d;
}

/** Statischer SVG-Kurschart (12 Monate) mit 50- und 200-Tage-Linie. */
export function PriceChart({ chart, locale, currency }: { chart: ChartData; locale: string; currency: string | null }) {
  const t = useTranslations("stockAnalysis.chart");
  const n = chart.close.length;
  if (n < 2) return null;

  const all = [...chart.close, ...chart.sma50, ...chart.sma200].filter((v): v is number => v !== null);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const x = (i: number) => PAD.left + (i / (n - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - min) / span) * (H - PAD.top - PAD.bottom);

  const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: max >= 100 ? 0 : 2 });
  const dateFmt = new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" });
  const ticks = [max, min + span / 2, min];
  const up = chart.close[n - 1] >= chart.close[0];
  const closeColor = up ? "#4ade80" : "#f87171";

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t("aria")}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.08)" />
            <text x={W - PAD.right + 6} y={y(v) + 4} fontSize="11" fill="#86868b">
              {fmt.format(v)}
            </text>
          </g>
        ))}
        <path d={path(chart.sma200, x, y)} fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={path(chart.sma50, x, y)} fill="none" stroke="#60a5fa" strokeWidth="1.5" />
        <path d={path(chart.close, x, y)} fill="none" stroke={closeColor} strokeWidth="2" />
        <text x={PAD.left} y={H - 6} fontSize="11" fill="#86868b">
          {dateFmt.format(new Date(chart.dates[0]))}
        </text>
        <text x={W - PAD.right} y={H - 6} fontSize="11" fill="#86868b" textAnchor="end">
          {dateFmt.format(new Date(chart.dates[n - 1]))}
        </text>
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4" style={{ background: closeColor }} />
          {t("price")}
          {currency ? ` (${currency})` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-blue-400" />
          {t("sma50")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-amber-400" />
          {t("sma200")}
        </span>
      </figcaption>
    </figure>
  );
}
