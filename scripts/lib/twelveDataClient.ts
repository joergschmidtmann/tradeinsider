/**
 * Thin fetch wrapper for the Twelve Data quote endpoint (US stock prices).
 *
 * Using the free "Basic" plan (800 calls/day, 8/min). Twelve Data's Basic
 * plan ToS restricts use to personal, non-commercial purposes and forbids
 * public display of the data — this project displays a derived "performance
 * since purchase" figure on a commercial site, which doesn't fit that
 * license. Accepted as a known compliance risk (decision made 2026-09-06)
 * rather than a blocker; revisit by upgrading to a paid plan with a
 * commercial-display license if this needs to scale or Twelve Data objects.
 */
const API_KEY = process.env.TWELVE_DATA_API_KEY;
if (!API_KEY) {
  throw new Error("TWELVE_DATA_API_KEY environment variable is required.");
}

const BASE_URL = "https://api.twelvedata.com/quote";

// Stay well under the Basic plan's 8 requests/minute limit.
const MIN_DELAY_MS = 8_000;
let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

export interface TwelveDataQuote {
  price: number;
  currency: string;
}

/** Returns null (rather than throwing) for symbols Twelve Data doesn't
 * recognize or can't quote — expected for some tickers (delisted, OTC,
 * class-share suffixes SEC filings use that Twelve Data doesn't), so a
 * per-ticker miss shouldn't stop the rest of the batch. */
export async function fetchQuote(ticker: string): Promise<TwelveDataQuote | null> {
  await throttle();
  const url = `${BASE_URL}?symbol=${encodeURIComponent(ticker)}&apikey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status === "error" || !data.close || !data.currency) return null;
  return { price: Number(data.close), currency: data.currency };
}
