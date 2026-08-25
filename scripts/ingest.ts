import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { secFetchText } from "./lib/secClient";
import { parseFeed, type FeedEntry } from "./lib/parseFeed";
import { parseForm4 } from "./lib/parseForm4";

const FEED_URL =
  "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&company=&dateb=&owner=include&count=100&output=atom";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}

/** Finds the primary ownership XML document for a filing by parsing the
 * "Document Format Files" table on its `-index.htm` page (entry.filingIndexUrl).
 *
 * Earlier this used each filer CIK's `index.json` directory listing instead,
 * but that turned out to be unreliable: at least one real filing's index.json
 * omitted the primary XML file entirely (under every associated CIK) even
 * though the file existed and was directly fetchable — and even linked, with
 * a correct absolute URL, from that same filing's own index.htm table. So
 * index.htm's document table is the more trustworthy source here.
 *
 * Every Form 4 filing lists its primary document twice in that table: once
 * as an XSLT-rendered HTML view under an `xslF345X0N/` subfolder (labeled
 * e.g. "form4.html" even though the link itself ends in ".xml"), and once
 * as the real raw XML at the top level. Rows are Type "4"; the HTML view is
 * excluded by filtering out any href containing "/xsl". */
async function findPrimaryXmlUrl(filingIndexUrl: string): Promise<string> {
  const html = await secFetchText(filingIndexUrl);
  const tableMatch = html.match(/Document Format Files[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    throw new Error(`No "Document Format Files" table found on ${filingIndexUrl}`);
  }

  const rows = tableMatch[1].match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  const candidates: string[] = [];
  for (const row of rows) {
    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) ?? [];
    if (cells.length < 4) continue;
    const type = cells[3].replace(/<[^>]*>/g, "").trim();
    if (type !== "4") continue;
    const hrefMatch = cells[2].match(/href="([^"]+)"/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1];
    if (href.toLowerCase().includes("/xsl")) continue; // the human-readable rendered view, not the raw XML
    candidates.push(href.startsWith("http") ? href : `https://www.sec.gov${href}`);
  }

  if (candidates.length === 0) {
    throw new Error(`No raw Form 4 XML document found in the document table on ${filingIndexUrl}`);
  }
  if (candidates.length > 1) {
    console.warn(`Warning: multiple candidate XML documents on ${filingIndexUrl}, using the last one: ${candidates.join(", ")}`);
  }
  return candidates[candidates.length - 1];
}

async function processFiling(entry: FeedEntry) {
  const xmlUrl = await findPrimaryXmlUrl(entry.filingIndexUrl);
  const xml = await secFetchText(xmlUrl);
  const parsed = parseForm4(xml);

  const ceoOwners = parsed.owners.filter((owner) => owner.isCeo);
  if (ceoOwners.length === 0) return [];

  const filingIndexUrl = entry.filingIndexUrl;
  const rows = [];
  for (const owner of ceoOwners) {
    for (const tx of parsed.transactions) {
      // total_value is a generated column in Postgres (exact decimal math from
      // shares * price_per_share) — it must NOT be included in the insert payload.
      rows.push({
        source_country: "US",
        accession_number: entry.accessionNumber,
        issuer_cik: parsed.issuerCik,
        issuer_name: parsed.issuerName,
        issuer_ticker: parsed.issuerTicker,
        owner_cik: owner.ownerCik,
        owner_name: owner.ownerName,
        owner_title: owner.officerTitle,
        is_ceo: true,
        transaction_date: tx.date,
        transaction_code: tx.code,
        shares: tx.shares,
        price_per_share: tx.pricePerShare,
        currency: "USD",
        shares_owned_after: tx.sharesOwnedAfter,
        filing_url: filingIndexUrl,
        filed_at: entry.filedAt || null,
        dedupe_key: `${entry.accessionNumber}:${owner.ownerCik}:${tx.index}`,
      });
    }
  }
  return rows;
}

async function main() {
  const supabase = supabaseAdmin();

  console.log("Fetching SEC EDGAR current Form 4 filings feed...");
  const feedXml = await secFetchText(FEED_URL);
  const allEntries = parseFeed(feedXml);
  console.log(`Feed contains ${allEntries.length} distinct Form 4 filings.`);

  const { data: known, error: knownError } = await supabase
    .from("transactions")
    .select("accession_number")
    .in(
      "accession_number",
      allEntries.map((e) => e.accessionNumber)
    );
  if (knownError) throw knownError;
  const knownAccessions = new Set((known ?? []).map((row) => row.accession_number));

  const newEntries = allEntries.filter((e) => !knownAccessions.has(e.accessionNumber));
  console.log(`${newEntries.length} filings are new (not yet in the database).`);

  let insertedRows = 0;
  let ceoFilings = 0;
  for (const entry of newEntries) {
    try {
      const rows = await processFiling(entry);
      if (rows.length === 0) continue;
      ceoFilings++;

      const { error } = await supabase.from("transactions").upsert(rows, {
        onConflict: "dedupe_key",
        ignoreDuplicates: true,
      });
      if (error) throw error;
      insertedRows += rows.length;
    } catch (err) {
      console.error(`Failed to process filing ${entry.accessionNumber}:`, err);
    }
  }

  console.log(`Done. ${ceoFilings} filing(s) had a CEO transaction, ${insertedRows} row(s) upserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
