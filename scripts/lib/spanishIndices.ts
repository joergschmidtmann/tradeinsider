/**
 * ISINs (and company names) of current IBEX 35, IBEX Medium Cap, and IBEX
 * Small Cap constituents, captured 2026-09-08 directly from BME's (Bolsas
 * y Mercados Españoles) own live "Prices & Markets → Shares" pages, one per
 * tier (bolsasymercados.es/en/bme-exchange/prices-and-markets/shares/
 * ibex-35-..., ibex-medium-cap-..., ibex-small-cap-...) — each row's
 * detail-page link embeds the ISIN directly (e.g.
 * detail.banco-santander-es0113900j37.html). Cross-checked the IBEX 35
 * subset against BME's own official factsheet PDF and against boerse.de/
 * Wikipedia (all agreed except one stale Wikipedia ISIN for Aena, corrected
 * here to the BME-confirmed ES0105046017). bolsasymercados.es's robots.txt
 * does not disallow these pages.
 *
 * Used to scope CNMV ingestion (scripts/ingest-es.ts) to "listed in a major
 * Spanish index", the same role GERMAN_INDEX_ISINS/AUSTRIAN_INDEX_ISINS play
 * for DE/AT — CNMV ingestion currently has no index-membership filter and
 * pulls in a lot of micro-cap noise as a result (this is what the IBEX
 * Small Cap tier is for — mirroring SDAX's role, not to be skipped).
 *
 * IMPORTANT: scripts/ingest-es.ts stores `lei ?? tx.isin` in issuer_cik, and
 * CNMV's filings virtually always carry a LEI, so issuer_cik in this
 * project's actual data is a 20-character LEI, not an ISIN, for nearly
 * every Spanish row (verified live against the DB, 2026-09-09) —
 * SPANISH_INDEX_ISINS alone will therefore match almost nothing against
 * real data. SPANISH_INDEX_NAMES is the name-based fallback that will
 * actually work; same caveat as DUTCH_INDEX_NAMES/SWEDISH_INDEX_NAMES about
 * needing fuzzy/normalized matching against CNMV's own issuer-name spelling
 * (e.g. all-caps "IBERDROLA, S.A." there vs. "Iberdrola" here), not a plain
 * Set lookup.
 *
 * A handful of constituents carry a non-Spanish ISIN despite trading on the
 * Spanish Continuous Market and being IBEX constituents — same
 * domiciled-abroad situation as Airbus/Qiagen in the German lists:
 * ArcelorMittal and eDreams ODIGEO (Luxembourg), Ferrovial SE (Netherlands),
 * HBX Group (UK), Berkeley Energia (Australia).
 *
 * The IBEX indices are reviewed quarterly (2nd week of March/June/Sept/Dec,
 * effective the following 3rd Friday) — refresh this list periodically
 * against the same BME pages so it doesn't silently drift out of date.
 */
export interface SpanishIndexConstituent {
  isin: string;
  name: string;
}

const IBEX_35_CONSTITUENTS: SpanishIndexConstituent[] = [
  { isin: "ES0125220311", name: "Acciona" },
  { isin: "ES0105563003", name: "Acciona Energía" },
  { isin: "ES0132105018", name: "Acerinox" },
  { isin: "ES0167050915", name: "ACS (Actividades de Construcción y Servicios)" },
  { isin: "ES0105046017", name: "Aena" },
  { isin: "ES0109067019", name: "Amadeus IT Group" },
  { isin: "LU1598757687", name: "ArcelorMittal" },
  { isin: "ES0113900J37", name: "Banco Santander" },
  { isin: "ES0113860A34", name: "Banco de Sabadell" },
  { isin: "ES0113679I37", name: "Bankinter" },
  { isin: "ES0113211835", name: "BBVA (Banco Bilbao Vizcaya Argentaria)" },
  { isin: "ES0140609019", name: "CaixaBank" },
  { isin: "ES0105066007", name: "Cellnex Telecom" },
  { isin: "ES0139140174", name: "Colonial (Inmobiliaria Colonial SOCIMI)" },
  { isin: "ES0130960018", name: "Enagás" },
  { isin: "ES0130670112", name: "Endesa" },
  { isin: "NL0015001FS8", name: "Ferrovial SE" },
  { isin: "ES0137650018", name: "Fluidra" },
  { isin: "ES0171996087", name: "Grifols (Class A)" },
  { isin: "ES0177542018", name: "International Consolidated Airlines Group (IAG)" },
  { isin: "ES0144580Y14", name: "Iberdrola" },
  { isin: "ES0148396007", name: "Inditex (Industria de Diseño Textil)" },
  { isin: "ES0118594417", name: "Indra Sistemas (Serie A)" },
  { isin: "ES0105027009", name: "Logista" },
  { isin: "ES0124244E34", name: "Mapfre" },
  { isin: "ES0105025003", name: "Merlin Properties" },
  { isin: "ES0116870314", name: "Naturgy Energy Group" },
  { isin: "ES0105777017", name: "Puig Brands" },
  { isin: "ES0173093024", name: "Redeia Corporación" },
  { isin: "ES0173516115", name: "Repsol" },
  { isin: "ES0157261019", name: "Laboratorios Rovi" },
  { isin: "ES0182870214", name: "Sacyr" },
  { isin: "ES0165386014", name: "Solaria Energía y Medio Ambiente" },
  { isin: "ES0178430E18", name: "Telefónica" },
  { isin: "ES0180907000", name: "Unicaja Banco" },
];

