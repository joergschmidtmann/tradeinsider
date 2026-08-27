/**
 * Thin fetch wrapper for Finansinspektionen's Insynsregistret (Sweden's
 * insider register). No robots.txt on marknadssok.fi.se or fi.se, no
 * documented rate limit — throttled anyway as a courtesy, consistent with
 * the other clients in this project. Includes an explicit Accept header
 * since a bare Node fetch() without one has caused unexpected server errors
 * on at least one other regulator's site (see cnmvClient.ts) — cheap
 * insurance here even though not confirmed necessary for this one.
 */
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;
if (!CONTACT_EMAIL) {
  throw new Error("CONTACT_EMAIL environment variable is required.");
}
const USER_AGENT = `TradeInsider.io ${CONTACT_EMAIL}`;
const HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
  // Without this, a second request over a pooled keep-alive connection to
  // this host reliably ECONNRESETs — verified live that isolated single
  // requests always succeed but a tight pagination loop fails on a later
  // page. Forcing the server to close the connection after each response
  // means every request gets a fresh socket instead of reusing a stale one.
  Connection: "close",
};

// Verified live: this endpoint resets the connection after roughly 8 requests
// within a short window (reproducible at 1200ms spacing, resolved by pausing
// several seconds) — 2000ms keeps comfortably clear of whatever threshold
// that is.
const MIN_DELAY_MS = 2000;
let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

const MAX_RETRIES = 5;

/** Retries on network-level failures (e.g. ECONNRESET) — verified live that
 * Node's fetch to this specific host reliably fails on the very first
 * request of a fresh process (a cold TLS/DNS connection-setup hiccup) but
 * succeeds immediately on every request after, including immediate retries.
 * HTTP error responses (non-ok status) are not retried; they're a real
 * answer from the server, not a transient connection issue. */
export async function fiFetchText(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await throttle();
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        throw new Error(`FI request failed: ${res.status} ${res.statusText} for ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastError = err;
      const isNetworkError = err instanceof TypeError || (err instanceof Error && err.message.includes("fetch failed"));
      if (!isNetworkError || attempt === MAX_RETRIES) throw err;
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }
  throw lastError;
}
