const PALETTE = [
  { bg: "rgba(168, 85, 247, 0.18)", fg: "#c084fc" },
  { bg: "rgba(45, 212, 191, 0.18)", fg: "#2dd4bf" },
  { bg: "rgba(56, 189, 248, 0.18)", fg: "#38bdf8" },
  { bg: "rgba(251, 146, 60, 0.18)", fg: "#fb923c" },
  { bg: "rgba(74, 222, 128, 0.18)", fg: "#4ade80" },
  { bg: "rgba(244, 114, 182, 0.18)", fg: "#f472b6" },
];

function paletteIndex(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return hash % PALETTE.length;
}

/** Letter-circle placeholder logo for a company row — no real logo assets
 * yet, so each company gets a deterministic color (hashed from its name) and
 * its first letter, matching the same company consistently across renders. */
export function CompanyAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  const { bg, fg } = PALETTE[paletteIndex(name)];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{ width: size, height: size, backgroundColor: bg, color: fg }}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
