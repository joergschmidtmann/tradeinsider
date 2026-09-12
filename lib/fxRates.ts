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

/** Converts an amount in `currency` to USD, bridging through the EUR-based
 * `rates` table (unlike `convertToEur`, this always returns a value —
 * including when `currency` already is USD or EUR — since callers use it to
 * classify a purchase's size, not to show an optional "≈" hint). Returns null
 * only when the conversion genuinely can't be done (rate unavailable). */
export function convertToUsd(amount: number, currency: string, rates: Record<string, number>): number | null {
  if (currency === "USD") return amount;
  const usdPerEur = rates.USD;
  if (!usdPerEur) return null;
  if (currency === "EUR") return amount * usdPerEur;
  const rate = rates[currency];
  if (!rate) return null;
  return (amount / rate) * usdPerEur;
}
