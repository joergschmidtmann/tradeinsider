import { eqsFetchJson } from "./eqsClient";
import { GERMAN_INDEX_ISINS } from "./germanIndices";

const NEWS_URL = "https://www.eqs-news.com/wp-json/eqsnews/v1/news";
const DETAIL_URL = "https://www.eqs-news.com/wp-json/eqsnews/v1/newsdetail";

export interface EqsCorporateNewsItem {
  id: string; // UUID with a "_en"/"_de" locale suffix
  date: string;
  companyName: string;
  headline: string;
}

interface EqsListItem {
  id: string;
  date: string;
  categoryCode: string;
  companyName: string;
  isin: string;
  headline: string;
}

interface EqsListResponse {
  status: number;
  records: EqsListItem[];
}

/** Fetches one page of the general EQS News feed and returns only "Corporate"
 * items (earnings, M&A, product news, etc. — general business news, unlike
 * the regulatory "Directors' Dealings" category in parseEqs.ts) for
 * DAX/MDAX/SDAX constituents. Same categoryCode-doesn't-filter-server-side
 * quirk as the Directors' Dealings feed, so filtering happens client-side. */
export async function fetchCorporateNewsPage(page: number, perPage = 100): Promise<EqsCorporateNewsItem[]> {
  const url = `${NEWS_URL}?per_page=${perPage}&page=${page}`;
  const data = await eqsFetchJson<EqsListResponse>(url);
  return data.records
    .filter((item) => item.categoryCode === "corporate" && GERMAN_INDEX_ISINS.has(item.isin))
    .map((item) => ({ id: item.id, date: item.date, companyName: item.companyName, headline: item.headline }));
}

/** The list endpoint doesn't include a shareable article URL — only the
 * per-item detail endpoint does (same as parseEqs.ts's fetchEqsTransaction). */
export async function fetchEqsShareUrl(id: string): Promise<string | null> {
  const url = `${DETAIL_URL}?news_id=${id}`;
  const data = await eqsFetchJson<{ status: number; records: { share_url?: string } }>(url);
  return data.records?.share_url ?? null;
}
