// Klassische technische Indikatoren auf Schlusskurs-Reihen (älteste zuerst).
// Rein funktional, ohne Abhängigkeiten — getestet in indicators.test.ts.

export function sma(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) sum += values[i];
  return sum / period;
}

/** Komplette EMA-Reihe; die ersten period-1 Einträge sind null, der Start
 * wird wie üblich mit dem SMA der ersten `period` Werte gesetzt. */
export function emaSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = 0;
  for (let i = 0; i < period; i++) prev += values[i];
  prev /= period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** RSI nach Wilder (geglättete Durchschnittsgewinne/-verluste). */
export function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  gain /= period;
  loss /= period;
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    gain = (gain * (period - 1) + Math.max(diff, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (loss === 0) return gain === 0 ? 50 : 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

export interface MacdResult {
  macd: number;
  signal: number;
  histogram: number;
  /** Histogramm des Vortags, um Kreuzungen zu erkennen. */
  prevHistogram: number | null;
}

export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult | null {
  if (values.length < slow + signalPeriod) return null;
  const fastEma = emaSeries(values, fast);
  const slowEma = emaSeries(values, slow);
  const macdLine: number[] = [];
  for (let i = slow - 1; i < values.length; i++) {
    macdLine.push((fastEma[i] as number) - (slowEma[i] as number));
  }
  const signalLine = emaSeries(macdLine, signalPeriod);
  const last = macdLine.length - 1;
  const sig = signalLine[last];
  if (sig === null) return null;
  const prevSig = signalLine[last - 1];
  return {
    macd: macdLine[last],
    signal: sig,
    histogram: macdLine[last] - sig,
    prevHistogram: prevSig === null || prevSig === undefined ? null : macdLine[last - 1] - prevSig,
  };
}

/** Rendite über die letzten `days` Handelstage (0.1 = +10 %). */
export function periodReturn(values: number[], days: number, skipRecent = 0): number | null {
  const end = values.length - 1 - skipRecent;
  const start = end - days;
  if (start < 0 || end < 0 || values[start] <= 0) return null;
  return values[end] / values[start] - 1;
}

/** Annualisierte Volatilität der täglichen Log-Renditen über `days` Tage. */
export function annualizedVolatility(values: number[], days = 252): number | null {
  const n = Math.min(days, values.length - 1);
  if (n < 20) return null;
  const rets: number[] = [];
  for (let i = values.length - n; i < values.length; i++) {
    if (values[i - 1] > 0 && values[i] > 0) rets.push(Math.log(values[i] / values[i - 1]));
  }
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}
