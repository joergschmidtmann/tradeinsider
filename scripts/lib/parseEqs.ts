import { eqsFetchJson } from "./eqsClient";
import { GERMAN_INDEX_ISINS } from "./germanIndices";
import { AUSTRIAN_INDEX_ISINS } from "./austrianIndices";

const NEWS_URL = "https://www.eqs-news.com/wp-json/eqsnews/v1/news";
const DETAIL_URL = "https://www.eqs-news.com/wp-json/eqsnews/v1/newsdetail";

// EQS is primarily used by German and Austrian issuers as their disclosure
// distribution channel — companies from other countries appear only sporadically
// (verified by sampling the feed), so it isn't a viable path to broader European
// coverage. Each additional country covered this way still gets its own curated
// index-membership list, same as GERMAN_INDEX_ISINS/AUSTRIAN_INDEX_ISINS.
const TRACKED_ISINS = new Set([...GERMAN_INDEX_ISINS, ...AUSTRIAN_INDEX_ISINS]);

interface EqsListItem {
  id: string; // UUID with a "_en"/"_de" locale suffix
  date: string;
  categoryCode: string;
  companyName: string;
  isin: string;
  totalItem: number;
}

interface EqsListResponse {
  status: number;
  records: EqsListItem[];
}

/** Fetches one page of the general EQS News feed and returns only
 * "Directors' Dealings" items for tracked DE/AT index constituents. The API's
 * `category` query param doesn't actually filter server-side (verified
 * empirically), so — much like SEC EDGAR's `type=4` prefix-matching quirk
 * (see parseFeed.ts) — filtering happens client-side: categoryCode === "dd".
 *
 * Scoping to TRACKED_ISINS (rather than `isin.startsWith("DE"/"AT")`)
 * matters because real index constituents are sometimes domiciled abroad —
 * e.g. Airbus and Qiagen (DAX) have Dutch ISINs, Redcare Pharmacy (SDAX)
 * and RHI Magnesita (WBI) have Dutch ISINs — and a plain prefix check would
 * silently exclude them even though EQS covers them like any other
 * constituent. */
export async function fetchEqsDirectorsDealingsPage(page: number, perPage = 100): Promise<EqsListItem[]> {
  const url = `${NEWS_URL}?per_page=${perPage}&page=${page}`;
  const data = await eqsFetchJson<EqsListResponse>(url);
  return data.records.filter((item) => item.categoryCode === "dd" && TRACKED_ISINS.has(item.isin));
}

/** Resolves an ISIN to the tracked country it was scoped under — DE or AT
 * index membership, never the ISIN's own country prefix, since some real
 * constituents are domiciled abroad (see the comment on fetchEqsDirectorsDealingsPage).
 * Only ever called on an ISIN that already passed the TRACKED_ISINS filter
 * above, so one of the two branches always matches. */
export function resolveTrackedCountry(isin: string): "DE" | "AT" {
  if (GERMAN_INDEX_ISINS.has(isin)) return "DE";
  if (AUSTRIAN_INDEX_ISINS.has(isin)) return "AT";
  throw new Error(`ISIN ${isin} is not in a tracked index — resolveTrackedCountry() should only be called on already-filtered items.`);
}

export type EqsRole = "management_board" | "supervisory_board";

export interface ParsedEqsTransaction {
  issuerName: string;
  issuerLei: string;
  ownerFirstName: string;
  ownerLastName: string;
  isin: string;
  date: string;
  code: "P" | "S";
  price: number;
  volumeEur: number;
  shareUrl: string;
  role: EqsRole;
}

/** Fetches full detail for one notification and returns a normalized
 * transaction, or null if it doesn't pass our scope filters:
 *  - reason.position.boardofdirectors or .supervisoryboard === 1 (excludes
 *    other PDMR categories, e.g. closely-associated-person gift transactions
 *    where the position is nested under closerelationship.trigger instead)
 *  - typeOfTrade is exactly buy or sell (excludes grants, tender rights, etc.)
 *  - financialInstrument.identifier === "1" (ordinary share; excludes
 *    derivatives, matching the SEC pipeline's non-derivative-only scope) */
export async function fetchEqsTransaction(id: string): Promise<ParsedEqsTransaction | null> {
  const url = `${DETAIL_URL}?news_id=${id}`;
  const data = await eqsFetchJson<{ status: number; records: any }>(url); // eslint-disable-line @typescript-eslint/no-explicit-any -- untyped external API
  const meta = data.records?.metaData?.en;
  const trading = meta?.tradingDetails;
  const shareUrl: string | undefined = data.records?.share_url;
  if (!trading || !shareUrl) return null;

  const position = trading.reason?.position;
  let role: EqsRole;
  if (position?.boardofdirectors === 1) role = "management_board";
  else if (position?.supervisoryboard === 1) role = "supervisory_board";
  else return null;

  if (trading.financialInstrument?.identifier !== "1") return null;

  let code: "P" | "S";
  if (trading.typeOfTrade?.buy === 1) code = "P";
  else if (trading.typeOfTrade?.sell === 1) code = "S";
  else return null;

  const price = Number(trading.priceVolume?.transaction?.price);
  const volumeEur = Number(trading.priceVolume?.transaction?.volume);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(volumeEur)) return null;

  return {
    issuerName: trading.issuer?.name ?? "",
    issuerLei: trading.issuer?.lei ?? "",
    ownerFirstName: trading.person?.name?.firstName ?? "",
    ownerLastName: trading.person?.name?.lastName ?? "",
    isin: trading.financialInstrument?.isin ?? "",
    date: trading.dateOfTrade,
    code,
    price,
    volumeEur,
    shareUrl,
    role,
  };
}
