import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fetchAllTransactions } from "./lib/parseAfm";
import { computeInsiderScore } from "./lib/insiderScore";

// AFM's copyright notice (afm.nl/nl-nl/over-de-afm/over-deze-website) permits
// reproducing and distributing this data as long as the AFM is credited as
// the source — no commercial-use exclusion.

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

  console.log("Fetching AFM bulk export...");
  const transactions = await fetchAllTransactions();
  console.log(`Found ${transactions.length} transaction(s).`);

  // The export always returns the full history, so — unlike every other
  // European pipeline here — there's no date window to scope the "already
  // known" check by: just compare the whole thing against every dedupe_key
  // already stored for this country. Supabase caps a query without an
  // explicit range() at 1000 rows, and this table already holds more than
  // that for NL alone, so page through explicitly.
  const knownDedupeKeys = new Set<string>();
  const PAGE_SIZE = 1000;
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data: page, error: pageError } = await supabase
      .from("transactions")
      .select("dedupe_key")
      .eq("source_country", "NL")
      .range(from, from + PAGE_SIZE - 1);
    if (pageError) throw pageError;
    for (const row of page ?? []) knownDedupeKeys.add(row.dedupe_key);
    if (!page || page.length < PAGE_SIZE) break;
  }

  const rows = [];
  for (const tx of transactions) {
    const dedupeKey = `NL-${tx.meldingId}-${tx.index}`;
    if (knownDedupeKeys.has(dedupeKey)) continue;
    const transactionCode = tx.shares > 0 ? "P" : "S";
    const shares = Math.abs(tx.shares);
    const insiderScore =
      transactionCode === "P"
        ? await computeInsiderScore(supabase, {
            ownerTitle: null,
            shares,
            sharesOwnedAfter: tx.sharesOwnedAfter,
            totalValue: shares * tx.pricePerShare,
            currency: tx.currency,
            issuerName: tx.issuerName,
            transactionDate: tx.transactionDate,
          })
        : null;
    rows.push({
      source_country: "NL",
      accession_number: dedupeKey,
      // No ISIN/LEI in AFM's export (unlike every other European source
      // here) — fall back to the issuer name, same as owner_cik below.
      issuer_cik: tx.issuerName,
      issuer_name: tx.issuerName,
      issuer_ticker: null,
      owner_cik: tx.ownerName,
      owner_name: tx.ownerName,
      owner_title: null,
      is_ceo: false,
      role: "management_board",
      transaction_date: tx.transactionDate,
      transaction_code: transactionCode,
      shares,
      price_per_share: tx.pricePerShare,
      currency: tx.currency,
      shares_owned_after: tx.sharesOwnedAfter,
      insider_score: insiderScore,
      filing_url: `https://www.afm.nl/en/sector/registers/meldingenregisters/bestuurders-commissarissen/details?id=${tx.meldingId}`,
      filed_at: tx.transactionDate,
      dedupe_key: dedupeKey,
    });
  }

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
