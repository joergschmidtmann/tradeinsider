import { countryLabel } from "@/lib/countries";
import type { Locale } from "@/i18n/routing";

// Live source countries and their approximate centroid, hand-picked so the
// North-Atlantic crop below frames all of them with reasonable spacing —
// this is a stylized "trading terminal" grid, not a survey-accurate map.
const POINTS: { code: string; lat: number; lon: number }[] = [
  { code: "US", lat: 39.8, lon: -98.6 },
  { code: "DE", lat: 51.2, lon: 10.4 },
  { code: "AT", lat: 47.5, lon: 14.5 },
  { code: "ES", lat: 40.0, lon: -3.7 },
  { code: "SE", lat: 62.0, lon: 15.0 },
  { code: "NL", lat: 52.3, lon: 5.3 },
  { code: "BE", lat: 50.5, lon: 4.5 },
];

// Purely decorative network lines between a few of the points above — not a
// depiction of any real data relationship.
const LINKS: [string, string][] = [
  ["US", "DE"],
  ["US", "ES"],
  ["SE", "NL"],
];

const WIDTH = 760;
const HEIGHT = 380;
const LON_MIN = -140;
const LON_MAX = 40;
const LAT_MIN = 22;
const LAT_MAX = 72;

function project(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * WIDTH;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * HEIGHT;
  return { x, y };
}

const LON_LINES = [-140, -120, -100, -80, -60, -40, -20, 0, 20, 40];
const LAT_LINES = [30, 40, 50, 60, 70];

export function GlobalActivityMap({ locale, highlightCodes = [] }: { locale: Locale; highlightCodes?: string[] }) {
  const projected = POINTS.map((p) => ({ ...p, ...project(p.lat, p.lon) }));
  const byCode = Object.fromEntries(projected.map((p) => [p.code, p]));

  return (
    <div className="animate-[hero-drift_20s_ease-in-out_infinite] motion-reduce:animate-none">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="presentation" aria-hidden="true">
        {LON_LINES.map((lon) => {
          const { x } = project(LAT_MIN, lon);
          return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={HEIGHT} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />;
        })}
        {LAT_LINES.map((lat) => {
          const { y } = project(lat, LON_MIN);
          return <line key={`lat-${lat}`} x1={0} y1={y} x2={WIDTH} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />;
        })}

        {LINKS.map(([a, b]) => {
          const pa = byCode[a];
          const pb = byCode[b];
          if (!pa || !pb) return null;
          return (
            <line
              key={`${a}-${b}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="var(--accent-from)"
              strokeOpacity={0.18}
              strokeWidth={1}
            />
          );
        })}

        {projected.map((p, i) => {
          const isHighlighted = highlightCodes.includes(p.code);
          const radius = isHighlighted ? 4.5 : 3;
          const pulseMax = isHighlighted ? 3.2 : 2.4;
          return (
            <g key={p.code}>
              <title>{countryLabel(p.code, locale)}</title>
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
              <circle cx={p.x} cy={p.y} r={radius} fill="var(--accent-from)" opacity={isHighlighted ? 1 : 0.75} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
