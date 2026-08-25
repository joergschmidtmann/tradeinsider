/**
 * ISINs of current DAX, MDAX, and SDAX constituents, captured 2026-08-25
 * from boerse.de. Used to scope German ingestion to "listed in a major
 * German index", since a plain `isin.startsWith("DE")` check incorrectly
 * excludes real constituents that happen to be domiciled abroad (e.g.
 * Airbus and Qiagen in the DAX have Dutch ISINs).
 *
 * Index composition is reviewed roughly quarterly — refresh this list
 * periodically (e.g. against boerse.de's DAX/MDAX/SDAX pages) so it
 * doesn't silently drift out of date.
 */
const DAX_ISINS = [
  "DE000A1EWWW0", // adidas
  "NL0000235190", // Airbus
  "DE0008404005", // Allianz
  "DE000BASF111", // BASF
  "DE000BAY0017", // Bayer
  "DE0005200000", // Beiersdorf
  "DE0005190003", // BMW
  "DE000A1DAHH0", // Brenntag
  "DE000CBK1001", // Commerzbank
  "DE0005439004", // Continental
  "DE000DTR0CK8", // Daimler Truck
  "DE0005140008", // Deutsche Bank
  "DE0005810055", // Deutsche Boerse
  "DE0005557508", // Deutsche Telekom
  "DE0005552004", // DHL Group
  "DE000ENAG999", // E.ON
  "DE0005785802", // Fresenius Medical Care
  "DE000FRE5EN2", // Fresenius SE
  "DE0006602006", // GEA Group
  "DE0008402215", // Hannover Rueck
  "DE0006047004", // Heidelberg Materials
  "DE0006048432", // Henkel
  "DE0006070006", // Hochtief
  "DE0006231004", // Infineon
  "DE0007100000", // Mercedes-Benz Group
  "DE0006599905", // Merck KGaA
  "DE000A0D9PT0", // MTU Aero Engines
  "DE0008430026", // Muenchener Rueck
  "NL0015002SN0", // Qiagen
  "DE0007030009", // Rheinmetall
  "DE0007037129", // RWE
  "DE0007164600", // SAP
  "DE000A12DM80", // Scout24
  "DE0007236101", // Siemens
  "DE000ENER6Y0", // Siemens Energy
  "DE000SHL1006", // Siemens Healthineers
  "DE000SYM9999", // Symrise
  "DE0007664039", // Volkswagen
  "DE000A1ML7J1", // Vonovia
  "DE000ZAL1111", // Zalando
];

const MDAX_ISINS = [
  "DE000A0WMPJ6", // Aixtron
  "LU1673108939", // Aroundtown
  "DE000AUM0V10", // AUMOVIO
  "DE0006766504", // Aurubis
  "DE000A2LQ884", // AUTO1
  "DE0005158703", // Bechtle
  "DE0005909006", // Bilfinger
  "DE0005470306", // CTS Eventim
  "DE000A2E4K43", // Delivery Hero
  "DE0006305006", // Deutz
  "DE000DWS1007", // DWS Group
  "DE0005677108", // Elmos Semiconductor
  "DE000EVNK013", // Evonik Industries
  "DE000FTG1111", // Flatexdegiro
  "DE0005773303", // Fraport
  "DE000A0Z2ZZ5", // Freenet
  "DE000A3E5D64", // Fuchs SE Vz
  "DE000A13SX22", // Hella
  "DE000HAG0005", // Hensoldt
  "DE000A1PHFF7", // Hugo Boss
  "DE000A3E00M1", // Ionos
  "DE000A2NB601", // Jenoptik
  "DE000KSAG888", // K+S
  "DE000KGX8881", // Kion Group
  "DE000KBX1006", // Knorr-Bremse
  "DE0006335003", // Krones
  "DE0005470405", // Lanxess
  "DE000LEG1110", // LEG Immobilien
  "DE0008232125", // Lufthansa
  "DE0006452907", // Nemetschek
  "DE000A0D6554", // Nordex
  "DE000PAG9113", // Porsche AG Vz.
  "DE000PAH0038", // Porsche Automobil Holding
  "DE0006969603", // Puma
  "DE0007010803", // Rational
  "DE000RENK730", // RENK Group
  "LU0061462528", // RTL
  "DE0006202005", // Salzgitter
  "DE0007165631", // Sartorius Vz
  "DE000SHA0100", // Schaeffler
  "DE000WAF3001", // Siltronic
  "DE000A1K0235", // Suess MicroTec
  "DE0008303504", // TAG Immobilien
  "DE000TLX1005", // Talanx
  "DE0007500001", // ThyssenKrupp
  "DE000TKMS001", // TKMS
  "DE000TRAT0N7", // Traton
  "DE000TUAG505", // TUI
  "DE0005089031", // United Internet
  "DE000WCH8881", // Wacker Chemie
];

