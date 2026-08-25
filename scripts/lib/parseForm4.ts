import { XMLParser } from "fast-xml-parser";
import { isCeoTitle } from "./ceoMatch";

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
});

/** Normalizes a field that fast-xml-parser leaves as a single object when there's
 * only one occurrence, but as an array when there are several (e.g. multiple
 * reporting owners on a joint filing, or multiple transactions in one filing). */
function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export interface ParsedTransaction {
  /** Index of this transaction within the filing, for dedupe_key construction. */
  index: number;
  date: string;
  code: string;
  shares: number | null;
  pricePerShare: number | null;
  sharesOwnedAfter: number | null;
}

export type OwnerRole = "management_board" | "supervisory_board";

export interface ParsedOwner {
  ownerCik: string;
  ownerName: string;
  isOfficer: boolean;
  officerTitle: string | null;
  isCeo: boolean;
  /** management_board = CEO (isCeoTitle); supervisory_board = a director who
   * is not also an officer (SEC's isDirector, isOfficer=false); null = neither
   * (e.g. a 10%-owner filer with no board role) — callers should skip null. */
  role: OwnerRole | null;
}

export interface ParsedForm4 {
  issuerCik: string;
  issuerName: string;
  issuerTicker: string | null;
  owners: ParsedOwner[];
  transactions: ParsedTransaction[];
}

/** Parses a Form 4 "ownership document" XML string into a structured shape.
 * All non-derivative transactions in the filing apply to every listed reporting
 * owner (this is how joint filings work), so owners and transactions are
 * returned separately and the caller pairs them up. */
export function parseForm4(xml: string): ParsedForm4 {
  const doc = parser.parse(xml);
  const root = doc.ownershipDocument;
  if (!root) {
    throw new Error("Not a Form 4 ownershipDocument (missing <ownershipDocument> root)");
  }

  const issuer = root.issuer ?? {};
  const issuerCik = String(issuer.issuerCik ?? "").trim();
  const issuerName = String(issuer.issuerName ?? "").trim();
  const issuerTicker = issuer.issuerTradingSymbol ? String(issuer.issuerTradingSymbol).trim() || null : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped XML parser output
  const owners: ParsedOwner[] = toArray(root.reportingOwner).map((owner: any) => {
    const ownerCik = String(owner?.reportingOwnerId?.rptOwnerCik ?? "").trim();
    const ownerName = String(owner?.reportingOwnerId?.rptOwnerName ?? "").trim();
    const relationship = owner?.reportingOwnerRelationship ?? {};
    const isOfficer = String(relationship.isOfficer ?? "").toLowerCase() === "true";
    const isDirector = String(relationship.isDirector ?? "").toLowerCase() === "true";
    const officerTitle = relationship.officerTitle ? String(relationship.officerTitle).trim() || null : null;
    const isCeo = isCeoTitle(isOfficer, officerTitle);
    const role: OwnerRole | null = isCeo ? "management_board" : isDirector && !isOfficer ? "supervisory_board" : null;
    return {
      ownerCik,
      ownerName,
      isOfficer,
      officerTitle,
      isCeo,
      role,
    };
  });

  const rawTransactions = toArray(root.nonDerivativeTable?.nonDerivativeTransaction);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped XML parser output
  const transactions: ParsedTransaction[] = rawTransactions.map((tx: any, index: number) => ({
    index,
    date: String(tx?.transactionDate?.value ?? "").trim(),
    code: String(tx?.transactionCoding?.transactionCode ?? "").trim(),
    shares: toNumber(tx?.transactionAmounts?.transactionShares?.value),
    pricePerShare: toNumber(tx?.transactionAmounts?.transactionPricePerShare?.value),
    sharesOwnedAfter: toNumber(tx?.postTransactionAmounts?.sharesOwnedFollowingTransaction?.value),
  }));

  return { issuerCik, issuerName, issuerTicker, owners, transactions };
}
