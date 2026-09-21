import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fetchRecentHouseTransactions } from "./lib/houseStockWatcher";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}

async function main() {
  const supabase = supabaseAdmin();

  console.log("Fetching recent US House stock trade disclosures...");
  const transactions = await fetchRecentHouseTransactions();
  console.log(`Found ${transactions.length} recent Purchase/Sale disclosures.`);

  const rows = transactions.map((tx) => {
    // Same dedupe key shape the source dataset itself uses internally
    // (filing_id, ticker, transaction_date, type, owner) — see that repo's
    // CLAUDE.md notes on why `owner` is required (a rep can make the same
    // trade the same day in two accounts, e.g. Self + Dependent Child).
    const dedupeKey = `US-POL-${tx.filingId}:${tx.ticker}:${tx.transactionDate}:${tx.code}:${tx.owner}`;
    return {
      source_country: "US",
      accession_number: dedupeKey,
      issuer_cik: tx.ticker,
      issuer_name: tx.issuerName,
      issuer_ticker: tx.ticker,
      owner_cik: tx.representative,
      owner_name: tx.representative,
      owner_title: `Repräsentantenhaus (${tx.district})`,
      is_ceo: false,
      role: "politician",
      transaction_date: tx.transactionDate,
      transaction_code: tx.code,
      shares: null,
      price_per_share: null,
      currency: "USD",
      amount_range: tx.amountRange,
      shares_owned_after: null,
      filing_url: tx.sourceUrl,
      filed_at: null,
      dedupe_key: dedupeKey,
    };
  });

  // No separate "which of these are already known" pre-check: with a large
  // batch (e.g. 300+ disclosures), building a `.in("dedupe_key", [...])`
  // query from that many keys can push the request URL past Supabase's
  // ~16KB header limit (HeadersOverflowError, seen in production once the
  // batch size grew). The unique constraint on dedupe_key plus
  // ignoreDuplicates already does the same dedup server-side in one upsert
  // call, with no list of keys ever built.
  const { data: inserted, error } = await supabase
    .from("transactions")
    .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true })
    .select("id");
  if (error) throw error;

  console.log(`Done. ${inserted?.length ?? 0} new row(s) upserted (of ${rows.length} fetched).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
