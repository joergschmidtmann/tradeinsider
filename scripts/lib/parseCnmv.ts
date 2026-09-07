import { cnmvFetchText, cnmvFetchBuffer } from "./cnmvClient";
import { extractPdfText } from "./pdfText";

const RESULTS_URL = "https://www.cnmv.es/portal/Consultas/Directivos-Resultado";

export interface CnmvDeclaration {
  registrationNumber: string;
  issuerName: string;
  declarant: string;
  motivo: string; // "Persona con Responsabilidad de Dirección" (PDMR itself) or "Persona Estrechamente Vinculada" (closely associated) — both kept, see parseCnmv comment below
  documentUrl: string;
  filedDate: string; // ISO yyyy-mm-dd, from the results list (not the transaction date inside the PDF)
}

function toIso(esDate: string): string {
  const [day, month, year] = esDate.split("/");
  return `${year}-${month}-${day}`;
}

/** Parses one page of the results list. Each entry is a self-contained <li>
 * block with a predictable structure (verified live against real filings —
 * Iberdrola, BBVA, Fluidra, Naturhouse, Renta 4, Gestamp) — matched by
 * splitting on the block boundary rather than a full HTML parser, consistent
 * with this project's existing regex-based approach (see scripts/ingest.ts). */
function parseResultsPage(html: string): CnmvDeclaration[] {
  const blocks = html.split(/<li id="[^"]*elementoPrimerNivel"/).slice(1);
  const declarations: CnmvDeclaration[] = [];
  for (const block of blocks) {
    const date = block.match(/class="fecha-no-icon">\s*([\d/]+)\s*</)?.[1];
    const issuerName = block.match(/class="tit-small">([^<]+)</)?.[1];
    const declarant = block.match(/class="negrita"[^>]*>Declarante:\s*([^<]+)</)?.[1];
    const docMatch = block.match(/subtituloRegistroEnlace"\s+href="([^"]+)"[^>]*>Motivo de la notificaci[oó]n:\s*([^<]+)</);
    const registrationNumber = block.match(/N[uú]mero de registro:\s*(\d+)/)?.[1];
    if (!date || !issuerName || !declarant || !docMatch || !registrationNumber) continue;
    declarations.push({
      registrationNumber,
      issuerName: issuerName.trim(),
      declarant: declarant.trim(),
      motivo: docMatch[2].trim(),
      documentUrl: docMatch[1],
      filedDate: toIso(date),
    });
  }
  return declarations;
}

/** Fetches every result in [fromDate, toDate] (both "DD/MM/YYYY"), paging
 * through the CNMV's date-range search until a page comes back with fewer
 * than 10 results (its page size). No session/ViewState needed — verified
 * live that a fresh, cookie-less request to this URL returns real results
 * directly, despite the page being an ASP.NET WebForms search form.
 *
 * Also stops once a page contributes no registration numbers we haven't
 * already seen. Seen live (2026-09-07, two runs back to back): under the
 * ingest workflow's request pattern, CNMV sometimes keeps returning ~10
 * results per page for hundreds of pages past the real end of a 3-day
 * window's ~12 results, instead of the expected short final page — until it
 * 400s around page 1000. A plain ad hoc curl against the same URL paginates
 * correctly, so this looks like a CNMV-side quirk under repeated/throttled
 * requests rather than our regex misparsing an error page. The dedupe check
 * catches that as soon as it starts repeating; MAX_PAGES is a last-resort
 * cap in case it instead cycles through junk that never repeats. */
const MAX_PAGES = 50;

export async function findRecentDeclarations(fromDate: string, toDate: string): Promise<CnmvDeclaration[]> {
  const all: CnmvDeclaration[] = [];
  const seen = new Set<string>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${RESULTS_URL}?fechad=${fromDate}&fechah=${toDate}&page=${page}`;
    const html = await cnmvFetchText(url);
    const pageResults = parseResultsPage(html);
    const newResults = pageResults.filter((d) => !seen.has(d.registrationNumber));
    if (newResults.length === 0) break;
    newResults.forEach((d) => seen.add(d.registrationNumber));
    all.push(...newResults);
    if (pageResults.length < 10) break;
  }
  return all;
}

export interface CnmvTransaction {
  isin: string;
  nature: "Compra" | "Venta";
  date: string; // ISO yyyy-mm-dd
  volume: number;
  price: number;
  currency: string;
}

// Matches one data row from section 4 of the standardized MAR Annex I form,
// e.g. "ES0144580Y14 Acción Compra 25/08/2026 XMAD 2450,00 20,06 EUR" — the
// row always starts with the ISIN and is on its own line (verified live
// against Iberdrola, BBVA, Fluidra, Gestamp). The instrument-type capture is
// intentionally generic (not hardcoded to "Acción") so non-share instruments
// still match and can be filtered out explicitly below, the same way EQS's
// financialInstrument.identifier==="1" check works.
const ROW_RE =
  /^([A-Z]{2}[A-Z0-9]{9,10})\s+(.+?)\s+(Compra|Venta)\s+(\d{2})\/(\d{2})\/(\d{4})\s+(\S+)\s+([\d.,]+)\s+([\d.,]+)\s+([A-Z]{3})$/gm;

function parseEsNumber(raw: string): number {
  return Number(raw.replace(/\./g, "").replace(",", "."));
}

export interface CnmvDeclarationDetail {
  lei: string | null;
  transactions: CnmvTransaction[];
}

/** Fetches one declaration's PDF and extracts the issuer's LEI plus every
 * "Acción"/Compra-Venta row — a single filing can bundle several days' trades
 * into one PDF (seen live: Gestamp's ACEK filing had four same-instrument
 * rows, one per day; Fluidra had two same-day rows with different volumes),
 * so `transactions` is an array rather than a single value. Non-share
 * instruments (bonds, options, etc.) are matched by ROW_RE but filtered out
 * here, not in the regex, mirroring the France plan's "Description de
 * l'instrument financier" filter. */
export async function fetchDeclarationDetail(documentUrl: string): Promise<CnmvDeclarationDetail> {
  const buffer = await cnmvFetchBuffer(documentUrl);
  const text = await extractPdfText(buffer);

  const lei = text.match(/b\)\s*LEI:\s*\n?\s*([A-Z0-9]{20})/)?.[1] ?? null;

  const transactions: CnmvTransaction[] = [];
  for (const match of text.matchAll(ROW_RE)) {
    const [, isin, instrument, nature, day, month, year, , volume, price, currency] = match;
    if (instrument.trim() !== "Acción") continue;
    transactions.push({
      isin,
      nature: nature as "Compra" | "Venta",
      date: `${year}-${month}-${day}`,
      volume: parseEsNumber(volume),
      price: parseEsNumber(price),
      currency,
    });
  }
  return { lei, transactions };
}
