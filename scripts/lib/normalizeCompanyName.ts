/**
 * Normalizes a company name for fuzzy index-membership matching: lowercases,
 * strips diacritics, drops common legal-entity/share-class suffixes and
 * punctuation, and collapses whitespace. Needed because source filings
 * spell issuer names differently from the curated index lists (e.g. CNMV's
 * all-caps "IBERDROLA, S.A." vs. spanishIndices.ts's "Iberdrola") — used to
 * match against SPANISH_INDEX_NAMES, SWEDISH_INDEX_NAMES, and
 * DUTCH_INDEX_NAMES in the respective ingest-*.ts scripts.
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\([^)]*\)/g, "") // drop parenthetical qualifiers entirely, e.g. "(publ)" — stripping just the word "publ" inside would leave a stray "()"
    .replace(/[.,]/g, "")
    .replace(/\b(ab|nv|n\.v|sa|s\.a|plc|ser\.?\s*[a-z]|publ|inc|corp|corporation|group|holding|koninklijke)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Precompute a normalized Set once per ingest run, then check membership
 * with `normalizedIndexNames.has(normalizeCompanyName(issuerName))`. */
export function normalizeAll(names: Iterable<string>): Set<string> {
  return new Set([...names].map(normalizeCompanyName));
}
