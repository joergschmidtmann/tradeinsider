const DATA_URL = "https://raw.githubusercontent.com/TattooedHead/house-stock-watcher-data/main/data/all_transactions.json";
const RECENT_WINDOW_DAYS = 60;

interface RawHouseTransaction {
  amount: string;
  amount_mid: number | null;
  asset_description: string;
  asset_type: string;
  disclosure_date: string; // MM/DD/YYYY
  district: string;
  filing_id: string;
  owner: string;
  representative: string;
  source_url: string;
  ticker: string;
  transaction_date: string; // MM/DD/YYYY
  type: string;
}

export interface HouseTransaction {
  filingId: string;
  representative: string;
  district: string;
  owner: string;
  ticker: string;
  issuerName: string;
  transactionDate: string; // ISO yyyy-mm-dd
  code: "P" | "S";
  amountRange: string;
  amountMid: number | null;
  sourceUrl: string;
}

/** Parses a "MM/DD/YYYY" date string. Returns null if malformed — the source
 * data is scraped from PDFs and occasionally has garbled dates (see that
 * repo's own CLAUDE.md notes on "garbled years"), so callers should treat
 * unparsable dates as "skip this row" rather than crash. */
function parseUsDate(value: string): Date | null {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, month, day, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The scraper occasionally fails to split a PDF table row into columns and
 * jams multiple fields into `asset_description`, padded with null bytes
 * (e.g. "Alphabet Inc. - Class A Common Stock (GOOGL) F\x00\x00...S\x00...:
 * New S\x00...O\x00: David Taylor Trust > ..."). Truncating at the first
 * control character recovers a clean-enough company name; the row is kept
 * either way (its `ticker` field is usually still correct) — this is a
 * cosmetic best-effort cleanup, not a data-integrity fix. */
function cleanIssuerName(assetDescription: string): string {
  const controlCharIndex = assetDescription.search(/[\x00-\x08\x0e-\x1f]/);
  const truncated = controlCharIndex === -1 ? assetDescription : assetDescription.slice(0, controlCharIndex);
  return truncated.replace(/\s*\(([A-Z.]{1,6})\)\s*$/, "").trim() || assetDescription.trim();
}

/** Fetches the full House PTR dataset and returns transactions disclosed in
 * roughly the last two months, mapped to Purchase/Sale only (Exchange and
 * any other transaction nature aren't a clean buy/sell so are skipped, same
 * spirit as the SEC/EQS pipelines only tracking clear buy/sell codes).
 * No historical backfill — matches the rest of the project's MVP scope. */
export async function fetchRecentHouseTransactions(): Promise<HouseTransaction[]> {
  const res = await fetch(DATA_URL);
  if (!res.ok) {
    throw new Error(`House Stock Watcher data request failed: ${res.status} ${res.statusText}`);
  }
  const raw = (await res.json()) as RawHouseTransaction[];

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - RECENT_WINDOW_DAYS);

  const results: HouseTransaction[] = [];
  for (const row of raw) {
    if (row.asset_type !== "Stock") continue;
    if (!row.ticker) continue;
    const code = row.type === "Purchase" ? "P" : row.type === "Sale" ? "S" : null;
    if (!code) continue;

    const disclosureDate = parseUsDate(row.disclosure_date);
    if (!disclosureDate || disclosureDate < cutoff) continue;
    const transactionDate = parseUsDate(row.transaction_date);
    if (!transactionDate) continue;

    results.push({
      filingId: row.filing_id,
      representative: row.representative,
      district: row.district,
      owner: row.owner,
      ticker: row.ticker,
      issuerName: cleanIssuerName(row.asset_description),
      transactionDate: toIsoDate(transactionDate),
      code,
      amountRange: row.amount,
      amountMid: row.amount_mid,
      sourceUrl: row.source_url,
    });
  }
  return results;
}
