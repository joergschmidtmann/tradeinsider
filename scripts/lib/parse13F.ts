import { XMLParser } from "fast-xml-parser";
import { secFetchText, secFetchJson } from "./secClient";

// The Atom "current filings" feed needs attributes (href, term); the 13F XML
// documents themselves (cover page, information table) are element-only.
const feedParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", trimValues: true });
// removeNSPrefix: some filers wrap every element in a namespace prefix (e.g.
// <n1:informationTable><n1:infoTable>...) instead of SEC's typical prefix-free
// default-namespace style — without stripping it, `informationTable.infoTable`
// silently resolves to nothing and the filing parses as zero holdings.
// Verified against a real Millennium Management filing that uses this style.
const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true, removeNSPrefix: true });

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export interface Filing13F {
  accessionNumber: string;
  filingIndexUrl: string;
  filedAt: string;
}

/** Finds a fund's most recent 13F-HR filings (newest first), skipping
 * amendments (13F-HR/A) and notices (13F-NT, filed by managers who report
 * zero reportable holdings) — same simplification as ignoring Form 4/A
 * amendments elsewhere in this project. */
export async function findRecentFilings(cik: string, limit: number): Promise<Filing13F[]> {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=13F-HR&dateb=&owner=include&count=${limit + 5}&output=atom`;
  const xml = await secFetchText(url);
  const doc = feedParser.parse(xml);
  const entries = toArray(doc.feed?.entry);

  const filings: Filing13F[] = [];
  for (const entry of entries) {
    const formType = entry.category?.term;
    if (formType !== "13F-HR") continue; // excludes 13F-HR/A and 13F-NT
    const href: string = entry.link?.href ?? "";
    if (!href) continue;
    filings.push({
      accessionNumber: href.match(/(\d{10}-\d{2}-\d{6})-index\.htm/)?.[1] ?? "",
      filingIndexUrl: href,
      filedAt: entry.updated ?? "",
    });
    if (filings.length >= limit) break;
  }
  return filings.filter((f) => f.accessionNumber);
}

interface DirectoryListing {
  directory: { item: { name: string }[] };
}

export interface Holding {
  cusip: string;
  issuerName: string;
  shares: number;
  valueUsd: number;
}

export interface Parsed13F {
  periodOfReport: string; // ISO yyyy-mm-dd
  isAmendment: boolean;
  holdings: Holding[];
}

/** Some older/simpler filers (e.g. Third Point, Pershing Square) don't submit
 * a separate primary_doc.xml cover page at all — just a single information-table
 * XML. For those, the reporting period is read instead from the filing's SGML
 * header (`-index-headers.html`, present on every filing), which always
 * carries a `<PERIOD>YYYYMMDD` line regardless of submission style. */
async function periodOfReportFromHeader(folderUrl: string, accessionNoDashes: string): Promise<string> {
  const dashed = `${accessionNoDashes.slice(0, 10)}-${accessionNoDashes.slice(10, 12)}-${accessionNoDashes.slice(12)}`;
  const headerHtml = await secFetchText(`${folderUrl}/${dashed}-index-headers.html`);
  const match = headerHtml.match(/<PERIOD>(\d{8})/i);
  if (!match) return "";
  const raw = match[1];
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

/** Fetches and parses one 13F filing: the cover page (primary_doc.xml) for
 * the reporting period, and the information table (the other XML file in
 * the folder — same "whichever .xml isn't primary_doc.xml" heuristic used
 * for Form 4's ownership document) for holdings. A single issuer/CUSIP can
 * appear as several line items when a filing covers multiple sub-managers
 * (verified live against Berkshire Hathaway's filings, which list Apple
 * across a dozen manager entries) — those are summed into one holding.
 *
 * `value` is empirically the position's market value in actual dollars in
 * this schema version, not "thousands of dollars" as older SEC guidance is
 * often quoted as saying — verified against real filings by dividing value
 * by shares and getting a plausible per-share stock price (e.g. ~$289 for
 * Apple, ~$46 for Ally Financial), not a price three orders of magnitude off. */
export async function fetchHoldings(cik: string, accessionNoDashes: string): Promise<Parsed13F> {
  const folderUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}`;
  const listing = await secFetchJson<DirectoryListing>(`${folderUrl}/index.json`);
  const xmlFiles = listing.directory.item.filter((item) => item.name.toLowerCase().endsWith(".xml"));
  const coverFile = xmlFiles.find((f) => f.name.toLowerCase() === "primary_doc.xml");
  const tableFile = xmlFiles.find((f) => f.name.toLowerCase() !== "primary_doc.xml");
  if (!tableFile) {
    throw new Error(`No information table XML found in ${folderUrl}`);
  }

  let periodOfReport = "";
  let isAmendment = false;
  if (coverFile) {
    const coverXml = await secFetchText(`${folderUrl}/${coverFile.name}`);
    const cover = parser.parse(coverXml);
    const header = cover.edgarSubmission?.headerData;
    const periodOfReportRaw: string = header?.filerInfo?.periodOfReport ?? ""; // "MM-DD-YYYY"
    const [month, day, year] = periodOfReportRaw.split("-");
    periodOfReport = year ? `${year}-${month}-${day}` : "";
    isAmendment = String(cover.edgarSubmission?.formData?.coverPage?.isAmendment ?? "").toLowerCase() === "true";
  } else {
    // No cover page to read isAmendment from, but findRecentFilings() already
    // filtered to exact form type "13F-HR" (excluding "13F-HR/A"), so it's
    // safe to assume false here too.
    periodOfReport = await periodOfReportFromHeader(folderUrl, accessionNoDashes);
  }

  const tableXml = await secFetchText(`${folderUrl}/${tableFile.name}`);
  const table = parser.parse(tableXml);
  const rawEntries = toArray(table.informationTable?.infoTable);

  const byCusip = new Map<string, Holding>();
  for (const entry of rawEntries) {
    // A `putCall` field marks the row as an options position (Call/Put), not
    // a direct equity holding. Its `value`/`sshPrnamt` describe the option
    // contract, not shares of stock at a comparable per-share price — mixing
    // those into a CUSIP's equity total silently corrupts both the share
    // count and the derived price. Verified against a real Citadel Advisors
    // filing where doing so inflated Micron's implied price to ~$1,154/share
    // (real price is roughly $100) by summing in a large call-option notional.
    // Skipping option rows means this MVP only tracks straight equity stakes.
    if (entry.putCall) continue;
    const cusip = String(entry.cusip ?? "").trim();
    if (!cusip) continue;
    const shares = Number(entry.shrsOrPrnAmt?.sshPrnamt ?? 0);
    const valueUsd = Number(entry.value ?? 0);
    const existing = byCusip.get(cusip);
    if (existing) {
      existing.shares += shares;
      existing.valueUsd += valueUsd;
    } else {
      byCusip.set(cusip, { cusip, issuerName: String(entry.nameOfIssuer ?? "").trim(), shares, valueUsd });
    }
  }

  return { periodOfReport, isAmendment, holdings: Array.from(byCusip.values()) };
}
