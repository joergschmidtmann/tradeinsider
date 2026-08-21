/**
 * Decides whether a Form 4 reporting owner is a CEO, based on the free-text
 * `officerTitle` field. Only officers are considered (isOfficer=1) — directors
 * and 10% owners without an officer title are excluded even if isOfficer is
 * missing/false.
 */
export function isCeoTitle(isOfficer: boolean, officerTitle: string | undefined | null): boolean {
  if (!isOfficer || !officerTitle) return false;
  const title = officerTitle.toLowerCase();
  if (title.includes("chief executive officer")) return true;
  if (/\bceo\b/.test(title)) return true;
  return false;
}
