const SIZES = {
  md: { px: 40, stroke: 3.5, text: "text-xs" },
  lg: { px: 64, stroke: 5, text: "text-lg" },
} as const;

/** Circular progress ring for the 0-100 Insider Score — filled proportionally
 * to the score (100 = full circle, 50 = half, etc.), not just color-coded,
 * so the fill itself carries the magnitude at a glance. */
export function ScoreRing({ score, size = "md", tooltip }: { score: number; size?: keyof typeof SIZES; tooltip?: string }) {
  const { px, stroke, text } = SIZES[size];
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: px, height: px }} title={tooltip}>
      <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} className="-rotate-90">
        <circle cx={px / 2} cy={px / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-from)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`absolute font-bold text-foreground ${text}`}>{score}</span>
    </span>
  );
}
