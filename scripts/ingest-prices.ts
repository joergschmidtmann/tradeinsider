import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fetchQuote } from "./lib/twelveDataClient";

// Only refresh tickers with at least one transaction in this window — bounds
// the daily call volume as the transactions table grows, and matches what's
// actually reachable from the recent-purchases pages (older pages simply
// show no performance badge once a ticker ages out here).
const LOOKBACK_DAYS = 365;
const PAGE_SIZE = 1000;

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}

async function fetchDistinctTickers(supabase: ReturnType<typeof supabaseAdmin>, sinceIso: string): Promise<string[]> {
  const tickers = new Set<string>();
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("transactions")
      .select("issuer_ticker")
      .not("issuer_ticker", "is", null)
      .gte("transaction_date", sinceIso)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    data.forEach((row) => tickers.add(row.issuer_ticker as string));
    if (data.length < PAGE_SIZE) break;
  }
  return [...tickers];
}

async function main() {
  const supabase = supabaseAdmin();

  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);
  const tickers = await fetchDistinctTickers(supabase, since.toISOString().slice(0, 10));
  console.log(`Refreshing quotes for ${tickers.length} ticker(s)...`);

  let updated = 0;
  let missed = 0;
  for (const ticker of tickers) {
    try {
      const quote = await fetchQuote(ticker);
      if (!quote) {
        missed++;
        continue;
      }
      const { error } = await supabase.from("stock_quotes").upsert(
        {
          ticker,
          price: quote.price,
          currency: quote.currency,
          quoted_at: new Date().toISOString(),
        },
        { onConflict: "ticker" }
      );
      if (error) throw error;
      updated++;
    } catch (err) {
      console.error(`Failed to fetch/store quote for ${ticker}:`, err);
      missed++;
    }
  }

  console.log(`Done. ${updated} quote(s) updated, ${missed} skipped/failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
