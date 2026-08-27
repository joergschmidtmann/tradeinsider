import { fiFetchText } from "./fiClient";

const SEARCH_URL = "https://marknadssok.fi.se/Publiceringsklient/sv-SE/Search/Search/Insyn";
const SITE_ORIGIN = "https://marknadssok.fi.se";

export interface FiTransaction {
  filingId: string; // shared across every row belonging to the same underlying notification
  filingUrl: string; // detail page for the notification, e.g. ".../Rapportsammanställning/Index/A004B901-1"
  issuerName: string;
  ownerName: string;
  ownerTitle: string;
  nature: "Förvärv" | "Avyttring";
  instrumentType: string;
  isin: string;
  transactionDate: string; // ISO yyyy-mm-dd, already in that format from the source
  filedDate: string; // ISO yyyy-mm-dd
  volume: number;
  volumeUnit: string;
  price: number;
  currency: string;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .trim();
}

function parseSwedishNumber(raw: string): number {
  // Thousands separator is a non-breaking space (already decoded to   by
  // decodeEntities above), decimal separator is a comma.
  return Number(raw.replace(/\s/g, "").replace(",", "."));
}

const ROW_RE = /<tr>\s*((?:<td>[\s\S]*?<\/td>\s*)+)<\/tr>/g;
const CELL_RE = /<td>([\s\S]*?)<\/td>/g;
const FILING_HREF_RE = /href="([^"]*Rapportsammanst[^"]*\/Index\/([^?"]+)[^"]*)"/;

/** Parses one page's <tbody> rows into transactions. The results table is
 * already fully structured — every column we need is its own <td> in a
 * fixed order (verified live: Publiceringsdatum, Emittent, Person, Befattning,
 * Närstående, Karaktär, Instrumentnamn, Instrumenttyp, ISIN, Transaktionsdatum,
 * Volym, Volymsenhet, Pris, Valuta, Status, Detaljer) — so unlike every other
 * European pipeline in this project, no per-item document fetch or free-text
 * parsing is needed at all. */
interface ParsedPage {
  transactions: FiTransaction[];
  rawRowCount: number; // used for pagination — see findRecentTransactions
}

function parseResultsHtml(html: string): ParsedPage {
  const transactions: FiTransaction[] = [];
  let rawRowCount = 0;
  for (const rowMatch of html.matchAll(ROW_RE)) {
    rawRowCount++;
    const cells = [...rowMatch[1].matchAll(CELL_RE)].map((m) => decodeEntities(m[1]));
    if (cells.length < 16) continue; // defensive: skip anything not matching the expected column count

    const [filedDate, issuerName, ownerName, ownerTitle, , natureRaw, , instrumentType, isin, transactionDate, volumeRaw, volumeUnit, priceRaw, currency] =
      cells;

    if (natureRaw !== "Förvärv" && natureRaw !== "Avyttring") continue; // unknown value — skip rather than guess
    if (instrumentType !== "Aktie") continue; // not an ordinary share (option, bond, etc.)
    if (volumeUnit !== "Antal") continue; // not a plain share count (e.g. "Procent")

    const filingHrefMatch = rowMatch[1].match(FILING_HREF_RE);
    if (!filingHrefMatch) continue;
    const decodedHref = decodeURIComponent(filingHrefMatch[1]);

    transactions.push({
      filingId: filingHrefMatch[2],
      filingUrl: decodedHref.startsWith("http") ? decodedHref : `${SITE_ORIGIN}${decodedHref}`,
      issuerName,
      ownerName,
      ownerTitle,
      nature: natureRaw,
      instrumentType,
      isin,
      transactionDate,
      filedDate,
      volume: parseSwedishNumber(volumeRaw),
      volumeUnit,
      price: parseSwedishNumber(priceRaw),
      currency,
    });
  }
  return { transactions, rawRowCount };
}

/** Fetches every insider transaction filed in [fromDate, toDate] (both
 * "YYYY-MM-DD"), paging through Finansinspektionen's Insynsregistret until a
 * page comes back with zero *raw* rows (not filtered rows — a page can have
 * fewer qualifying transactions than its real row count after filtering out
 * non-share/non-count rows while still having more pages after it, so the
 * pagination decision must never be based on the filtered count). Stopping
 * on a truly empty page rather than "fewer than N rows" avoids hardcoding
 * the site's page size, which turned out not to be what it first looked
 * like (an earlier manual page-size check miscounted the <thead> row as a
 * result row). No session/cookie needed — verified live that a fresh,
 * cookie-less request to this endpoint returns real results directly for
 * both the first page and subsequent pages, and that an out-of-range page
 * number cleanly returns zero rows instead of erroring. */
export async function findRecentTransactions(fromDate: string, toDate: string): Promise<FiTransaction[]> {
  const all: FiTransaction[] = [];
  for (let page = 1; ; page++) {
    const url = `${SEARCH_URL}?button=search&SearchFunctionType=Insyn&paging=True&Publiceringsdatum.From=${fromDate}&Publiceringsdatum.To=${toDate}&page=${page}`;
    const html = await fiFetchText(url);
    const { transactions, rawRowCount } = parseResultsHtml(html);
    all.push(...transactions);
    if (rawRowCount === 0) break;
  }
  return all;
}
