export interface StatDelta {
  text: string;
  positive: boolean;
}

export function StatTile({
  icon,
  value,
  label,
  delta,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  delta: StatDelta | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-[var(--accent-from)]">{icon}</span>
      <div className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
      {delta && <div className={`mt-2 text-xs font-medium ${delta.positive ? "text-[var(--accent-from)]" : "text-muted"}`}>{delta.text}</div>}
    </div>
  );
}
