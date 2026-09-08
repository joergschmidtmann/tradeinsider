/**
 * ISINs of current IBEX 35, IBEX Medium Cap, and IBEX Small Cap
 * constituents, captured 2026-09-08 directly from BME's (Bolsas y Mercados
 * Españoles) own live "Prices & Markets → Shares" pages, one per tier
 * (bolsasymercados.es/en/bme-exchange/prices-and-markets/shares/ibex-35-...,
 * ibex-medium-cap-..., ibex-small-cap-...) — each row's detail-page link
 * embeds the ISIN directly (e.g. detail.banco-santander-es0113900j37.html).
 * Cross-checked the IBEX 35 subset against BME's own official factsheet PDF
 * and against boerse.de/Wikipedia (all agreed except one stale Wikipedia
 * ISIN for Aena, corrected here to the BME-confirmed ES0105046017).
 * bolsasymercados.es's robots.txt does not disallow these pages.
 *
 * Used to scope CNMV ingestion (scripts/ingest-es.ts) to "listed in a major
 * Spanish index", the same role GERMAN_INDEX_ISINS/AUSTRIAN_INDEX_ISINS play
 * for DE/AT — CNMV ingestion currently has no index-membership filter and
 * pulls in a lot of micro-cap noise as a result (this is what the IBEX
 * Small Cap tier is for — mirroring SDAX's role, not to be skipped).
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
const IBEX_35_ISINS = [
  "ES0125220311", // Acciona
  "ES0105563003", // Acciona Energía
  "ES0132105018", // Acerinox
  "ES0167050915", // ACS (Actividades de Construcción y Servicios)
  "ES0105046017", // Aena
  "ES0109067019", // Amadeus IT Group
  "LU1598757687", // ArcelorMittal
  "ES0113900J37", // Banco Santander
  "ES0113860A34", // Banco de Sabadell
  "ES0113679I37", // Bankinter
  "ES0113211835", // BBVA (Banco Bilbao Vizcaya Argentaria)
  "ES0140609019", // CaixaBank
  "ES0105066007", // Cellnex Telecom
  "ES0139140174", // Colonial (Inmobiliaria Colonial SOCIMI)
  "ES0130960018", // Enagás
  "ES0130670112", // Endesa
  "NL0015001FS8", // Ferrovial SE
  "ES0137650018", // Fluidra
  "ES0171996087", // Grifols (Class A)
  "ES0177542018", // International Consolidated Airlines Group (IAG)
  "ES0144580Y14", // Iberdrola
  "ES0148396007", // Inditex (Industria de Diseño Textil)
  "ES0118594417", // Indra Sistemas (Serie A)
  "ES0105027009", // Logista
  "ES0124244E34", // Mapfre
  "ES0105025003", // Merlin Properties
  "ES0116870314", // Naturgy Energy Group
  "ES0105777017", // Puig Brands
  "ES0173093024", // Redeia Corporación
  "ES0173516115", // Repsol
  "ES0157261019", // Laboratorios Rovi
  "ES0182870214", // Sacyr
  "ES0165386014", // Solaria Energía y Medio Ambiente
  "ES0178430E18", // Telefónica
  "ES0180907000", // Unicaja Banco
];

const IBEX_MEDIUM_CAP_ISINS = [
  "ES0157097017", // Almirall
  "ES0109260291", // Amper
  "ES0109427734", // Atresmedia (Corp. de Medios de Comunicación)
  "ES0121975009", // CAF (Construcciones y Auxiliar de Ferrocarriles)
  "ES0105630315", // CIE Automotive
  "ES0105884011", // Cirsa
  "ES0126775008", // DIA (Distribuidora Internacional de Alimentación)
  "ES0112501012", // Ebro Foods
  "ES0129743318", // Elecnor
  "ES0134950F36", // Faes Farma
  "ES0105079000", // Grenergy Renovables
  "GB00BNXJB679", // HBX Group
  "ES0105546008", // Línea Directa Aseguradora
  "ES0176252718", // Meliá Hotels International
  "ES0105251005", // Neinor Homes
  "ES0142090317", // OHLA (Obrascón Huarte Lain)
  "ES0169501022", // PharmaMar
  "ES0178165017", // Técnicas Reunidas
  "ES0183746314", // Vidrala
  "ES0184262212", // Viscofan
];

const IBEX_SMALL_CAP_ISINS = [
  "ES0152768612", // Airtificial Intelligence Structures
  "ES0126501131", // Alantra Partners
  "ES0105375002", // AmRest Holdings
  "ES0105148003", // Atrys Health
  "ES0136463017", // Audax Renovables
  "ES0112458312", // Azkoyen
  "ES0119037010", // Clínica Baviera
  "AU000000BKY0", // Berkeley Energia Limited
  "ES0105229001", // Prosegur Cash
  "ES0110047919", // Deoleo
  "ES0105130001", // Global Dominion Access
  "ES0105548004", // Ecoener
  "LU1048328220", // eDreams ODIGEO
  "ES0130625512", // Ence Energía y Celulosa
  "ES0172708234", // Grupo Ezentis
  "ES0105223004", // Gestamp Automoción
  "ES0105449005", // Izertis
  "ES0158480311", // Lingotes Especiales
  "ES0105043006", // Naturhouse Health
  "ES0126962069", // Nueva Expresión Textil (Nextil)
  "ES0166300212", // Nicolás Correa
  "ES0167733015", // Oryzon Genomics
  "ES0170884417", // Prim
  "ES0175438003", // Prosegur Compañía de Seguridad
  "ES0165359029", // Reig Jofre
  "ES0180918015", // Grupo Empresarial San José
  "ES0105065009", // Talgo
  "ES0105394003", // TSK Electrónica y Electricidad
  "ES0132945017", // Tubacex
  "ES0114820113", // Vocento
];

export const SPANISH_INDEX_ISINS = new Set([...IBEX_35_ISINS, ...IBEX_MEDIUM_CAP_ISINS, ...IBEX_SMALL_CAP_ISINS]);
