import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { HEDGE_FUNDS } from "./lib/hedgeFunds";
import { findRecentFilings, fetchHoldings, type Holding } from "./lib/parse13F";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}

interface HoldingRow {
  manager_cik: string;
  manager_name: string;
  cusip: string;
  issuer_name: string;
  period_of_report: string;
  shares: number;
  value_usd: number;
  filing_url: string;
}

/** Turns a diff between two consecutive quarters' holdings into transactions
 * rows. `previous` is null on a fund's very first tracked quarter — in that
 * case the caller skips move generation entirely rather than reporting every
 * position as a fabricated "new buy" (see ingest-hedge-funds main loop). */
function computeMoves(
  managerCik: string,
  managerName: string,
  periodOfReport: string,
  filingUrl: string,
  current: Holding[],
  previous: Map<string, { shares: number; valueUsd: number; issuerName: string }>
) {
  const rows = [];
  const seenCusips = new Set<string>();

  for (const holding of current) {
    seenCusips.add(holding.cusip);
    const prior = previous.get(holding.cusip);
    const priorShares = prior?.shares ?? 0;
    if (holding.shares === priorShares) continue; // no change

    const isNewOrIncrease = holding.shares > priorShares;
    const sharesDelta = Math.abs(holding.shares - priorShares);
    const pricePerShare = holding.valueUsd / holding.shares;

    rows.push({
      source_country: "US",
      accession_number: `HF-${managerCik}:${holding.cusip}:${periodOfReport}`,
      issuer_cik: holding.cusip,
      issuer_name: holding.issuerName,
      issuer_ticker: null,
      owner_cik: managerCik,
      owner_name: managerName,
      owner_title: "Hedgefonds",
      is_ceo: false,
      role: "hedge_fund",
      transaction_date: periodOfReport,
      transaction_code: isNewOrIncrease ? "P" : "S",
      shares: sharesDelta,
      price_per_share: pricePerShare,
      currency: "USD",
      shares_owned_after: holding.shares,
      filing_url: filingUrl,
      filed_at: null,
      dedupe_key: `HF-${managerCik}:${holding.cusip}:${periodOfReport}`,
    });
  }

  // Positions that existed last quarter but are absent from this quarter's
  // filing entirely — fully closed out.
  for (const [cusip, prior] of previous) {
    if (seenCusips.has(cusip)) continue;
    const pricePerShare = prior.valueUsd / prior.shares;
    rows.push({
      source_country: "US",
      accession_number: `HF-${managerCik}:${cusip}:${periodOfReport}`,
      issuer_cik: cusip,
      issuer_name: prior.issuerName,
      issuer_ticker: null,
      owner_cik: managerCik,
      owner_name: managerName,
      owner_title: "Hedgefonds",
      is_ceo: false,
      role: "hedge_fund",
      transaction_date: periodOfReport,
      transaction_code: "S",
      shares: prior.shares,
      price_per_share: pricePerShare,
      currency: "USD",
      shares_owned_after: 0,
      filing_url: filingUrl,
      filed_at: null,
      dedupe_key: `HF-${managerCik}:${cusip}:${periodOfReport}`,
    });
  }

  return rows;
}

async function loadPriorHoldings(
  supabase: SupabaseClient,
  managerCik: string,
  beforePeriod: string
): Promise<{ period: string; holdings: Map<string, { shares: number; valueUsd: number; issuerName: string }> } | null> {
  const { data: latest, error: latestError } = await supabase
    .from("institutional_holdings")
    .select("period_of_report")
    .eq("manager_cik", managerCik)
    .lt("period_of_report", beforePeriod)
    .order("period_of_report", { ascending: false })
    .limit(1);
  if (latestError) throw latestError;
  if (!latest || latest.length === 0) return null;

  const period = latest[0].period_of_report;
  const { data, error } = await supabase
    .from("institutional_holdings")
    .select("cusip, shares, value_usd, issuer_name")
    .eq("manager_cik", managerCik)
    .eq("period_of_report", period);
  if (error) throw error;

  const holdings = new Map(
    (data ?? []).map((row) => [row.cusip, { shares: Number(row.shares), valueUsd: Number(row.value_usd), issuerName: row.issuer_name }])
  );
  return { period, holdings };
}

