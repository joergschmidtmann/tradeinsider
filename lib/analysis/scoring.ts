// Gemeinsame Hilfsfunktionen, um Rohkennzahlen auf 0-100 abzubilden.

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Lineare Abbildung: `worst` -> 0, `best` -> 100 (funktioniert auch, wenn
 * `best` < `worst`, z. B. für "niedriger ist besser"). */
export function linearScore(value: number, worst: number, best: number): number {
  if (best === worst) return 50;
  return clamp(((value - worst) / (best - worst)) * 100);
}

/** Gewichteter Mittelwert, der fehlende (null) Teilwerte überspringt und die
 * übrigen Gewichte renormalisiert. null, wenn gar nichts vorliegt. */
export function weightedAverage(parts: { score: number | null; weight: number }[]): number | null {
  let sum = 0;
  let weight = 0;
  for (const p of parts) {
    if (p.score === null || !Number.isFinite(p.score)) continue;
    sum += p.score * p.weight;
    weight += p.weight;
  }
  return weight === 0 ? null : sum / weight;
}

/** Perzentilrang (0-100) von `value` innerhalb `peers` — Anteil der Peers,
 * die kleiner sind (Gleichstände zählen halb). */
export function percentileRank(value: number, peers: number[]): number | null {
  if (peers.length === 0) return null;
  let below = 0;
  let equal = 0;
  for (const p of peers) {
    if (p < value) below++;
    else if (p === value) equal++;
  }
  return ((below + equal / 2) / peers.length) * 100;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function round(value: number, digits = 0): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
