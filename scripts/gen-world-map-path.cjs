/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS script, run directly with `node` */
// Regenerates components/hero/worldMapPath.ts from world-atlas's 110m land
// topology. Not part of the normal build — these packages aren't regular
// dependencies (they're only ever needed for this one-off regeneration), so
// install them first:
//
//   npm install --no-save world-atlas topojson-client topojson-simplify d3-geo
//   node scripts/gen-world-map-path.cjs
//
// Bump WORLD_MAP_SIMPLIFY_WEIGHT for a coarser/finer coastline (higher =
// smaller path, fewer islands) if you change WIDTH/HEIGHT/LON/LAT below,
// keep them in sync with the same constants in components/hero/EarthGlobe.tsx.
const path = require("path");
const fs = require("fs");
const topojson = require("topojson-client");
const topoSimplify = require("topojson-simplify");
const d3geo = require("d3-geo");
const land = require("world-atlas/land-110m.json");

const WIDTH = 1000;
const HEIGHT = 460;
const LON_MIN = -170;
const LON_MAX = 170;
const LAT_MIN = -57;
const LAT_MAX = 78;
const SIMPLIFY_WEIGHT = 1.5;

function projectPoint(lon, lat) {
  return [((lon - LON_MIN) / (LON_MAX - LON_MIN)) * WIDTH, ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * HEIGHT];
}

const transform = d3geo.geoTransform({
  point(lon, lat) {
    const [x, y] = projectPoint(lon, lat);
    this.stream.point(x, y);
  },
});
const geoPath = d3geo.geoPath(transform).digits(1);

const presimplified = topoSimplify.presimplify(land);
const simplified = topoSimplify.simplify(presimplified, SIMPLIFY_WEIGHT);
const landGeo = topojson.feature(simplified, simplified.objects.land);
const d = geoPath(landGeo);

const outPath = path.join(__dirname, "..", "components", "hero", "worldMapPath.ts");
fs.writeFileSync(outPath, `export const WORLD_LAND_PATH =\n  "${d}";\n`);
console.log(`Wrote ${outPath} (${d.length} bytes of path data)`);
