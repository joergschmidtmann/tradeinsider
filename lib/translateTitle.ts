import type { Locale } from "@/i18n/routing";

// Best-effort translation for the `owner_title` freetext that comes straight
// from each country's source filing (English from the US/Belgium, Swedish
// from Sweden, Spanish from Spain). Germany/Austria already report
// "Vorstand"/"Aufsichtsrat" and simply pass through unchanged below, since
// they're not in this dictionary.
//
// Matching is by exact phrase (case-insensitive), not substring — freetext
// titles vary too much across sources for partial matching to be safe. A
// title made of several comma-separated roles (seen in Swedish data, e.g.
// "Verkställande direktör (VD), Styrelseledamot") is split, each part is
// looked up individually, then rejoined. Anything not in the dictionary is
// left in its original language rather than guessed at.
const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  de: {
    // US — SEC Form 4 officer titles
    "chief executive officer": "Vorstandsvorsitzender (CEO)",
    "co-chief executive officer": "Co-Vorstandsvorsitzender (Co-CEO)",
    "president & ceo": "Präsident & CEO",
    "president and ceo": "Präsident und CEO",
    "chief financial officer": "Finanzvorstand (CFO)",
    "chief operating officer": "Chief Operating Officer (COO)",
    president: "Präsident",
    chairman: "Vorsitzender",
    director: "Direktor",
    "executive vice president": "Executive Vice President (EVP)",
    "senior vice president": "Senior Vice President (SVP)",
    "vice president": "Vice President",
    secretary: "Schriftführer",
    treasurer: "Schatzmeister",
    "general counsel": "Chefjustiziar",
    "10% owner": "10 %-Eigentümer",

    // Sweden (Finansinspektionen)
    styrelseledamot: "Vorstandsmitglied",
    styrelseordförande: "Vorstandsvorsitzender",
    "verkställande direktör (vd)": "Geschäftsführer (CEO)",
    "vice vd": "Stellvertretender Geschäftsführer",
    "ekonomichef/finanschef/finansdirektör": "Finanzchef (CFO)",
    "annan ledande befattningshavare": "Sonstige leitende Führungskraft",
    "annan medlem i bolagets administrations-, lednings- eller kontrollorgan":
      "Sonstiges Mitglied des Verwaltungs-, Leitungs- oder Kontrollorgans",

    // Spain (CNMV) — standard MAR/PDMR terminology
    "persona con responsabilidad de dirección": "Person mit Führungsaufgaben",
    "persona estrechamente vinculada": "Eng verbundene Person",

    // Belgium (FSMA) — same MAR/PDMR terminology, reported in English
    "member of administrative management or supervisory body": "Mitglied des Verwaltungs-, Leitungs- oder Kontrollorgans",
    "person closely associated to a member of administrative management or supervisory body":
      "Eng verbundene Person eines Mitglieds des Verwaltungs-, Leitungs- oder Kontrollorgans",
  },
  en: {
    "chief executive officer": "Chief Executive Officer (CEO)",
    "co-chief executive officer": "Co-Chief Executive Officer (Co-CEO)",
    "president & ceo": "President & CEO",
    "president and ceo": "President and CEO",
    "chief financial officer": "Chief Financial Officer (CFO)",
    "chief operating officer": "Chief Operating Officer (COO)",
    president: "President",
    chairman: "Chairman",
    director: "Director",
    "executive vice president": "Executive Vice President (EVP)",
    "senior vice president": "Senior Vice President (SVP)",
    "vice president": "Vice President",
    secretary: "Secretary",
    treasurer: "Treasurer",
    "general counsel": "General Counsel",
    "10% owner": "10% Owner",

    styrelseledamot: "Board Member",
    styrelseordförande: "Chairman of the Board",
    "verkställande direktör (vd)": "Chief Executive Officer (CEO)",
    "vice vd": "Deputy CEO",
    "ekonomichef/finanschef/finansdirektör": "Chief Financial Officer (CFO)",
    "annan ledande befattningshavare": "Other Senior Executive",
    "annan medlem i bolagets administrations-, lednings- eller kontrollorgan":
      "Other Member of the Administrative, Management or Supervisory Body",

    "persona con responsabilidad de dirección": "Person Discharging Managerial Responsibilities",
    "persona estrechamente vinculada": "Closely Associated Person",

    "member of administrative management or supervisory body": "Member of Administrative, Management or Supervisory Body",
    "person closely associated to a member of administrative management or supervisory body":
      "Person Closely Associated to a Member of Administrative, Management or Supervisory Body",
  },
  es: {
    "chief executive officer": "Consejero Delegado (CEO)",
    "co-chief executive officer": "Co-Consejero Delegado (Co-CEO)",
    "president & ceo": "Presidente y CEO",
    "president and ceo": "Presidente y CEO",
    "chief financial officer": "Director Financiero (CFO)",
    "chief operating officer": "Director de Operaciones (COO)",
    president: "Presidente",
    chairman: "Presidente del Consejo",
    director: "Director",
    "executive vice president": "Vicepresidente Ejecutivo (EVP)",
    "senior vice president": "Vicepresidente Senior (SVP)",
    "vice president": "Vicepresidente",
    secretary: "Secretario",
    treasurer: "Tesorero",
    "general counsel": "Asesor Jurídico General",
    "10% owner": "Propietario del 10 %",

    styrelseledamot: "Miembro del Consejo",
    styrelseordförande: "Presidente del Consejo",
    "verkställande direktör (vd)": "Consejero Delegado (CEO)",
    "vice vd": "Consejero Delegado Adjunto",
    "ekonomichef/finanschef/finansdirektör": "Director Financiero (CFO)",
    "annan ledande befattningshavare": "Otro Alto Directivo",
    "annan medlem i bolagets administrations-, lednings- eller kontrollorgan":
      "Otro Miembro del Órgano de Administración, Gestión o Supervisión",

    "persona con responsabilidad de dirección": "Persona con Responsabilidad de Dirección",
    "persona estrechamente vinculada": "Persona Estrechamente Vinculada",

    "member of administrative management or supervisory body": "Miembro del Órgano de Administración, Gestión o Supervisión",
    "person closely associated to a member of administrative management or supervisory body":
      "Persona Estrechamente Vinculada a un Miembro del Órgano de Administración, Gestión o Supervisión",
  },
};

function translatePart(part: string, locale: Locale): string {
  // Some sources (seen in Swedish data) use non-breaking spaces between
  // words instead of regular ones — normalize before lookup so those still
  // match the dictionary, which is keyed with plain spaces.
  const trimmed = part.replace(/\s+/g, " ").trim();
  return TRANSLATIONS[locale][trimmed.toLowerCase()] ?? trimmed;
}

export function translateTitle(title: string | null, locale: Locale): string | null {
  if (!title) return title;
  // Try the whole string first — some dictionary entries (e.g. the Swedish
  // MAR-category label) contain a comma as ordinary punctuation, not as a
  // separator between combined roles, so splitting unconditionally would
  // break their exact match. Only split on comma as a fallback, for titles
  // like "Verkställande direktör (VD), Styrelseledamot" that really do
  // combine two distinct roles and aren't in the dictionary as one phrase.
  const whole = translatePart(title, locale);
  if (whole !== title.replace(/\s+/g, " ").trim()) return whole;
  return title
    .split(",")
    .map((part) => translatePart(part, locale))
    .join(", ");
}
