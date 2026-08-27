/**
 * Thin fetch wrapper for the CNMV (Spain's securities regulator) website.
 * No robots.txt restriction on the paths used here, and no rate limit is
 * documented — throttled anyway as a courtesy, consistent with the other
 * clients in this project.
 */
const CONTACT_EMAIL = process.env.CONTACT_EMAIL;
if (!CONTACT_EMAIL) {
  throw new Error("CONTACT_EMAIL environment variable is required.");
}
const USER_AGENT = `TradeInsider.io ${CONTACT_EMAIL}`;
// The search results page (Directivos-Resultado) 500s on a bare Node fetch()
// request — verified live that the identical URL returns 200 via curl (which
// sends Accept: */* by default) but 500 via Node's fetch (which sends no
// Accept header at all unless told to). Adding a normal browser-like Accept
// header fixes it; harmless to send on every request including the PDF ones.
const HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
};

const MIN_DELAY_MS = 300;
let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

export async function cnmvFetchText(url: string): Promise<string> {
  await throttle();
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`CNMV request failed: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.text();
}

export async function cnmvFetchBuffer(url: string): Promise<Buffer> {
  await throttle();
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`CNMV request failed: ${res.status} ${res.statusText} for ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
