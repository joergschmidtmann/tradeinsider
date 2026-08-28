import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 0-100 signal-strength score for a single Vorstand/Aufsichtsrat purchase.
 * Deliberately simple and free of live market data (no FX rates, no price
 * history) — four factors, each capped, summed to a max of 100:
 *
 *   - seniority (0-40): keyword match on owner_title. owner_title quality
 *     varies wildly by country (US has real officer titles; DE/AT only ever
 *     say "Vorstand"/"Aufsichtsrat"; NL has none at all) — unknown/generic
 *     titles get a neutral middle score rather than being penalized.
 *   - relative position increase (0-35): needs shares_owned_after, which
 *     only US/NL/hedge-fund rows have. ES/SE/BE fall back to a neutral value.
 *   - absolute deal size (0-15): rough per-currency order-of-magnitude
 *     thresholds, not a real FX conversion.
 *   - cluster bonus (0-10): other Vorstand/Aufsichtsrat purchases at the same
 *     issuer in the trailing 14 days. Backward-looking only, since the score
 *     is computed once at ingest — a later second buyer doesn't retroactively
 *     bump the first buyer's already-stored score.
 */

const SENIORITY_TOP = 40;
const SENIORITY_SENIOR = 28;
const SENIORITY_GENERIC = 15;

const CEO_PATTERNS = [
  /chief executive officer/i,
  /\bceo\b/i,
  /verkställande direktör/i,
  /\bvd\b/i,
  /vorstandsvorsitzender/i,
  /presidente ejecutivo/i,
  /\bchairman\b/i,
];

const SENIOR_PATTERNS = [
  /chief financial officer/i,
  /\bcfo\b/i,
  /chief operating officer/i,
  /\bcoo\b/i,
  /senior executive/i,
  /managing director/i,
  /\bpresident\b/i,
];

function seniorityScore(ownerTitle: string | null): number {
  if (!ownerTitle) return SENIORITY_GENERIC;
  if (CEO_PATTERNS.some((p) => p.test(ownerTitle))) return SENIORITY_TOP;
  if (SENIOR_PATTERNS.some((p) => p.test(ownerTitle))) return SENIORITY_SENIOR;
  return SENIORITY_GENERIC;
}

function positionIncreaseScore(shares: number | null, sharesOwnedAfter: number | null): number {
  if (shares === null || sharesOwnedAfter === null) return 15; // unknown prior position (ES/SE/BE)
  const priorShares = sharesOwnedAfter - shares;
  if (priorShares <= 0) return 22; // brand-new disclosed position
  const pctIncrease = shares / priorShares;
  if (pctIncrease >= 0.5) return 35;
  if (pctIncrease >= 0.2) return 25;
  if (pctIncrease >= 0.05) return 15;
  return 8;
}

// Rough order-of-magnitude thresholds per currency, not a real FX conversion.
// { mediumFrom, highFrom } in that currency's own units.
const DEAL_SIZE_THRESHOLDS: Record<string, { mediumFrom: number; highFrom: number }> = {
  USD: { mediumFrom: 500_000, highFrom: 2_000_000 },
  EUR: { mediumFrom: 500_000, highFrom: 2_000_000 },
  GBP: { mediumFrom: 500_000, highFrom: 2_000_000 },
  SEK: { mediumFrom: 5_000_000, highFrom: 20_000_000 },
  NOK: { mediumFrom: 5_000_000, highFrom: 20_000_000 },
  PLN: { mediumFrom: 2_000_000, highFrom: 8_000_000 },
  CZK: { mediumFrom: 12_000_000, highFrom: 48_000_000 },
  ZAR: { mediumFrom: 9_000_000, highFrom: 36_000_000 },
};

function dealSizeScore(totalValue: number | null, currency: string): number {
  if (totalValue === null) return 0;
  const thresholds = DEAL_SIZE_THRESHOLDS[currency] ?? DEAL_SIZE_THRESHOLDS.USD;
  if (totalValue >= thresholds.highFrom) return 15;
  if (totalValue >= thresholds.mediumFrom) return 8;
  return 3;
}

const CLUSTER_WINDOW_DAYS = 14;
const BOARD_ROLES = ["management_board", "supervisory_board"];

async function clusterBonus(supabase: SupabaseClient, issuerName: string, transactionDate: string): Promise<number> {
  const windowStart = new Date(transactionDate);
  windowStart.setDate(windowStart.getDate() - CLUSTER_WINDOW_DAYS);

  const { count, error } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("issuer_name", issuerName)
    .in("role", BOARD_ROLES)
    .eq("transaction_code", "P")
    .gte("transaction_date", windowStart.toISOString().slice(0, 10))
    .lt("transaction_date", transactionDate);
  if (error) throw error;

  const otherBuyers = count ?? 0;
  if (otherBuyers >= 2) return 10;
  if (otherBuyers === 1) return 5;
  return 0;
}

export interface InsiderScoreInput {
  ownerTitle: string | null;
  shares: number | null;
  sharesOwnedAfter: number | null;
  totalValue: number | null;
  currency: string;
  issuerName: string;
  transactionDate: string; // ISO yyyy-mm-dd
}

export async function computeInsiderScore(supabase: SupabaseClient, input: InsiderScoreInput): Promise<number> {
  const seniority = seniorityScore(input.ownerTitle);
  const positionIncrease = positionIncreaseScore(input.shares, input.sharesOwnedAfter);
  const dealSize = dealSizeScore(input.totalValue, input.currency);
  const cluster = await clusterBonus(supabase, input.issuerName, input.transactionDate);
  return Math.min(100, seniority + positionIncrease + dealSize + cluster);
}
