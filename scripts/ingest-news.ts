import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { fetchRssItems } from "./lib/rssFeed";
import { fetchCorporateNewsPage, fetchEqsShareUrl } from "./lib/eqsCorporateNews";

const ECB_RSS_URL = "https://www.ecb.europa.eu/rss/press.html";
const DESTATIS_RSS_URL = "https://www.destatis.de/SiteGlobals/Functions/RSSFeed/DE/RSSNewsfeed/Aktuell.xml";
const EQS_PAGES_TO_SCAN = 2; // ~200 recent items across all EQS categories, filtered down to DAX/MDAX/SDAX "Corporate" news

interface NewsRow {
  source: "ecb" | "destatis" | "eqs_corporate";
  headline: string;
  summary: string | null;
  url: string;
  published_at: string;
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }
  return createClient(url, serviceRoleKey);
}

async function collectRssRows(source: "ecb" | "destatis", url: string): Promise<NewsRow[]> {
  const items = await fetchRssItems(url);
  return items
    .map((item): NewsRow | null => {
      const publishedAt = new Date(item.pubDate);
      if (Number.isNaN(publishedAt.getTime())) return null;
      return {
        source,
        headline: item.title,
        summary: item.description,
        url: item.link,
        published_at: publishedAt.toISOString(),
      };
    })
    .filter((row): row is NewsRow => row !== null);
}

async function collectEqsRows(): Promise<NewsRow[]> {
  const items = [];
  for (let page = 1; page <= EQS_PAGES_TO_SCAN; page++) {
    items.push(...(await fetchCorporateNewsPage(page)));
  }

  const rows: NewsRow[] = [];
  for (const item of items) {
    try {
      const shareUrl = await fetchEqsShareUrl(item.id);
      if (!shareUrl) continue;
      const publishedAt = new Date(item.date);
      if (Number.isNaN(publishedAt.getTime())) continue;
      rows.push({
        source: "eqs_corporate",
        headline: `${item.companyName}: ${item.headline}`,
        summary: null,
        url: shareUrl,
        published_at: publishedAt.toISOString(),
      });
    } catch (err) {
      console.error(`Failed to process EQS corporate news item ${item.id}:`, err);
    }
  }
  return rows;
}

async function main() {
  const supabase = supabaseAdmin();

  console.log("Fetching ECB, Destatis and EQS corporate news...");
  const [ecbRows, destatisRows, eqsRows] = await Promise.all([
    collectRssRows("ecb", ECB_RSS_URL),
    collectRssRows("destatis", DESTATIS_RSS_URL),
    collectEqsRows(),
  ]);
  const allRows = [...ecbRows, ...destatisRows, ...eqsRows];
  console.log(`ECB: ${ecbRows.length}, Destatis: ${destatisRows.length}, EQS Corporate: ${eqsRows.length}`);

  const urls = allRows.map((r) => r.url);
  const { data: known, error: knownError } = await supabase.from("news_items").select("url").in("url", urls);
  if (knownError) throw knownError;
  const knownUrls = new Set((known ?? []).map((row) => row.url));

  const newRows = allRows.filter((r) => !knownUrls.has(r.url));
  console.log(`${newRows.length} items are new (not yet in the database).`);

  if (newRows.length > 0) {
    const { error } = await supabase.from("news_items").upsert(newRows, { onConflict: "url", ignoreDuplicates: true });
    if (error) throw error;
  }

  console.log(`Done. ${newRows.length} row(s) upserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
