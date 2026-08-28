import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { computeInsiderScore } from "./lib/insiderScore";

// One-time backfill for rows that predate the insider_score column/feature.
// Only ever needs to run again if the scoring model itself changes and a
// full recompute is wanted — normal ingest runs already set the score for
// new rows going forward.

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}

const BATCH_SIZE = 200;

async function main() {
  const supabase = supabaseAdmin();

  let totalUpdated = 0;
  for (;;) {
    const { data: rows, error } = await supabase
      .from("transactions")
      .select("id, owner_title, shares, shares_owned_after, total_value, currency, issuer_name, transaction_date")
      .in("role", ["management_board", "supervisory_board"])
      .eq("transaction_code", "P")
      .is("insider_score", null)
      .limit(BATCH_SIZE);
    if (error) throw error;
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const score = await computeInsiderScore(supabase, {
        ownerTitle: row.owner_title,
        shares: row.shares,
        sharesOwnedAfter: row.shares_owned_after,
        totalValue: row.total_value,
        currency: row.currency,
        issuerName: row.issuer_name,
        transactionDate: row.transaction_date,
      });
      const { error: updateError } = await supabase.from("transactions").update({ insider_score: score }).eq("id", row.id);
      if (updateError) throw updateError;
      totalUpdated++;
    }

    console.log(`Updated ${totalUpdated} row(s) so far...`);
  }

  console.log(`Done. ${totalUpdated} row(s) backfilled.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
