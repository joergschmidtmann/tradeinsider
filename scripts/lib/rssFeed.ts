import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: true,
  trimValues: true,
  cdataPropName: "__cdata",
});

export interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string | null;
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Extracts plain text from a field that may be a bare string, a CDATA
 * section (`{ __cdata: "..." }`), or absent. RSS descriptions in particular
 * are often wrapped in CDATA to safely carry embedded HTML/entities. */
function textOf(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object" && "__cdata" in (value as Record<string, unknown>)) {
    const cdata = (value as Record<string, unknown>).__cdata;
    return typeof cdata === "string" ? cdata.trim() || null : null;
  }
  return String(value).trim() || null;
}

/** Fetches and parses a standard RSS 2.0 feed into a flat list of items.
 * A basic User-Agent is set (some sites reject requests with no UA at all),
 * but unlike the SEC/EQS clients there's no rate limiting here — this is
 * called at most a few times per ingestion run, well under any reasonable
 * politeness threshold. */
export async function fetchRssItems(url: string): Promise<RssItem[]> {
  const res = await fetch(url, { headers: { "User-Agent": "TradeInsider.io (+https://tradeinsider.io)" } });
  if (!res.ok) {
    throw new Error(`RSS request failed: ${res.status} ${res.statusText} for ${url}`);
  }
  const xml = await res.text();
  const doc = parser.parse(xml);
  const rawItems = toArray(doc.rss?.channel?.item);

  return rawItems
    .map((item) => ({
      title: textOf(item.title) ?? "",
      link: textOf(item.link) ?? "",
      pubDate: textOf(item.pubDate) ?? "",
      description: textOf(item.description),
    }))
    .filter((item) => item.title && item.link && item.pubDate);
}
