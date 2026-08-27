import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { findRecentDeclarations, fetchDeclarationDetail } from "./lib/parseCnmv";

// CNMV's Nota Legal (https://www.cnmv.es/portal/Utilidades/NotaLegal.aspx)
// allows commercial reuse of this data, on the condition that anyone who
// pays for a product containing it is told — both before paying and every
// time it's delivered — that the same data is available free on cnmv.es.
// TODO: once the planned Vorstand/CEO paywall exists, add that disclosure
// next to wherever ES-sourced rows are shown/sold.

const DAYS_TO_SCAN = 3; // overlap window to catch declarations filed a day or two late

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}

function formatSpanishDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

async function main() {
  const supabase = supabaseAdmin();

  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - DAYS_TO_SCAN);
  const fechaH = formatSpanishDate(toDate);
  const fechaD = formatSpanishDate(fromDate);

  console.log(`Fetching CNMV declarations from ${fechaD} to ${fechaH}...`);
  const declarations = await findRecentDeclarations(fechaD, fechaH);
  console.log(`Found ${declarations.length} declaration(s).`);

  // Scoped by filed_at (when CNMV published the declaration, matching the
  // fechad/fechah window above) rather than transaction_date — a declaration
  // can report trades from weeks earlier (seen live: a Naturhouse filing
  // published this week covered trades from a month prior), so filtering by
  // transaction_date would miss it here on every future run and re-fetch its
  // PDF forever. Also keeps this fast as the table grows, same 1000-row-
  // default-cap concern as the hedge-fund ingest script.
  const { data: known, error: knownError } = await supabase
    .from("transactions")
    .select("accession_number")
    .eq("source_country", "ES")
    .gte("filed_at", fromDate.toISOString().slice(0, 10));
  if (knownError) throw knownError;
  const knownRegistrationNumbers = new Set((known ?? []).map((row) => row.accession_number.split("-")[1]));

  const newDeclarations = declarations.filter((d) => !knownRegistrationNumbers.has(d.registrationNumber));
  console.log(`${newDeclarations.length} declaration(s) not yet processed.`);

  let insertedRows = 0;
  for (const declaration of newDeclarations) {
    try {
      const { lei, transactions } = await fetchDeclarationDetail(declaration.documentUrl);
      if (transactions.length === 0) continue;

      const rows = transactions.map((tx, index) => {
        const accessionNumber = `ES-${declaration.registrationNumber}-${index}`;
        return {
          source_country: "ES",
          accession_number: accessionNumber,
          issuer_cik: lei ?? tx.isin,
          issuer_name: declaration.issuerName,
          issuer_ticker: null,
          owner_cik: declaration.declarant,
          owner_name: declaration.declarant,
          owner_title: declaration.motivo,
          is_ceo: false,
          role: "management_board",
          transaction_date: tx.date,
          transaction_code: tx.nature === "Compra" ? "P" : "S",
          shares: tx.volume,
          price_per_share: tx.price,
          currency: tx.currency,
          shares_owned_after: null,
          filing_url: declaration.documentUrl,
          filed_at: declaration.filedDate,
          dedupe_key: accessionNumber,
        };
      });

      const { error } = await supabase.from("transactions").upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true });
      if (error) throw error;
      insertedRows += rows.length;
    } catch (err) {
      console.error(`Failed to process declaration ${declaration.registrationNumber}:`, err);
    }
  }

  console.log(`Done. ${insertedRows} row(s) upserted across ${newDeclarations.length} declaration(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
