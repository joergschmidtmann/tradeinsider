/**
 * Curated list of well-known hedge funds/institutional managers to track via
 * SEC Form 13F, CIKs verified live against SEC EDGAR on 2026-08-26. There are
 * thousands of 13F filers (mostly index funds and pension managers), so — like
 * GERMAN_INDEX_ISINS — this is a deliberately small, maintained allow-list
 * rather than an attempt at exhaustive coverage.
 */
export interface HedgeFund {
  cik: string;
  name: string;
}

export const HEDGE_FUNDS: HedgeFund[] = [
  { cik: "0001067983", name: "Berkshire Hathaway" },
  { cik: "0001350694", name: "Bridgewater Associates" },
  { cik: "0001037389", name: "Renaissance Technologies" },
  { cik: "0001423053", name: "Citadel Advisors" },
  { cik: "0001273087", name: "Millennium Management" },
  { cik: "0001336528", name: "Pershing Square Capital" },
  { cik: "0001649339", name: "Scion Asset Management" },
  { cik: "0001040273", name: "Third Point" },
  { cik: "0001167483", name: "Tiger Global Management" },
  { cik: "0001029160", name: "Soros Fund Management" },
  { cik: "0001791786", name: "Elliott Investment Management" },
  { cik: "0001167557", name: "AQR Capital Management" },
  { cik: "0001009207", name: "D. E. Shaw & Co." },
  { cik: "0001603466", name: "Point72 Asset Management" },
];
