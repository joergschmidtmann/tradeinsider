// EUR-based exchange rates from Frankfurter (api.frankfurter.dev), an open,
// key-free API backed by ECB/central-bank data — free for any use, no quota.
// Cached for an hour since these are just a "≈" display hint, not the source
// of truth (the stored price is always in its original currency).
const FX_API_URL = "https://api.frankfurter.dev/v1/latest?base=EUR";
const REVALIDATE_SECONDS = 3600;

export async function getEurRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch(FX_API_URL, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return {};
    const data = await res.json();
    return { ...data.rates, EUR: 1 };
  } catch {
    return {};
  }
}

/** Converts an amount in `currency` to EUR using the given rate table (EUR
 * per 1 unit of `currency` is `amount / rates[currency]`, since the table is
 * EUR-based: 1 EUR = rates[currency] units of that currency). Returns null
 * when already in EUR or the rate is unavailable (API failure, unlisted
 * currency) — callers should just omit the "≈" line in that case. */
export function convertToEur(amount: number, currency: string, rates: Record<string, number>): number | null {
  if (currency === "EUR") return null;
  const rate = rates[currency];
  if (!rate) return null;
  return amount / rate;
}
