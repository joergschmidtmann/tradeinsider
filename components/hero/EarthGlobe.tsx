export interface GlobeMarker {
  id: string;
  label: string;
  sublabel: string;
  lat: number;
  lng: number;
  isHub?: boolean;
}

const WIDTH = 760;
const HEIGHT = 380;
const LON_MIN = -140;
const LON_MAX = 40;
const LAT_MIN = 22;
const LAT_MAX = 72;

function project(lat: number, lon: number): { x: number; y: number } {
  return {
    x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * WIDTH,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * HEIGHT,
  };
}

// Very rough continent silhouettes for the two landmasses that fall inside
// this crop (North America, Europe/North Africa) — hand-picked lat/lon
// vertices, not survey-accurate, just enough to read as "a world map" behind
// the dot texture.
const LANDMASSES: [number, number][][] = [
  [
    // North America
    [68, -165], [60, -140], [55, -130], [49, -125], [38, -123], [32, -117],
    [23, -110], [22, -106], [22, -97], [26, -97], [30, -89], [25, -80],
    [30, -81], [35, -76], [41, -71], [45, -66], [47, -60], [49, -65],
    [50, -80], [60, -85], [63, -90], [58, -95], [68, -100], [70, -130],
  ],
  [
    // Europe / North Africa
    [36, -9], [43, -9], [48, -5], [51, -5], [51, 2], [55, 8], [58, 11],
    [63, 15], [70, 25], [70, 40], [55, 40], [48, 35], [42, 40], [36, 35],
    [31, 32], [30, 10], [32, 0], [35, -6],
  ],
];

const DOT_PATTERN_SIZE = 7;

/** Dot-matrix world map for the hero — the connecting hub is the first
 * `isHub` marker (or markers[0]); every other marker gets an animated arc
 * back to it. Pure SVG + a positioned HTML label layer, no client JS or
 * external image needed. */
export function EarthGlobe({ markers }: { markers: GlobeMarker[] }) {
  const hub = markers.find((m) => m.isHub) ?? markers[0];
  const projected = markers.map((m) => ({ ...m, ...project(m.lat, m.lng) }));
  const hubPoint = projected.find((m) => m.id === hub?.id);
  const landPaths = LANDMASSES.map(
    (vertices) =>
      vertices
        .map(([lat, lon], i) => {
          const { x, y } = project(lat, lon);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ") + " Z"
  );

  return (
    <div className="relative w-full animate-[hero-drift_20s_ease-in-out_infinite] motion-reduce:animate-none">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="presentation" aria-hidden="true">
        <defs>
          <pattern id="hero-map-dots" width={DOT_PATTERN_SIZE} height={DOT_PATTERN_SIZE} patternUnits="userSpaceOnUse">
            <circle cx={1} cy={1} r={1} fill="rgba(180,255,170,0.4)" />
          </pattern>
        </defs>

        {landPaths.map((d, i) => (
          <path key={`land-${i}`} d={d} fill="url(#hero-map-dots)" />
        ))}

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
        const leftPct = (m.x / WIDTH) * 100;
        const topPct = (m.y / HEIGHT) * 100;
        // Keep labels from running off the map's left/right edges.
        const anchorRight = leftPct > 70;
        return (
          <div
            key={m.id}
            className="pointer-events-none absolute flex flex-col gap-0.5 whitespace-nowrap"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: anchorRight ? "translate(calc(-100% - 10px), -140%)" : "translate(10px, -140%)",
            }}
          >
            <span className="text-xs font-semibold text-foreground drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">{m.label}</span>
            <span className="text-[11px] font-medium text-[var(--accent-from)] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {m.sublabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
