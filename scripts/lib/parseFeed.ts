import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
});

export interface FeedEntry {
  accessionNumber: string;
  /** CIK found in this entry's filing URL (issuer or reporting owner — either
   * one works to locate the filing folder on EDGAR). */
  cik: string;
  filingIndexUrl: string;
  filedAt: string;
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** Parses the SEC EDGAR "current filings" Atom feed and returns only entries
 * whose form type is exactly "4" (the `type=` query param on the feed URL
 * does prefix matching, e.g. "4" also matches "424B2", "497J", "485APOS" —
 * so this exact-match filter is required, not optional). Filings with
 * multiple associated filers (issuer + one or more reporting owners) appear
 * as multiple entries sharing the same accession number; this function
 * de-duplicates them, keeping one representative entry per filing. */
export function parseFeed(atomXml: string): FeedEntry[] {
  const doc = parser.parse(atomXml);
  const entries = toArray(doc.feed?.entry);

  const byAccession = new Map<string, FeedEntry>();
  for (const entry of entries) {
    const formType = entry.category?.term;
    if (formType !== "4") continue;

    const id: string = entry.id ?? "";
    const match = id.match(/accession-number=([\d-]+)/);
    if (!match) continue;
    const accessionNumber = match[1];
    if (byAccession.has(accessionNumber)) continue;

    const href: string = entry.link?.href ?? "";
    const cikMatch = href.match(/\/Archives\/edgar\/data\/(\d+)\//);
    if (!cikMatch) continue;

    byAccession.set(accessionNumber, {
      accessionNumber,
      cik: cikMatch[1],
      filingIndexUrl: href,
      filedAt: entry.updated ?? "",
    });
  }

  return Array.from(byAccession.values());
}
