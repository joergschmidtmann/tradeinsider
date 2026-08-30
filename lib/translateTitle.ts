// Best-effort German translation for the `owner_title` freetext that comes
// straight from each country's source filing (English from the US/Belgium,
// Swedish from Sweden, Spanish from Spain). Germany/Austria already report
// "Vorstand"/"Aufsichtsrat" and simply pass through unchanged below, since
// they're not in this dictionary.
//
// Matching is by exact phrase (case-insensitive), not substring — freetext
// titles vary too much across sources for partial matching to be safe. A
// title made of several comma-separated roles (seen in Swedish data, e.g.
// "Verkställande direktör (VD), Styrelseledamot") is split, each part is
// looked up individually, then rejoined. Anything not in the dictionary is
// left in its original language rather than guessed at.
const TRANSLATIONS: Record<string, string> = {
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
};

function translatePart(part: string): string {
  // Some sources (seen in Swedish data) use non-breaking spaces between
  // words instead of regular ones — normalize before lookup so those still
  // match the dictionary, which is keyed with plain spaces.
  const trimmed = part.replace(/\s+/g, " ").trim();
  return TRANSLATIONS[trimmed.toLowerCase()] ?? trimmed;
}

export function translateTitle(title: string | null): string | null {
  if (!title) return title;
  // Try the whole string first — some dictionary entries (e.g. the Swedish
  // MAR-category label) contain a comma as ordinary punctuation, not as a
  // separator between combined roles, so splitting unconditionally would
  // break their exact match. Only split on comma as a fallback, for titles
  // like "Verkställande direktör (VD), Styrelseledamot" that really do
  // combine two distinct roles and aren't in the dictionary as one phrase.
  const whole = translatePart(title);
  if (whole !== title.replace(/\s+/g, " ").trim()) return whole;
  return title
    .split(",")
    .map(translatePart)
    .join(", ");
}
