export interface GlobeMarker {
  id: string;
  label: string;
  sublabel: string;
  lat: number;
  lng: number;
  isHub?: boolean;
}

// The crop window into the equirectangular earth-night.jpg (lon -180..180,
// lat -90..90 covers the full image) — chosen to frame the US east coast
// through Scandinavia, where every marker below lives.
const LON_MIN = -100;
const LON_MAX = 40;
const LAT_MIN = 15;
const LAT_MAX = 70;

function project(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng - LON_MIN) / (LON_MAX - LON_MIN)) * 100,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 100,
  };
}

const BG_SIZE_X = (360 / (LON_MAX - LON_MIN)) * 100;
const BG_SIZE_Y = (180 / (LAT_MAX - LAT_MIN)) * 100;
const BG_POS_X = ((LON_MIN + 180) / (360 - (LON_MAX - LON_MIN))) * 100;
const BG_POS_Y = ((90 - LAT_MAX) / (180 - (LAT_MAX - LAT_MIN))) * 100;

/** Photographic "globe" for the hero — a real NASA night-lights Earth photo
 * (see public/globe/earth-night.jpg), cropped to the region our markers sit
 * in and duotoned green to match the brand. Pure CSS/SVG, no client JS or
 * 3D library needed for what is, in the end, a decorative backdrop. */
export function EarthGlobe({ markers }: { markers: GlobeMarker[] }) {
  const hub = markers.find((m) => m.isHub) ?? markers[0];
  const projected = markers.map((m) => ({ ...m, ...project(m.lat, m.lng) }));
  const hubPoint = projected.find((m) => m.id === hub?.id);

  return (
    <div className="relative aspect-square w-full">
      {/* Clipped layer: photo + color grade + vignette + dots */}
      <div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{ boxShadow: "0 0 60px -10px rgba(78,203,60,0.45), inset 0 0 60px rgba(0,0,0,0.6)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/globe/earth-night.jpg)",
            backgroundSize: `${BG_SIZE_X}% ${BG_SIZE_Y}%`,
            backgroundPosition: `${BG_POS_X}% ${BG_POS_Y}%`,
            filter: "saturate(1.15) brightness(0.85) contrast(1.15)",
          }}
        />
        {/* Green duotone */}
        <div className="absolute inset-0" style={{ backgroundColor: "#4ecb3c", mixBlendMode: "color", opacity: 0.6 }} />
        {/* Directional shading, lit from the upper-left like the reference */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 120% at 25% 20%, transparent 30%, rgba(0,0,0,0.65) 100%)" }}
        />
        <div className="absolute inset-0 rounded-full border border-white/10" />

        {projected.map((m) => (
          <span
            key={m.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-from)] opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-to)]" />
            </span>
          </span>
        ))}
      </div>

      {/* Arcs, drawn above the clipped sphere so they read as flight paths */}
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {hubPoint &&
          projected
            .filter((m) => m.id !== hubPoint.id)
            .map((m) => {
              const midX = (hubPoint.x + m.x) / 2;
              const midY = Math.min(hubPoint.y, m.y) - 14;
              return (
                <path
                  key={m.id}
                  d={`M ${hubPoint.x} ${hubPoint.y} Q ${midX} ${midY} ${m.x} ${m.y}`}
                  fill="none"
                  stroke="var(--accent-from)"
                  strokeWidth={0.3}
                  strokeLinecap="round"
                  strokeDasharray="1.5 2"
                  opacity={0.7}
                  className="animate-[hero-arc-flow_3s_linear_infinite] motion-reduce:animate-none"
                />
              );
            })}
      </svg>

      {/* Unclipped layer: labels, free to float outside the sphere's edge */}
      {projected.map((m) => (
        <div
          key={m.id}
          className="pointer-events-none absolute flex flex-col gap-0.5 whitespace-nowrap"
          style={{ left: `${m.x}%`, top: `${m.y}%`, transform: "translate(10px, -140%)" }}
        >
          <span className="text-xs font-semibold text-foreground drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">{m.label}</span>
          <span className="text-[11px] font-medium text-[var(--accent-from)] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">{m.sublabel}</span>
        </div>
      ))}
    </div>
  );
}
