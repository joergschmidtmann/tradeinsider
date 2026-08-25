import { eqsFetchJson } from "./eqsClient";
import { GERMAN_INDEX_ISINS } from "./germanIndices";

const NEWS_URL = "https://www.eqs-news.com/wp-json/eqsnews/v1/news";
const DETAIL_URL = "https://www.eqs-news.com/wp-json/eqsnews/v1/newsdetail";

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
 * "Directors' Dealings" items for DAX/MDAX/SDAX constituents. The API's
 * `category` query param doesn't actually filter server-side (verified
 * empirically), so — much like SEC EDGAR's `type=4` prefix-matching quirk
 * (see parseFeed.ts) — filtering happens client-side: categoryCode === "dd".
 *
 * Scoping to GERMAN_INDEX_ISINS (rather than `isin.startsWith("DE")`)
 * matters because real index constituents are sometimes domiciled abroad —
 * e.g. Airbus and Qiagen (DAX) have Dutch ISINs, Redcare Pharmacy (SDAX)
 * has a Dutch ISIN — and a plain "DE" prefix check would silently exclude
 * them even though EQS covers them like any other constituent. */
export async function fetchGermanDirectorsDealingsPage(page: number, perPage = 100): Promise<EqsListItem[]> {
  const url = `${NEWS_URL}?per_page=${perPage}&page=${page}`;
  const data = await eqsFetchJson<EqsListResponse>(url);
  return data.records.filter((item) => item.categoryCode === "dd" && GERMAN_INDEX_ISINS.has(item.isin));
}

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
}

/** Fetches full detail for one notification and returns a normalized
 * transaction, or null if it doesn't pass our scope filters:
 *  - reason.position.boardofdirectors === 1 (Vorstand/management board;
 *    excludes Aufsichtsrat/supervisory board and other PDMR categories)
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

  if (trading.reason?.position?.boardofdirectors !== 1) return null;
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
  };
}