const SDAX_ISINS = [
  "DE0005545503", // 1&1 Drillisch
  "DE0005103006", // ADVA Optical Networking
  "DE000A2YNT30", // Alzchem
  "AT100ASTA001", // Asta Energy Solutions
  "DE0005104400", // Atoss Software
  "DE0005102008", // Basler
  "LU1704650164", // Befesa
  "DE0005419105", // Cancom
  "DE0005313704", // Carl Zeiss Meditec
  "DE0005403901", // Cewe Stiftung
  "DE000A2GS5D8", // Dermapharm Holding
  "DE000A1TNUT7", // Deutsche Beteiligungs
  "DE0007480204", // Deutsche EuroShop
  "DE0008019001", // Deutsche Pfandbriefbank
  "DE000BEAU1Y4", // Douglas AG
  "DE0005550636", // Draegerwerk Vz
  "DE0005565204", // Duerr
  "DE0005659700", // Eckert&Ziegler
  "DE000A40ESU3", // Einhell Germany
  "DE0005313506", // Energiekontor
  "DE0005664809", // Evotec
  "DE0005772206", // Fielmann
  "DE000A255F11", // Friedrich Vorwerk Group
  "DE0005800601", // GFT Technologies
  "LU0775917882", // Grand City Properties
  "DE000A161N30", // Grenke
  "DE000A3H2333", // Hamborner REIT
  "DE0007314007", // Heidelberger Druckmaschinen
  "DE000A161408", // HelloFresh
  "DE0006083405", // Hornbach Holding
  "DE0005493365", // Hypoport
  "DE0006200108", // Indus Holding
  "DE0005759807", // init innovation
  "DE000JST4000", // JOST Werke
  "DE0006219934", // Jungheinrich Vz
  "AT0000A0E9W5", // Kontron
  "DE0006292030", // KSB Vz
  "DE0007074007", // KWS Saat
  "DE0006450000", // LPKF Laser
  "DE000A0ETBQ4", // MBB
  "DE000A1MMCC8", // Medios
  "DE0006569908", // MLP
  "DE000A2NB650", // mutares
  "DE000A3H2200", // Nagarro
  "DE000A1H8BV3", // Norma Group
  "DE0005936124", // OHB
  "DE000BCK2223", // Ottobock
  "DE000PAT1AG3", // Patrizia SE
  "DE000A0JBPG2", // PNE Wind
  "DE0007461006", // PVA TePla
  "NL0012044747", // Redcare Pharmacy
  "DE000SAFH001", // SAF Holland
  "DE000A3ENQ51", // Schott Pharma
  "DE0007276503", // Secunet Security Networks
  "DE0007568578", // SFC Energy
  "BG1100003166", // Shelly Group
  "DE0007231326", // Sixt St
  "DE000A0DJ6J9", // SMA Solar
  "DE000SPG1003", // Springer Nature
  "DE000STAB1L8", // Stabilus
  "DE0007274136", // Sto Vz
  "DE0007493991", // Stroeer
  "DE0007297004", // Suedzucker
  "DE000A2YN900", // TeamViewer
  "LU2333563281", // Tonies
  "DE000A0JL9W6", // Verbio Vereinigte Bioenergie
  "DE000VNC0014", // Vincorion SE
  "DE0007667107", // Vossloh
  "DE000WACK012", // Wacker Neuson
  "DE0008051004", // Wuestenrot & Wuerttembergische
];

export const GERMAN_INDEX_ISINS = new Set([...DAX_ISINS, ...MDAX_ISINS, ...SDAX_ISINS]);
