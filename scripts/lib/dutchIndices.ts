/**
 * ISINs (and a plain-name fallback, see note below) of current AEX, AMX,
 * and AScX constituents (Euronext Amsterdam), captured 2026-09-08.
 *
 * Sourcing: live.euronext.com's robots.txt disallows ClaudeBot from the
 * `/product/` path (live composition pages), but not from
 * `/sites/default/files/documentation/...`, which hosts Euronext's own
 * index-composition PDFs (dated 30 June 2026, the most recent free
 * release) — used for names/tickers. The free AEX PDF is truncated to the
 * top 19 of 30 names ("full composition available to licensed clients"),
 * so the full AEX list plus most ISINs came from BlackRock's public
 * iShares AEX UCITS ETF (IE00B0M62Y33) and iShares MSCI Netherlands ETF
 * (EWN) holdings feeds instead (both unrestricted by ishares.com's
 * robots.txt), cross-checked against Euronext's own review press releases
 * for the September 2025 / March 2026 / June 2026 changes (e.g. AEX
 * expanded from 25 to 30 constituents in Sept 2025; Randstad moved
 * AEX->AMX and SBM Offshore replaced it in March 2026).
 *
 * Next quarterly review was scheduled for 8 September 2026 (the day this
 * was captured) — results weren't published yet, so this could shift
 * within about two weeks of capture (changes take effect the third Friday
 * of the review month). Refresh against the same sources periodically.
 *
 * Two entries are lower-confidence than the rest, flagged inline: Lakefront
 * Biotherapeutics' ISIN came from a single secondary-source snippet, not
 * independently cross-verified; Vastned Retail's ticker/ISIN pairing
 * (VASTB vs. a code also seen under VASTN elsewhere) wasn't fully
 * reconciled. No ISIN was fabricated — everywhere one couldn't be
 * confirmed, it's flagged rather than silently included as fact.
 *
 * Netherlands-specific complication (same as the German lists' Airbus/
 * Qiagen situation, just more common here): several AEX/AMX/AScX
 * constituents are domiciled/ISIN'd outside the Netherlands despite being
 * Dutch-index members — e.g. Shell (GB), Unilever (GB), DSM-Firmenich
 * (CH), Aegon (Bermuda), CVC Capital Partners (Jersey), Air France-KLM
 * (FR), Theon International (Cyprus), HAL Trust (Bermuda), Ferrari Group
 * plc (GB — a UK staffing/real-estate firm, NOT the Italian carmaker).
 *
 * scripts/lib/parseAfm.ts's AFM data source has NO ISIN/LEI field at all
 * (only the plain issuer name), so ISIN-based filtering can't work for NL
 * ingestion the way it does for the other index files — DUTCH_INDEX_NAMES
 * below is the actually-usable fallback for that case, but it is NOT
 * guaranteed to match AFM's `issuerName` strings verbatim (different
 * casing/legal-suffix conventions, e.g. "Heineken N.V." here vs. AFM's own
 * spelling) — any consumer will need fuzzy/normalized matching, not a
 * plain Set lookup, same caveat as swedishIndices.ts.
 */
export interface DutchIndexConstituent {
  isin: string;
  name: string;
}

const AEX_CONSTITUENTS: DutchIndexConstituent[] = [
  { isin: "GB00BP6MXD84", name: "Shell plc" },
  { isin: "NL0010273215", name: "ASML Holding" },
  { isin: "GB00BVZK7T90", name: "Unilever plc" },
  { isin: "NL0011821202", name: "ING Groep" },
  { isin: "GB00B2B0DG97", name: "RELX plc" },
  { isin: "NL0013654783", name: "Prosus N.V." },
  { isin: "NL0000334118", name: "ASM International" },
  { isin: "NL0012969182", name: "Adyen N.V." },
  { isin: "LU1598757687", name: "ArcelorMittal SA" },
  { isin: "NL0011794037", name: "Koninklijke Ahold Delhaize" },
  { isin: "NL0011540547", name: "ABN AMRO Bank N.V." },
  { isin: "NL0010773842", name: "NN Group" },
  { isin: "NL0000009165", name: "Heineken N.V." },
  { isin: "CH1216478797", name: "DSM-Firmenich AG" },
  { isin: "NL0000009538", name: "Koninklijke Philips" },
  { isin: "NL0000395903", name: "Wolters Kluwer" },
  { isin: "NL0000009082", name: "Koninklijke KPN" },
  { isin: "NL0015000IY2", name: "Universal Music Group" },
  { isin: "NL0012866412", name: "BE Semiconductor Industries (Besi)" },
  { isin: "NL0011872643", name: "ASR Nederland" },
  { isin: "BMG0112X1056", name: "Aegon Ltd." },
  { isin: "NL0013267909", name: "Akzo Nobel" },
  { isin: "NL0015002MS2", name: "The Magnum Ice Cream Company" },
  { isin: "NL0012059018", name: "Exor N.V." },
  { isin: "NL0010801007", name: "IMCD N.V." },
  { isin: "NL0000360618", name: "SBM Offshore" },
  { isin: "NL0000852564", name: "Aalberts NV" },
  { isin: "BE0974349814", name: "Warehouses De Pauw (WDP)" },
  { isin: "JE00BRX98089", name: "CVC Capital Partners plc" },
  { isin: "LU2290522684", name: "InPost S.A." },
];

