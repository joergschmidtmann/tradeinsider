/**
 * ISINs of current WBI (Wiener Börse Index) constituents, captured
 * 2026-08-26 from wienerborse.at's official index composition page. WBI is
 * the broad all-share index for the Vienna Stock Exchange (57 securities),
 * chosen over the narrower 20-stock ATX for the same reason DAX alone isn't
 * used for Germany — better breadth. As with the German lists, a plain
 * `isin.startsWith("AT")` check would incorrectly exclude a real constituent
 * domiciled abroad (RHI Magnesita has a Dutch ISIN).
 *
 * Index composition is reviewed periodically — refresh this list against
 * wienerborse.at's WBI composition page so it doesn't silently drift out of
 * date.
 */
export const AUSTRIAN_INDEX_ISINS = new Set([
  "AT0000652011", // Erste Group Bank
  "AT0000743059", // OMV
  "AT0000606306", // Raiffeisen Bank International
  "AT0000BAWAG2", // BAWAG Group
  "AT000000STR1", // Strabag
  "AT0000746409", // Verbund
  "AT0000908504", // Vienna Insurance Group
  "AT0000730007", // Andritz
  "AT0000937503", // Voestalpine
  "AT0000720008", // Telekom Austria
  "AT0000625108", // Oberbank
  "AT0000821103", // Uniqa Insurance Group
  "AT0000969985", // AT&S Austria Technologie & Systemtechnik
  "AT0000741053", // EVN
  "AT00000VIE62", // Flughafen Wien
  "AT0000625504", // BTV Vier Länder Bank
  "AT0000818802", // Do & Co
  "AT0000641352", // CA Immobilien Anlagen
  "AT0000A21KS2", // CPI Europe
  "AT0000831706", // Wienerberger
  "AT0000APOST4", // Oesterreichische Post
  "NL0012650360", // RHI Magnesita
  "AT0000938204", // Mayr-Melnhof Karton
  "AT0000609607", // Porr
  "AT0000KTMI02", // Bajaj Mobility (formerly KTM Industries)
  "AT0000A3UZE1", // Emerald Horizon
  "AT0000758305", // Palfinger
  "AT00000AMAG3", // AMAG Austria Metall
  "AT0000624705", // BKS Bank
  "ATFREQUENT09", // Frequentis
  "AT0000644505", // Lenzing
  "AT000000ETS9", // Eurotelesites
  "AT00000FACC2", // FACC
  "AT000AGRANA3", // Agrana Beteiligungs
  "AT0000922554", // Rosenbauer International
  "AT000ADDIKO0", // Addiko Bank
  "AT0000946652", // SBO
  "AT0000A325L0", // AustriaCard Holdings
  "AT0000785555", // Semperit
  "AT0000640552", // Burgenland Holding
  "AT0000728209", // Josef Manner & Comp.
  "AT0000837307", // Zumtobel Group
  "AT0000762406", // Frauenthal Holding
  "AT0000815402", // UBM Development
  "AT0000A00XX9", // Polytec Holding
  "AT0000741301", // Wiener Privatbank
  "AT000KAPSCH9", // Kapsch TrafficCom
  "AT0000723606", // Linz Textil Holding
  "AT0000767306", // Rath
  "AT0000834007", // Wolford
  "AT0000797303", // Stadlauer Malzfabrik
  "AT0000808209", // SW Umwelttechnik
  "AT0000827209", // Warimpex Finanz- und Beteiligungs
  "AT0000A0Z9G3", // Gurktaler St
  "AT0000A0Z9H1", // Gurktaler Vz
  "ATMARINOMED6", // Marinomed Biotech
  "AT0000690151", // Maschinenfabrik Heid
]);