const IBEX_MEDIUM_CAP_CONSTITUENTS: SpanishIndexConstituent[] = [
  { isin: "ES0157097017", name: "Almirall" },
  { isin: "ES0109260291", name: "Amper" },
  { isin: "ES0109427734", name: "Atresmedia (Corp. de Medios de Comunicación)" },
  { isin: "ES0121975009", name: "CAF (Construcciones y Auxiliar de Ferrocarriles)" },
  { isin: "ES0105630315", name: "CIE Automotive" },
  { isin: "ES0105884011", name: "Cirsa" },
  { isin: "ES0126775008", name: "DIA (Distribuidora Internacional de Alimentación)" },
  { isin: "ES0112501012", name: "Ebro Foods" },
  { isin: "ES0129743318", name: "Elecnor" },
  { isin: "ES0134950F36", name: "Faes Farma" },
  { isin: "ES0105079000", name: "Grenergy Renovables" },
  { isin: "GB00BNXJB679", name: "HBX Group" },
  { isin: "ES0105546008", name: "Línea Directa Aseguradora" },
  { isin: "ES0176252718", name: "Meliá Hotels International" },
  { isin: "ES0105251005", name: "Neinor Homes" },
  { isin: "ES0142090317", name: "OHLA (Obrascón Huarte Lain)" },
  { isin: "ES0169501022", name: "PharmaMar" },
  { isin: "ES0178165017", name: "Técnicas Reunidas" },
  { isin: "ES0183746314", name: "Vidrala" },
  { isin: "ES0184262212", name: "Viscofan" },
];

const IBEX_SMALL_CAP_CONSTITUENTS: SpanishIndexConstituent[] = [
  { isin: "ES0152768612", name: "Airtificial Intelligence Structures" },
  { isin: "ES0126501131", name: "Alantra Partners" },
  { isin: "ES0105375002", name: "AmRest Holdings" },
  { isin: "ES0105148003", name: "Atrys Health" },
  { isin: "ES0136463017", name: "Audax Renovables" },
  { isin: "ES0112458312", name: "Azkoyen" },
  { isin: "ES0119037010", name: "Clínica Baviera" },
  { isin: "AU000000BKY0", name: "Berkeley Energia Limited" },
  { isin: "ES0105229001", name: "Prosegur Cash" },
  { isin: "ES0110047919", name: "Deoleo" },
  { isin: "ES0105130001", name: "Global Dominion Access" },
  { isin: "ES0105548004", name: "Ecoener" },
  { isin: "LU1048328220", name: "eDreams ODIGEO" },
  { isin: "ES0130625512", name: "Ence Energía y Celulosa" },
  { isin: "ES0172708234", name: "Grupo Ezentis" },
  { isin: "ES0105223004", name: "Gestamp Automoción" },
  { isin: "ES0105449005", name: "Izertis" },
  { isin: "ES0158480311", name: "Lingotes Especiales" },
  { isin: "ES0105043006", name: "Naturhouse Health" },
  { isin: "ES0126962069", name: "Nueva Expresión Textil (Nextil)" },
  { isin: "ES0166300212", name: "Nicolás Correa" },
  { isin: "ES0167733015", name: "Oryzon Genomics" },
  { isin: "ES0170884417", name: "Prim" },
  { isin: "ES0175438003", name: "Prosegur Compañía de Seguridad" },
  { isin: "ES0165359029", name: "Reig Jofre" },
  { isin: "ES0180918015", name: "Grupo Empresarial San José" },
  { isin: "ES0105065009", name: "Talgo" },
  { isin: "ES0105394003", name: "TSK Electrónica y Electricidad" },
  { isin: "ES0132945017", name: "Tubacex" },
  { isin: "ES0114820113", name: "Vocento" },
];

const SPANISH_INDEX_CONSTITUENTS = [...IBEX_35_CONSTITUENTS, ...IBEX_MEDIUM_CAP_CONSTITUENTS, ...IBEX_SMALL_CAP_CONSTITUENTS];

export const SPANISH_INDEX_ISINS = new Set(SPANISH_INDEX_CONSTITUENTS.map((c) => c.isin));

/** Name-based fallback — see header. This is the one that actually matches this project's ES data (LEI, not ISIN, in issuer_cik). */
export const SPANISH_INDEX_NAMES = new Set(SPANISH_INDEX_CONSTITUENTS.map((c) => c.name));
