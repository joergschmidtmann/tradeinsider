const CONTACT_EMAIL = process.env.CONTACT_EMAIL;
if (!CONTACT_EMAIL) {
  throw new Error("CONTACT_EMAIL environment variable is required.");
}
const USER_AGENT = `TradeInsider.io ${CONTACT_EMAIL}`;

// AFM's own bulk export for this register — a single request returns the
// entire history since 2006 (no session/date param, verified live with a
// bare curl), so unlike every other European pipeline here there's no
// pagination or date-window client needed.
const EXPORT_URL = "https://www.afm.nl/export.aspx?type=1b934036-12ad-4950-9773-31361d5adbd9&format=xml";

export interface AfmTransaction {
  meldingId: string;
  index: number; // position of this Wijziging within its vermelding — see dedupe_key note in ingest-nl.ts
  issuerName: string;
  ownerName: string;
  transactionDate: string; // ISO yyyy-mm-dd
  shares: number; // positive = acquisition, negative = disposal
  pricePerShare: number;
  currency: string;
  sharesOwnedAfter: number | null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .trim();
}

function parseUsDate(raw: string): string {
  const [month, day, year] = raw.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function firstTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? decodeEntities(match[1]) : null;
}

interface Position {
  soort: string;
  aantal: number;
}

function parsePositions(block: string, containerTag: string, itemTag: string): Position[] {
  const container = block.match(new RegExp(`<${containerTag}>([\\s\\S]*?)</${containerTag}>`));
  if (!container) return [];
  const positions: Position[] = [];
  for (const itemMatch of container[1].matchAll(new RegExp(`<${itemTag}>([\\s\\S]*?)</${itemTag}>`, "g"))) {
    const soort = firstTag(itemMatch[1], "SoortEffect");
    const aantal = firstTag(itemMatch[1], "AantalEffecten");
    if (soort && aantal !== null) positions.push({ soort, aantal: Number(aantal) });
  }
  return positions;
}

async function fetchExportXml(): Promise<string> {
  const res = await fetch(EXPORT_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`AFM export request failed: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

/** Parses the AFM's full bulk export into one row per real, market-priced
 * ordinary-share transaction. A single notification (<vermelding>, keyed by
 * meldingid) can bundle changes across several instrument types (e.g.
 * restricted shares vesting into ordinary shares) — only "Gewoon aandeel"
 * (ordinary share) changes with a nonzero price are real market trades;
 * everything else (RSU vesting, share-class conversions, option grants) is
 * skipped rather than guessed at, same principle as the UK plan's Nil-Cost
 * filter. */
export async function fetchAllTransactions(): Promise<AfmTransaction[]> {
  const xml = await fetchExportXml();
  const transactions: AfmTransaction[] = [];

  for (const vermeldingMatch of xml.matchAll(/<vermelding>([\s\S]*?)<\/vermelding>/g)) {
    const block = vermeldingMatch[1];
    const meldingId = firstTag(block, "meldingid");
    const datum = firstTag(block, "DatumMeldingsplicht");
    const issuerName = firstTag(block, "UitgevendeInstelling");
    const ownerName = firstTag(block, "Meldingsplichtige");
    if (!meldingId || !datum || !issuerName || !ownerName) continue;

    const naposities = parsePositions(block, "Naposities", "Napositie");

    const wijzigingenContainer = block.match(/<Wijzigingen>([\s\S]*?)<\/Wijzigingen>/);
    if (!wijzigingenContainer) continue;
    const wijzigingMatches = [...wijzigingenContainer[1].matchAll(/<Wijziging>([\s\S]*?)<\/Wijziging>/g)];

    wijzigingMatches.forEach((wijzigingMatch, index) => {
      const w = wijzigingMatch[1];
      const soort = firstTag(w, "SoortEffect");
      const aantalRaw = firstTag(w, "AantalEffecten");
      const prijsRaw = firstTag(w, "WaardePerAandeel");
      const valuta = firstTag(w, "Valuta");
      if (soort !== "Gewoon aandeel" || aantalRaw === null || prijsRaw === null || !valuta) return;

      const shares = Number(aantalRaw);
      const pricePerShare = Number(prijsRaw);
      if (shares === 0 || pricePerShare <= 0) return;

      const matchingNapositie = naposities.find((p) => p.soort === "Gewoon aandeel");

      transactions.push({
        meldingId,
        index,
        issuerName,
        ownerName,
        transactionDate: parseUsDate(datum),
        shares,
        pricePerShare,
        currency: valuta,
        sharesOwnedAfter: matchingNapositie ? matchingNapositie.aantal : null,
      });
    });
  }

  return transactions;
}
