/**
 * Thin fetch wrapper for SEC EDGAR. SEC requires a descriptive User-Agent
 * (app name + contact email) on every request, and asks for a reasonable
 * request rate (well under 10 req/sec). See https://www.sec.gov/os/webmaster-faq#developers
 */
const CONTACT_EMAIL = process.env.SEC_CONTACT_EMAIL;
if (!CONTACT_EMAIL) {
  throw new Error(
    "SEC_CONTACT_EMAIL environment variable is required (SEC requires a contact email in the User-Agent header)."
  );
}
const USER_AGENT = `TradeInsides.com ${CONTACT_EMAIL}`;

const MIN_DELAY_MS = 150;
let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

export async function secFetchText(url: string): Promise<string> {
  await throttle();
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`SEC request failed: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.text();
}

export async function secFetchJson<T>(url: string): Promise<T> {
  const text = await secFetchText(url);
  return JSON.parse(text) as T;
}