async function processPeriod(
  supabase: SupabaseClient,
  fund: (typeof HEDGE_FUNDS)[number],
  periodOfReport: string,
  filingUrl: string,
  holdings: Holding[],
  generateMoves: boolean
) {
  const snapshotRows: HoldingRow[] = holdings.map((h) => ({
    manager_cik: fund.cik,
    manager_name: fund.name,
    cusip: h.cusip,
    issuer_name: h.issuerName,
    period_of_report: periodOfReport,
    shares: h.shares,
    value_usd: h.valueUsd,
    filing_url: filingUrl,
  }));
  const { error: snapshotError } = await supabase
    .from("institutional_holdings")
    .upsert(snapshotRows, { onConflict: "manager_cik,cusip,period_of_report", ignoreDuplicates: true });
  if (snapshotError) throw snapshotError;

  if (!generateMoves) return 0;

  const prior = await loadPriorHoldings(supabase, fund.cik, periodOfReport);
  const moves = computeMoves(fund.cik, fund.name, periodOfReport, filingUrl, holdings, prior?.holdings ?? new Map());
  if (moves.length === 0) return 0;

  const { error: movesError } = await supabase
    .from("transactions")
    .upsert(moves, { onConflict: "dedupe_key", ignoreDuplicates: true });
  if (movesError) throw movesError;
  return moves.length;
}

async function main() {
  const supabase = supabaseAdmin();
  let totalMoves = 0;

  for (const fund of HEDGE_FUNDS) {
    try {
      const { data: existing, error: existingError } = await supabase
        .from("institutional_holdings")
        .select("period_of_report")
        .eq("manager_cik", fund.cik)
        .limit(1);
      if (existingError) throw existingError;
      const isFirstRun = !existing || existing.length === 0;

      // On a fund's first-ever run, fetch two quarters at once so there's an
      // immediate baseline to diff against, instead of only ever showing
      // moves starting from whatever the *next* future filing brings.
      const filings = await findRecentFilings(fund.cik, isFirstRun ? 2 : 1);
      if (filings.length === 0) {
        console.log(`${fund.name}: no 13F-HR filings found, skipping.`);
        continue;
      }

      if (!isFirstRun) {
        const [latest] = filings;
        const { data: already } = await supabase
          .from("institutional_holdings")
          .select("period_of_report")
          .eq("manager_cik", fund.cik)
          .order("period_of_report", { ascending: false })
          .limit(1);
        const accNoDashes = latest.accessionNumber.replace(/-/g, "");
        const parsed = await fetchHoldings(fund.cik, accNoDashes);
        if (parsed.isAmendment) {
          console.log(`${fund.name}: latest filing is an amendment, skipping.`);
          continue;
        }
        const lastStoredPeriod = already?.[0]?.period_of_report;
        if (lastStoredPeriod && parsed.periodOfReport === lastStoredPeriod) {
          console.log(`${fund.name}: already up to date (${parsed.periodOfReport}).`);
          continue;
        }
        // SEC's "current filings" feed has occasionally returned a stale
        // result for a bare limit=1 query in testing (once handing back an
        // accession years older than the true latest, which would otherwise
        // get diffed against a much newer stored baseline and produce
        // garbage buy/sell rows). Only ever advance forward in time.
        if (lastStoredPeriod && parsed.periodOfReport < lastStoredPeriod) {
          console.warn(
            `${fund.name}: fetched filing reports period ${parsed.periodOfReport}, older than the stored latest (${lastStoredPeriod}) — skipping as a likely stale read.`
          );
          continue;
        }
        const moveCount = await processPeriod(supabase, fund, parsed.periodOfReport, latest.filingIndexUrl, parsed.holdings, true);
        totalMoves += moveCount;
        console.log(`${fund.name}: ${parsed.periodOfReport} — ${moveCount} move(s).`);
        continue;
      }

      // First run: process oldest-of-the-two first (as pure baseline, no
      // moves), then the newest (diffed against that baseline).
      const ordered = [...filings].reverse();
      for (let i = 0; i < ordered.length; i++) {
        const filing = ordered[i];
        const accNoDashes = filing.accessionNumber.replace(/-/g, "");
        const parsed = await fetchHoldings(fund.cik, accNoDashes);
        if (parsed.isAmendment) continue;
        const moveCount = await processPeriod(supabase, fund, parsed.periodOfReport, filing.filingIndexUrl, parsed.holdings, i > 0);
        totalMoves += moveCount;
        console.log(`${fund.name}: ${parsed.periodOfReport} — ${i === 0 ? "baseline" : `${moveCount} move(s)`}.`);
      }
    } catch (err) {
      console.error(`Failed to process ${fund.name}:`, err);
    }
  }

  console.log(`Done. ${totalMoves} move(s) upserted across ${HEDGE_FUNDS.length} fund(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
