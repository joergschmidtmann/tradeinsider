import type { Locale } from "@/i18n/routing";

// All source_country values currently produced by any ingest script — used
// both to render a friendly label next to the raw code and, in
// columnFilters.ts, as the fixed universe for the "Land" column filter's
// exact per-country counts.
export const COUNTRIES = [
  { code: "US", labels: { de: "USA", en: "USA", es: "EE.UU." } },
  { code: "DE", labels: { de: "Deutschland", en: "Germany", es: "Alemania" } },
  { code: "AT", labels: { de: "Österreich", en: "Austria", es: "Austria" } },
  { code: "ES", labels: { de: "Spanien", en: "Spain", es: "España" } },
  { code: "SE", labels: { de: "Schweden", en: "Sweden", es: "Suecia" } },
  { code: "NL", labels: { de: "Niederlande", en: "Netherlands", es: "Países Bajos" } },
  { code: "BE", labels: { de: "Belgien", en: "Belgium", es: "Bélgica" } },
] as const;

export function countryLabel(code: string, locale: Locale): string {
  return COUNTRIES.find((c) => c.code === code)?.labels[locale] ?? code;
}
