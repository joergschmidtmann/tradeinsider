/**
 * Thin fetch wrapper for the EQS News public REST API (wp-json/eqsnews/v1),
 * used as the data source for German "Directors' Dealings" notifications.
 *
 * Note: eqs-news.com's robots.txt disallows /wp-json/ for all crawlers, even
 * though its Terms of Use permit content reuse and the API itself is public
 * and unauthenticated. This was a deliberate, informed decision (see the
 * plan doc) — polling here is intentionally infrequent (hourly, vs. the
 * 15-minute SEC poll) and clearly self-identified via User-Agent as a
 * gesture of respect for the site's stated crawling preference.
 */
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;
if (!CONTACT_EMAIL) {
  throw new Error("CONTACT_EMAIL environment variable is required.");
}
const USER_AGENT = `TradeInsider.io ${CONTACT_EMAIL}`;

const MIN_DELAY_MS = 500;
let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

export async function eqsFetchJson<T>(url: string): Promise<T> {
  await throttle();
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`EQS request failed: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json() as Promise<T>;
}
