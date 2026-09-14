/** Small live-indicator pill above the hero headline — a pulsing accent dot
 * plus a short status line. The pulse reuses the same keyframe as the rest
 * of the homepage's live indicators. */
export function LiveStatus({ label }: { label: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-[11px] tracking-wider text-muted uppercase">
      <span className="relative flex h-[7px] w-[7px] shrink-0">
        <span className="absolute h-[7px] w-[7px] rounded-full bg-gradient-accent" />
        <span className="absolute -inset-[5px] animate-[home-livepulse_2.2s_ease-out_infinite] rounded-full border border-[var(--accent-from)] motion-reduce:animate-none" />
      </span>
      {label}
    </p>
  );
}
