// All source_country values currently produced by any ingest script — used
// both to render a friendly label next to the raw code and, in
// columnFilters.ts, as the fixed universe for the "Land" column filter's
// exact per-country counts.
export const COUNTRIES = [
  { code: "US", label: "USA" },
  { code: "DE", label: "Deutschland" },
  { code: "AT", label: "Österreich" },
  { code: "ES", label: "Spanien" },
  { code: "SE", label: "Schweden" },
  { code: "NL", label: "Niederlande" },
  { code: "BE", label: "Belgien" },
] as const;

export function countryLabel(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.label ?? code;
}
