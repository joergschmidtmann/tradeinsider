export interface HeroStat {
  value: string;
  label: string;
}

/** Compact KPI strip along the bottom of the hero — a 2x2 grid on mobile,
 * a single row with thin dividers (no card/border of its own) on larger
 * screens, per the "part of the hero, not its own card" design. */
export function HeroStats({ stats }: { stats: HeroStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:flex sm:flex-nowrap sm:gap-0">
      {stats.map((stat, i) => (
        <div key={stat.label} className={`sm:px-6 ${i === 0 ? "sm:pl-0" : "sm:border-l sm:border-white/10"}`}>
          <div className="font-mono text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</div>
          <div className="mt-1 text-xs text-muted">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
