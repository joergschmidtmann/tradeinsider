import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { findRecentTransactions } from "./lib/parseFi";

// Finansinspektionen's copyright notice (fi.se/sv/om-fi/om-webbplatsen/) allows
// free reuse of the site's text material as long as the source is credited —
// no commercial-use exclusion, unlike France, and no "tell paying customers
// it's free elsewhere" condition like Spain's Nota Legal.

const DAYS_TO_SCAN = 3; // overlap window to catch notifications filed a day or two late

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function main() {
  const supabase = supabaseAdmin();

  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - DAYS_TO_SCAN);
  const fromIso = isoDate(fromDate);
  const toIso = isoDate(toDate);

  console.log(`Fetching FI Insynsregistret transactions from ${fromIso} to ${toIso}...`);
  const transactions = await findRecentTransactions(fromIso, toIso);
  console.log(`Found ${transactions.length} transaction(s).`);

  // Scoped by filed_at (matching the Publiceringsdatum window above), same
  // reasoning as Spain's ingest-es.ts: a notification's transaction_date can
  // predate its filing date, so filtering on transaction_date would let old-
  // dated rows fall outside the scan window and get reprocessed forever.
  const { data: known, error: knownError } = await supabase
    .from("transactions")
    .select("dedupe_key")
    .eq("source_country", "SE")
    .gte("filed_at", fromDate.toISOString().slice(0, 10));
  if (knownError) throw knownError;
  const knownDedupeKeys = new Set((known ?? []).map((row) => row.dedupe_key));

  const rows = transactions
    .map((tx) => {
      const dedupeKey = `SE-${tx.filingId}-${tx.transactionDate}-${tx.volume}-${tx.price}`;
      if (knownDedupeKeys.has(dedupeKey)) return null;
      return {
        source_country: "SE",
        accession_number: dedupeKey,
        issuer_cik: tx.isin,
        issuer_name: tx.issuerName,
        issuer_ticker: null,
        owner_cik: tx.ownerName,
        owner_name: tx.ownerName,
        owner_title: tx.ownerTitle,
        is_ceo: false,
        role: "management_board",
        transaction_date: tx.transactionDate,
        transaction_code: tx.nature === "Förvärv" ? "P" : "S",
        shares: tx.volume,
        price_per_share: tx.price,
        currency: tx.currency,
        shares_owned_after: null,
        filing_url: tx.filingUrl,
        filed_at: tx.filedDate,
        dedupe_key: dedupeKey,
      };
    })
    .filter((row) => row !== null);

  console.log(`${rows.length} row(s) not yet processed.`);

  if (rows.length > 0) {
    const { error } = await supabase.from("transactions").upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true });
    if (error) throw error;
  }

  console.log(`Done. ${rows.length} row(s) upserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
