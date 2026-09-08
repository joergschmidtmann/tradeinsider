/**
 * ISINs of current BEL 20, BEL Mid, and BEL Small constituents (Euronext
 * Brussels), captured 2026-09-08. Used to scope FSMA ingestion
 * (scripts/ingest-be.ts) to "listed in a major Belgian index", the same
 * role GERMAN_INDEX_ISINS/AUSTRIAN_INDEX_ISINS play for DE/AT.
 *
 * Sourcing: live.euronext.com's robots.txt disallows ClaudeBot from the
 * `/product/` path that hosts the live composition pages, so this was built
 * from Euronext's own downloadable index-factsheet PDFs (allowed path)
 * plus their official March-2026 index-review press release, cross-checked
 * against Wikipedia and third-party aggregators (investing.com,
 * MarketScreener) with individual per-company ISIN verification.
 *
 * Confidence varies by tier:
 * - BEL_20: high confidence, all 20 verified against the official
 *   factsheet + the March 2026 review press release + Wikipedia (all agree).
 * - BEL_MID / BEL_SMALL: the top 10 of each (by index weight) are from
 *   Euronext's own factsheet and are reliable; the remaining constituents
 *   are best-effort from aggregators, since Euronext's full composition
 *   file wasn't reachable. Every aggregator checked showed some staleness
 *   vs. the March 2026 review (e.g. still listing Aperam/Ontex/Vastned in
 *   BEL Mid, or Exmar in BEL Small, after they'd moved/been removed) —
 *   pruned where disprovable, but treat the non-top-10 names as a strong
 *   best-effort, not a guaranteed-complete list. Refresh against Euronext's
 *   own factsheets periodically (quarterly reviews: mid-March/June/Sept/Dec).
 *
 * Cross-border ISINs (correct, not errors, same pattern as Airbus in the
 * German lists): argenx SE and Onward Medical (Netherlands), Aperam and
 * Brederode (Luxembourg).
 *
 * Explicitly excluded after verification: Exmar (removed from BEL Small,
 * March 2026 review; some aggregators still list it), Greenyard (delisted
 * via squeeze-out ~Sept 2025), Smartphoto Group (membership unconfirmed).
 * Two mid-2026 renames, same ISIN: Galapagos NV -> Lakefront
 * Biotherapeutics NV; Unifiedpost Group SA -> Banqup Group SA.
 */
const BEL_20_ISINS = [
  "BE0974293251", // AB InBev
  "BE0003764785", // Ackermans & van Haaren
  "BE0003851681", // Aedifica
  "BE0974264930", // Ageas
  "NL0010832176", // argenx SE
  "LU0569974404", // Aperam
  "BE0974400328", // Azelis Group
  "BE0974259880", // D'Ieteren Group
  "BE0003822393", // Elia Group
  "BE0003797140", // GBL (Groupe Bruxelles Lambert)
  "BE0003565737", // KBC Group
  "BE0003604155", // Lotus Bakeries
  "BE0165385973", // Melexis
  "BE0003853703", // Montea
  "BE0003717312", // Sofina
  "BE0003470755", // Solvay
  "BE0974464977", // Syensqo
  "BE0003739530", // UCB
  "BE0974320526", // Umicore
  "BE0974349814", // WDP (Warehouses De Pauw)
];

const BEL_MID_ISINS = [
  // Official top 10 (by weight)
  "BE0003874915", // Fagron
  "BE0974258874", // Bekaert
  "LU1068091351", // Brederode
  "BE0974413453", // DEME Group
  "BE0003878957", // VGP
  "BE0974256852", // Colruyt Group
  "BE0003699130", // GIMV
  "BE0003810273", // Proximus
  "BE0974288202", // Xior Student Housing
  "BE0003818359", // Lakefront Biotherapeutics (formerly Galapagos NV)
  // Best-effort, see header confidence note
  "BE0003816338", // CMB.TECH
  "LU1883301340", // Shurgard Self Storage
  "BE0974274061", // Kinepolis Group
  "BE0003555639", // Tessenderlo Group
  "BE0003720340", // Retail Estates
  "BE0003656676", // Recticel
  "BE0974362940", // Barco
  "BE0974282148", // TINC
  "BE0974273055", // Care Property Invest
  "BE0003766806", // Ion Beam Applications (IBA)
  "BE0003820371", // EVS Broadcast Equipment
  "BE0003856730", // Ascencio
  "BE0003898187", // Sipef
  "BE0003755692", // AGFA-Gevaert
  "BE0003735496", // Orange Belgium
  "BE0974313455", // Econocom Group
];

const BEL_SMALL_ISINS = [
  // Official top 10 (by weight)
  "BE0003592038", // Compagnie du Bois Sauvage
  "BE0003754687", // Vastned
  "BE0974276082", // Ontex Group
  "BE0003724383", // Wereldhave Belgium
  "BE0974409410", // Home Invest Belgium
  "BE0003858751", // Jensen-Group
  "BE0974268972", // bpost
  "BE0003789063", // Deceuninck
  "BE0974265945", // Fluxys Belgium
  "NL0015000HT4", // Onward Medical
  // Best-effort, see header confidence note
  "BE0003837540", // Atenor
  "BE0003008019", // National Bank of Belgium
  "BE0003883031", // CFE (Compagnie d'Entreprises CFE)
  "BE0003599108", // Immobel
  "BE0003770840", // Nextensa
  "BE0003839561", // Van de Velde
  "BE0974272040", // QRF
  "BE0974340722", // Sequana Medical
  "BE0974358906", // Nyxoah
  "BE0974380124", // Ekopak
  "BE0974386188", // Biotalys
  "BE0003825420", // Campine
  "BE0974371032", // Banqup Group (formerly Unifiedpost Group)
  "BE0003573814", // What's Cooking Group (formerly Ter Beke)
];

export const BELGIAN_INDEX_ISINS = new Set([...BEL_20_ISINS, ...BEL_MID_ISINS, ...BEL_SMALL_ISINS]);
