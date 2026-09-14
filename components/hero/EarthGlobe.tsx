import { WORLD_LAND_PATH } from "./worldMapPath";

export type LabelDirection = "up-left" | "up-right" | "down-left" | "down-right";

export interface GlobeMarker {
  id: string;
  label: string;
  sublabel: string;
  lat: number;
  lng: number;
  isHub?: boolean;
  /** Which way the label/leader-line points — the four real cities we plot
   * sit close enough together on a full world map that the default (always
   * up-right) would stack their boxes on top of each other. */
  labelDir?: LabelDirection;
}

export interface GlobeLegend {
  title: string;
  subtitle: string;
  activityLabel: string;
  connectionsLabel: string;
}

// Matches the projection baked into worldMapPath.ts (see
// scripts/gen-world-map-path.cjs) — change one, regenerate the other.
const WIDTH = 1000;
const HEIGHT = 460;
const LON_MIN = -170;
const LON_MAX = 170;
const LAT_MIN = -57;
const LAT_MAX = 78;

function project(lat: number, lon: number): { x: number; y: number } {
  return {
    x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * WIDTH,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * HEIGHT,
  };
}

const DOT_PATTERN_SIZE = 4.5;
const LEADER_OFFSET = 24;

function leaderEndpoint(p: { x: number; y: number }, dir: LabelDirection): { x: number; y: number } {
  const dx = dir.endsWith("left") ? -LEADER_OFFSET : LEADER_OFFSET;
  const dy = dir.startsWith("up") ? -LEADER_OFFSET : LEADER_OFFSET;
  return { x: p.x + dx, y: p.y + dy };
}

function BarsIcon() {
  return (
    <svg viewBox="0 0 14 10" className="h-2.5 w-3.5 shrink-0">
      <rect x={0} y={6} width={2.5} height={4} rx={0.5} fill="var(--accent-from)" opacity={0.6} />
      <rect x={4.75} y={3} width={2.5} height={7} rx={0.5} fill="var(--accent-from)" opacity={0.8} />
      <rect x={9.5} y={0} width={2.5} height={10} rx={0.5} fill="var(--accent-from)" />
    </svg>
  );
}

/** Dot-matrix world map for the hero — real land silhouettes (see
 * worldMapPath.ts), the connecting hub is the first `isHub` marker (or
 * markers[0]) and every other marker gets an arc back to it. Pure SVG + a
 * positioned HTML label layer, no client JS or external image needed. */
export function EarthGlobe({ markers, legend }: { markers: GlobeMarker[]; legend: GlobeLegend }) {
  const hub = markers.find((m) => m.isHub) ?? markers[0];
  const projected = markers.map((m) => ({ ...m, ...project(m.lat, m.lng) }));
  const hubPoint = projected.find((m) => m.id === hub?.id);

  return (
    <div className="relative w-full animate-[hero-drift_20s_ease-in-out_infinite] motion-reduce:animate-none">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="presentation" aria-hidden="true">
        <defs>
          <pattern id="hero-map-dots" width={DOT_PATTERN_SIZE} height={DOT_PATTERN_SIZE} patternUnits="userSpaceOnUse">
            <circle cx={0.7} cy={0.7} r={0.7} fill="rgba(180,255,170,0.4)" />
          </pattern>
        </defs>

        <path d={WORLD_LAND_PATH} fill="url(#hero-map-dots)" />

        {hubPoint &&
          projected
            .filter((m) => m.id !== hubPoint.id)
            .map((m) => {
              const midX = (hubPoint.x + m.x) / 2;
              const midY = Math.min(hubPoint.y, m.y) - 60;
              return (
                <path
                  key={m.id}
                  d={`M ${hubPoint.x} ${hubPoint.y} Q ${midX} ${midY} ${m.x} ${m.y}`}
                  fill="none"
                  stroke="var(--accent-from)"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              );
            })}

        {projected.map((p) => {
          const end = leaderEndpoint(p, p.labelDir ?? "up-right");
          return (
            <line
              key={`leader-${p.id}`}
              x1={p.x}
              y1={p.y}
              x2={end.x}
              y2={end.y}
              stroke="var(--accent-from)"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          );
        })}

        {projected.map((p, i) => {
          const radius = p.isHub ? 4.5 : 3;
          const pulseMax = p.isHub ? 3.2 : 2.4;
          return (
            <g key={p.id}>
              <circle
                cx={p.x}
                cy={p.y}
                r={radius * pulseMax}
                fill="none"
                stroke="var(--accent-from)"
                strokeWidth={1}
                className="animate-[home-ringpulse_2.8s_ease-out_infinite] motion-reduce:animate-none"
                style={{ transformOrigin: `${p.x}px ${p.y}px`, animationDelay: `${i * 0.35}s` }}
              />
              <circle cx={p.x} cy={p.y} r={radius} fill="var(--accent-from)" opacity={p.isHub ? 1 : 0.85} />
            </g>
          );
        })}
      </svg>

      {projected.map((m) => {
        const dir = m.labelDir ?? "up-right";
        const end = leaderEndpoint(m, dir);
        const leftPct = (end.x / WIDTH) * 100;
        const topPct = (end.y / HEIGHT) * 100;
        const translateX = dir.endsWith("left") ? "-100%" : "0";
        const translateY = dir.startsWith("up") ? "-100%" : "0";
        return (
          <div
            key={m.id}
            className="pointer-events-none absolute flex flex-col gap-1 rounded-md border border-white/15 bg-black/70 px-2.5 py-1.5 whitespace-nowrap backdrop-blur-sm"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: `translate(${translateX}, ${translateY})`,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-foreground">{m.label}</span>
              <BarsIcon />
            </div>
            <span className="text-[11px] font-medium text-[var(--accent-from)]">{m.sublabel}</span>
          </div>
        );
      })}

      <div className="pointer-events-none absolute bottom-1 left-1 flex items-center gap-2 sm:bottom-2 sm:left-2">
        <span className="h-6 w-px bg-white/25" />
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-foreground uppercase">{legend.title}</p>
          <p className="text-[10px] tracking-wide text-muted uppercase">{legend.subtitle}</p>
        </div>
      </div>

      <div className="pointer-events-none absolute right-1 bottom-1 flex flex-col items-end gap-1 sm:right-2 sm:bottom-2">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-from)]" />
          <span className="text-[10px] tracking-wide text-muted uppercase">{legend.activityLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 2" className="h-0.5 w-4">
            <line x1={0} y1={1} x2={16} y2={1} stroke="var(--accent-from)" strokeWidth={1} strokeDasharray="3 2" />
          </svg>
          <span className="text-[10px] tracking-wide text-muted uppercase">{legend.connectionsLabel}</span>
        </div>
      </div>
    </div>
  );
}
