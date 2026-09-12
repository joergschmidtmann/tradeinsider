const PALETTE = [
  "bg-orange-500/15 text-orange-400",
  "bg-blue-500/15 text-blue-400",
  "bg-slate-500/15 text-slate-300",
  "bg-purple-500/15 text-purple-400",
  "bg-teal-500/15 text-teal-400",
  "bg-pink-500/15 text-pink-400",
  "bg-indigo-500/15 text-indigo-400",
  "bg-amber-500/15 text-amber-400",
];

function paletteIndex(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash % PALETTE.length;
}

/** Colored initials tile standing in for a company logo — this app has no
 * logo assets, so the ticker (or, failing that, the issuer's initials) is
 * rendered on a deterministic, per-company color instead. */
export function TickerBadge({ ticker, issuerName }: { ticker: string | null; issuerName: string }) {
  const label = ticker
    ? ticker.slice(0, 4).toUpperCase()
    : issuerName
        .split(/\s+/)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${PALETTE[paletteIndex(ticker ?? issuerName)]}`}
    >
      {label}
    </span>
  );
}
