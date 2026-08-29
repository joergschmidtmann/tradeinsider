"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { ColumnFilterOption } from "@/lib/columnFilters";

interface ColumnFilterDropdownProps {
  label: string;
  paramName: "company" | "insider";
  values: ColumnFilterOption[];
  role: string;
  region: string;
  q: string;
  company?: string;
  insider?: string;
}

/** Column-header filter, styled as a <details>/<summary> disclosure rather
 * than a positioned overlay — the table sits inside two nested overflow
 * containers (see TransactionsTable.tsx), so an absolutely positioned
 * dropdown risks getting clipped. Flowing normally instead means opening it
 * just grows the header row, which is simpler and always visible.
 *
 * This is the one client component on an otherwise all-server-component page
 * (RoleToggle/RegionToggle/SearchBar are plain links/forms) — needed only for
 * the click-outside-to-close behavior below, which native <details> doesn't
 * provide (it only closes on a second click on <summary>). */
export function ColumnFilterDropdown({ label, paramName, values, role, region, q, company, insider }: ColumnFilterDropdownProps) {
  const activeValue = paramName === "company" ? company : insider;
  const otherFilter = paramName === "company" ? (insider ? { insider } : {}) : company ? { company } : {};
  const baseQuery = { ...(q ? { q } : {}), role, region, ...otherFilter };

  const detailsRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (detailsRef.current?.open && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.open = false;
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <details ref={detailsRef} className="inline-block">
      <summary className="cursor-pointer list-none font-medium select-none">
        {label}
        {activeValue && <span className="text-gradient"> · {activeValue}</span>}
        <span className="ml-1 text-muted">▾</span>
      </summary>
      <div className="mt-2 max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-surface-2 p-1.5 text-xs font-normal normal-case shadow-lg">
        {activeValue && (
          <Link
            href={{ pathname: "/insider-kaeufe", query: baseQuery }}
            className="block rounded-lg px-2.5 py-1.5 font-medium text-gradient hover:bg-surface"
          >
            Alle anzeigen
          </Link>
        )}
        {values.length === 0 && <p className="px-2.5 py-1.5 text-muted">Keine Werte gefunden.</p>}
        {values.map((option) => (
          <Link
            key={option.value}
            href={{ pathname: "/insider-kaeufe", query: { ...baseQuery, [paramName]: option.value } }}
            className={
              option.value === activeValue
                ? "block truncate rounded-lg bg-surface px-2.5 py-1.5 text-foreground"
                : "block truncate rounded-lg px-2.5 py-1.5 text-muted hover:bg-surface hover:text-foreground"
            }
          >
            {option.value} <span className="text-muted">({option.count})</span>
          </Link>
        ))}
      </div>
    </details>
  );
}
