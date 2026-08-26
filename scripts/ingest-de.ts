import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fetchEqsDirectorsDealingsPage, fetchEqsTransaction, resolveTrackedCountry } from "./lib/parseEqs";

const PAGES_TO_SCAN = 2; // ~200 recent items across all EQS categories, filtered down to tracked DE/AT Directors' Dealings

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

  console.log("Fetching recent EQS News items...");
  const items = [];
  for (let page = 1; page <= PAGES_TO_SCAN; page++) {
    items.push(...(await fetchEqsDirectorsDealingsPage(page)));
  }
  console.log(`Found ${items.length} tracked Directors' Dealings items across ${PAGES_TO_SCAN} page(s).`);

  // resolveTrackedCountry() looks up index membership (DE or AT), not the
  // ISIN's own prefix, since real constituents are sometimes domiciled abroad.
  const accessionNumbers = items.map((item) => `${resolveTrackedCountry(item.isin)}-${item.id}`);
  const { data: known, error: knownError } = await supabase
    .from("transactions")
    .select("accession_number")
    .in("accession_number", accessionNumbers);
  if (knownError) throw knownError;
  const knownAccessions = new Set((known ?? []).map((row) => row.accession_number));

  const newItems = items.filter((item) => !knownAccessions.has(`${resolveTrackedCountry(item.isin)}-${item.id}`));
  console.log(`${newItems.length} items are new (not yet in the database).`);

  let insertedRows = 0;
  let boardTransactions = 0;
  for (const item of newItems) {
    try {
      const tx = await fetchEqsTransaction(item.id);
      if (!tx) continue;
      boardTransactions++;

      // Derived from item.isin (the company-level ISIN already confirmed tracked
      // above), not tx.isin — a company can have multiple share classes with
      // different ISINs (e.g. Sixt's ordinary vs. preferred shares), and an
      // insider's actual trade may be in a class that was never itself curated
      // into germanIndices.ts/austrianIndices.ts, even though the company is.
      const sourceCountry = resolveTrackedCountry(item.isin);
      const accessionNumber = `${sourceCountry}-${item.id}`;
      const shares = Math.round(tx.volumeEur / tx.price);
      const { error } = await supabase.from("transactions").upsert(
        {
          source_country: sourceCountry,
          accession_number: accessionNumber,
          issuer_cik: tx.issuerLei,
          issuer_name: tx.issuerName,
          issuer_ticker: null,
          owner_cik: `${tx.ownerFirstName} ${tx.ownerLastName}`,
          owner_name: `${tx.ownerFirstName} ${tx.ownerLastName}`,
          owner_title: tx.role === "management_board" ? "Vorstand" : "Aufsichtsrat",
          is_ceo: tx.role === "management_board",
          role: tx.role,
          transaction_date: tx.date,
          transaction_code: tx.code,
          shares,
          price_per_share: tx.price,
          currency: "EUR",
          shares_owned_after: null,
          filing_url: tx.shareUrl,
          filed_at: item.date,
          dedupe_key: accessionNumber,
        },
        { onConflict: "dedupe_key", ignoreDuplicates: true }
      );
      if (error) throw error;
      insertedRows++;
    } catch (err) {
      console.error(`Failed to process EQS item ${item.id}:`, err);
    }
  }

  console.log(`Done. ${boardTransactions} board-member share transaction(s), ${insertedRows} row(s) upserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
