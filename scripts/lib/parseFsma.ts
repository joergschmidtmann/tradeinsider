import { fsmaFetchText } from "./fsmaClient";

const SEARCH_URL = "https://www.fsma.be/en/transaction-search";
const SITE_ORIGIN = "https://www.fsma.be";

export interface FsmaTransactionRef {
  slug: string;
  publicationDate: string; // ISO yyyy-mm-dd
  detailUrl: string;
}

export interface FsmaTransaction {
  slug: string;
  issuerName: string;
  ownerName: string;
  ownerTitle: string;
  isin: string;
  transactionDate: string; // ISO yyyy-mm-dd
  publicationDate: string; // ISO yyyy-mm-dd
  shares: number;
  pricePerShare: number;
  currency: string;
  transactionType: "P" | "S";
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .trim();
}

function parseBelgianDate(raw: string): string {
  // dd/mm/yyyy -> yyyy-mm-dd
  const [day, month, year] = raw.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const ROW_RE =
  /<td headers="view-field-ct-date-time-table-column"[^>]*>([^<]*)<\/td>\s*<td headers="view-title-table-column"[^>]*><a href="([^"]+)">/g;

/** Lists every notification published in [fromDate, toDate] (both
 * "YYYY-MM-DD"). The search results table only carries date/issuer/notifier
 * — not the transaction itself — so this just discovers which detail pages
 * to fetch; unlike every other pipeline here a single page holds at most 50
 * rows with no visible pager for this view, but a date-scoped query (the
 * pattern this project already uses for its rolling-window scans) stays
 * comfortably under that. */
export async function findRecentTransactionUrls(fromDate: string, toDate: string): Promise<FsmaTransactionRef[]> {
  const url = `${SEARCH_URL}?issuer=&date%5Bmin%5D=${fromDate}&date%5Bmax%5D=${toDate}&order=field_ct_date_time&sort=asc`;
  const html = await fsmaFetchText(url);
  const refs: FsmaTransactionRef[] = [];
  for (const match of html.matchAll(ROW_RE)) {
    const dateRaw = decodeEntities(match[1]);
    const href = match[2];
    const slug = href.split("/").pop();
    if (!slug || !dateRaw) continue;
    refs.push({ slug, publicationDate: parseBelgianDate(dateRaw), detailUrl: `${SITE_ORIGIN}${href}` });
  }
  return refs;
}

function fieldItem(html: string, fieldSlug: string): string | null {
  const re = new RegExp(`field--name-field-ct-${fieldSlug}[\\s\\S]*?<div[^>]*class="field__item"[^>]*>([\\s\\S]*?)<\\/div>`);
  const match = html.match(re);
  return match ? decodeEntities(match[1].replace(/<[^>]+>/g, "")) : null;
}

function fieldItemContent(html: string, fieldSlug: string): string | null {
  const re = new RegExp(`field--name-field-ct-${fieldSlug}[\\s\\S]*?<div content="([^"]*)"`);
  const match = html.match(re);
  return match ? match[1] : null;
}

/** Fetches one notification's detail page. Every field this project needs
 * is labeled, structured Drupal markup (English locale) — quantity, price,
 * and the transaction date carry a machine-readable `content`/`datetime`
 * attribute alongside the locale-formatted display text, so those are used
 * directly instead of parsing Belgian-formatted numbers. Returns null for
 * anything that isn't a plain ordinary-share market trade (matches the
 * instrument-type filter used by every other European pipeline here) or
 * whose Transaction Type isn't one of the two known values. */
export async function fetchTransactionDetail(ref: FsmaTransactionRef): Promise<FsmaTransaction | null> {
  const html = await fsmaFetchText(ref.detailUrl);

  const instrumentType = fieldItem(html, "instrument-type");
  if (instrumentType !== "Share") return null;

  const transactionTypeRaw = fieldItem(html, "transaction-type");
  const transactionType = transactionTypeRaw === "Purchase / Acquisition" ? "P" : transactionTypeRaw === "Sale / Disposal" ? "S" : null;
  if (!transactionType) return null;

  const issuerName = fieldItem(html, "issuer");
  const ownerName = fieldItem(html, "declarer-name");
  const ownerTitle = fieldItem(html, "declarer-type");
  const isin = fieldItem(html, "instrument-isin-code");
  const currency = fieldItem(html, "transaction-currency");
  const quantity = fieldItemContent(html, "transaction-quantity");
  const price = fieldItemContent(html, "price");
  const transactionDateTime = html.match(/field--name-field-ct-transaction-date[\s\S]*?<time datetime="([^"T]+)/);

  if (!issuerName || !ownerName || !isin || !currency || !quantity || !price || !transactionDateTime) return null;

  return {
    slug: ref.slug,
    issuerName,
    ownerName,
    ownerTitle: ownerTitle ?? "",
    isin,
    transactionDate: transactionDateTime[1],
    publicationDate: ref.publicationDate,
    shares: Number(quantity),
    pricePerShare: Number(price),
    currency,
    transactionType,
  };
}
