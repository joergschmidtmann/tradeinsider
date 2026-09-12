export interface ActivityDay {
  date: string; // YYYY-MM-DD
  buys: number;
  sells: number;
}

const WIDTH = 640;
const HEIGHT = 200;
const PADDING = { top: 10, right: 10, bottom: 0, left: 24 };

/** Plain inline-SVG bar chart — no charting library in this project yet, and
 * a fixed 30-point buys/sells comparison doesn't need one. */
export function ActivityChart({
  data,
  buysLabel,
  sellsLabel,
  emptyLabel,
  formatTickDate,
}: {
  data: ActivityDay[];
  buysLabel: string;
  sellsLabel: string;
  emptyLabel: string;
  formatTickDate: (iso: string) => string;
}) {
  const total = data.reduce((sum, d) => sum + d.buys + d.sells, 0);
  if (total === 0) {
    return <div className="flex h-48 items-center justify-center text-center text-sm text-muted">{emptyLabel}</div>;
  }

  const max = Math.max(1, ...data.map((d) => Math.max(d.buys, d.sells)));
  const niceMax = Math.max(4, Math.ceil(max / 4) * 4);
  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;
  const groupWidth = chartW / data.length;
  const barWidth = Math.max(2, groupWidth * 0.32);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(niceMax * f));
  const lastIndex = data.length - 1;
  const tickDateIndices = [0, Math.round(lastIndex / 3), Math.round((2 * lastIndex) / 3), lastIndex];

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-gradient-accent" /> {buysLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-white/25" /> {sellsLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={`${buysLabel} / ${sellsLabel}`}>
        {ticks.map((tick) => {
          const y = PADDING.top + chartH - (tick / niceMax) * chartH;
          return (
            <g key={tick}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" />
              <text x={0} y={y + 3} fontSize="9" fill="var(--muted)">
                {tick}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = PADDING.left + i * groupWidth + (groupWidth - barWidth * 2) / 2;
          const buyH = (d.buys / niceMax) * chartH;
          const sellH = (d.sells / niceMax) * chartH;
          return (
            <g key={d.date}>
              <rect x={x} y={PADDING.top + chartH - buyH} width={barWidth} height={Math.max(buyH, d.buys > 0 ? 1 : 0)} rx={1} fill="var(--accent-from)" />
              <rect
                x={x + barWidth}
                y={PADDING.top + chartH - sellH}
                width={barWidth}
                height={Math.max(sellH, d.sells > 0 ? 1 : 0)}
                rx={1}
                fill="rgba(255,255,255,0.25)"
              />
            </g>
          );
        })}
      </svg>
      <div className="relative mt-1 h-4 text-[10px] text-muted">
        {tickDateIndices.map((idx) => (
          <span
            key={idx}
            className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
            style={{ left: `${((PADDING.left + idx * groupWidth + groupWidth / 2) / WIDTH) * 100}%` }}
          >
            {formatTickDate(data[idx].date)}
          </span>
        ))}
      </div>
    </div>
  );
}
