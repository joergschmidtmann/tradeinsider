import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { secFetchText, secFetchJson } from "./lib/secClient";
import { parseFeed, type FeedEntry } from "./lib/parseFeed";
import { parseForm4 } from "./lib/parseForm4";

const FEED_URL =
  "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&company=&dateb=&owner=include&count=100&output=atom";

interface DirectoryListing {
  directory: { item: { name: string }[] };
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}

/** Finds the primary ownership XML document inside a filing's folder.
 * Filenames aren't standardized across filers (seen so far: "ownership.xml",
 * "wk-form4_....xml"), so the heuristic is: any ".xml" file in the folder.
 * If more than one is found, the last one is used and a warning is logged —
 * revisit this if that turns out to happen often in practice. */
async function findPrimaryXmlUrl(cik: string, accessionNoDashes: string): Promise<string> {
  const folderUrl = `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}`;
  const listing = await secFetchJson<DirectoryListing>(`${folderUrl}/index.json`);
  const xmlFiles = listing.directory.item.filter((item) => item.name.toLowerCase().endsWith(".xml"));
  if (xmlFiles.length === 0) {
    throw new Error(`No .xml file found in filing folder ${folderUrl}`);
  }
  if (xmlFiles.length > 1) {
    console.warn(`Warning: multiple .xml files in ${folderUrl}, using the last one: ${xmlFiles.map((f) => f.name).join(", ")}`);
  }
  return `${folderUrl}/${xmlFiles[xmlFiles.length - 1].name}`;
}

async function processFiling(entry: FeedEntry) {
  const accessionNoDashes = entry.accessionNumber.replace(/-/g, "");
  const xmlUrl = await findPrimaryXmlUrl(entry.cik, accessionNoDashes);
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
