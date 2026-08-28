import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { findRecentTransactionUrls, fetchTransactionDetail } from "./lib/parseFsma";
import { computeInsiderScore } from "./lib/insiderScore";

// FSMA's Disclaimer & Copyright page (fsma.be/en/disclaimer-copyright) puts
// this data under CC BY 4.0, with the same condition as Spain's Nota Legal:
// anyone who includes it in a paid product must either offer it free
// themselves or tell customers upfront that it's available free on fsma.be.
// TODO: once the planned Vorstand/CEO paywall exists, add that disclosure
// next to wherever BE-sourced rows are shown/sold.

const DAYS_TO_SCAN = 3; // overlap window to catch notifications published a day or two late

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

  console.log(`Fetching FSMA notifications from ${fromIso} to ${toIso}...`);
  const refs = await findRecentTransactionUrls(fromIso, toIso);
  console.log(`Found ${refs.length} notification(s).`);

  // Scoped by filed_at (publication date, matching the window above), same
  // reasoning as Spain/Sweden: a notification's transaction_date can predate
  // its publication date, so filtering on transaction_date could miss it
  // here and re-fetch it every run.
  const { data: known, error: knownError } = await supabase
    .from("transactions")
    .select("dedupe_key")
    .eq("source_country", "BE")
    .gte("filed_at", fromIso);
  if (knownError) throw knownError;
  const knownDedupeKeys = new Set((known ?? []).map((row) => row.dedupe_key));

  const newRefs = refs.filter((ref) => !knownDedupeKeys.has(`BE-${ref.slug}`));
  console.log(`${newRefs.length} notification(s) not yet processed.`);

  let insertedRows = 0;
  for (const ref of newRefs) {
    try {
      const tx = await fetchTransactionDetail(ref);
      if (!tx) continue;

      const dedupeKey = `BE-${tx.slug}`;
      const insiderScore =
        tx.transactionType === "P"
          ? await computeInsiderScore(supabase, {
              ownerTitle: tx.ownerTitle,
              shares: tx.shares,
              sharesOwnedAfter: null,
              totalValue: tx.shares * tx.pricePerShare,
              currency: tx.currency,
              issuerName: tx.issuerName,
              transactionDate: tx.transactionDate,
            })
          : null;
      const row = {
        source_country: "BE",
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
        transaction_code: tx.transactionType,
        shares: tx.shares,
        price_per_share: tx.pricePerShare,
        currency: tx.currency,
        shares_owned_after: null,
        insider_score: insiderScore,
        filing_url: ref.detailUrl,
        filed_at: tx.publicationDate,
        dedupe_key: dedupeKey,
      };

      const { error } = await supabase.from("transactions").upsert(row, { onConflict: "dedupe_key", ignoreDuplicates: true });
      if (error) throw error;
      insertedRows += 1;
    } catch (err) {
      console.error(`Failed to process notification ${ref.slug}:`, err);
    }
  }

  console.log(`Done. ${insertedRows} row(s) upserted across ${newRefs.length} notification(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