const AMX_CONSTITUENTS: DutchIndexConstituent[] = [
  { isin: "NL0000337319", name: "BAM Groep Koninklijke" },
  { isin: "GB00BNTJ3546", name: "Allfunds Group" },
  { isin: "BMG455841020", name: "HAL Trust" },
  { isin: "NL0009269109", name: "Heijmans Koninklijke (certificates)" },
  { isin: "NL0000379121", name: "Randstad NV" },
  { isin: "NL0009432491", name: "Koninklijke Vopak" },
  { isin: "NL0006237562", name: "Arcadis NV" },
  { isin: "FR001400J770", name: "Air France-KLM" },
  { isin: "NL00150006R6", name: "CTP N.V." },
  { isin: "NL0015073TS8", name: "CSG N.V. (Czechoslovak Group)" },
  { isin: "LU0569974404", name: "Aperam S.A." },
  { isin: "NL0011821392", name: "Signify NV" },
  { isin: "NL0000302636", name: "Van Lanschot Kempen NV" },
  { isin: "BE0003874915", name: "Fagron NV" },
  { isin: "NL0011872650", name: "Basic-Fit N.V." },
  { isin: "NL0000852523", name: "TKH Group" },
  { isin: "NL0015000K93", name: "Eurocommercial Properties" },
  { isin: "NL0000888691", name: "AMG Critical Materials NV" },
  { isin: "BE0003818359", name: "Lakefront Biotherapeutics NV" }, // lower confidence, see header
  { isin: "BMG3602E1084", name: "Flow Traders" },
  { isin: "NL0010583399", name: "Corbion NV" },
  { isin: "NL00150003E1", name: "Fugro (class C)" },
  { isin: "NL0010391025", name: "Pharming Group" },
  { isin: "NL0015002K83", name: "Havas NV" },
  { isin: "CY0200751713", name: "Theon International Plc" },
];

const ASCX_CONSTITUENTS: DutchIndexConstituent[] = [
  { isin: "NL0000289213", name: "Wereldhave NV" },
  { isin: "NL0000313286", name: "Acomo" },
  { isin: "NL0010407946", name: "Triodos Bank (depository receipts)" },
  { isin: "NL0012817175", name: "Alfen N.V." },
  { isin: "NL0010558797", name: "OCI N.V." },
  { isin: "NL0009739416", name: "PostNL N.V." },
  { isin: "NL0013332471", name: "TomTom NV" },
  { isin: "NL0000371243", name: "Nedap N.V." },
  { isin: "NL0011832811", name: "ForFarmers N.V." },
  { isin: "NL0000852531", name: "Kendrion N.V." },
  { isin: "NL0000288918", name: "Vastned Retail N.V." }, // ticker VASTB per Euronext, VASTN elsewhere — see header
  { isin: "NL0012365084", name: "NSI N.V." },
  { isin: "NL0000817179", name: "Sligro Food Group" },
  { isin: "GB00BN0VZ646", name: "Ferrari Group plc" }, // UK staffing/real-estate firm, not the Italian carmaker
  { isin: "NL0015002IE0", name: "Avantium N.V." },
  { isin: "NL0013654809", name: "Fastned N.V." },
  { isin: "GB00BQQFX454", name: "Accsys Technologies plc" },
  { isin: "NL0012747059", name: "CM.com N.V." },
  { isin: "NL0010776944", name: "Brunel International N.V." },
  { isin: "NL0011660485", name: "Sif Holding N.V." },
];

const DUTCH_INDEX_CONSTITUENTS = [...AEX_CONSTITUENTS, ...AMX_CONSTITUENTS, ...ASCX_CONSTITUENTS];

export const DUTCH_INDEX_ISINS = new Set(DUTCH_INDEX_CONSTITUENTS.map((c) => c.isin));

/** Plain-name fallback for matching against AFM's issuerName field — see header. */
export const DUTCH_INDEX_NAMES = new Set(DUTCH_INDEX_CONSTITUENTS.map((c) => c.name));
