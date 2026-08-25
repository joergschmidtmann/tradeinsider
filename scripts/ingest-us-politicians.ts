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

  const dedupeKeys = rows.map((r) => r.dedupe_key);
  const { data: known, error: knownError } = await supabase.from("transactions").select("dedupe_key").in("dedupe_key", dedupeKeys);
  if (knownError) throw knownError;
  const knownKeys = new Set((known ?? []).map((row) => row.dedupe_key));

  const newRows = rows.filter((r) => !knownKeys.has(r.dedupe_key));
  console.log(`${newRows.length} disclosures are new (not yet in the database).`);

  if (newRows.length > 0) {
    const { error } = await supabase.from("transactions").upsert(newRows, { onConflict: "dedupe_key", ignoreDuplicates: true });
    if (error) throw error;
  }

  console.log(`Done. ${newRows.length} row(s) upserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
