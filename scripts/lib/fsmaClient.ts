/**
 * Thin fetch wrapper for the FSMA's Managers' Transactions register
 * (fsma.be). robots.txt allows crawling the relevant paths but sets
 * `Crawl-delay: 30` — the strictest throttle of any source in this
 * project — so this is respected here even though volume is low enough
 * (~2 notifications/day) that it barely matters in practice.
 */
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;
if (!CONTACT_EMAIL) {
  throw new Error("CONTACT_EMAIL environment variable is required.");
}
const USER_AGENT = `TradeInsider.io ${CONTACT_EMAIL}`;
const HEADERS = { "User-Agent": USER_AGENT };

const MIN_DELAY_MS = 30_000;
let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

export async function fsmaFetchText(url: string): Promise<string> {
  await throttle();
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`FSMA request failed: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.text();
}
