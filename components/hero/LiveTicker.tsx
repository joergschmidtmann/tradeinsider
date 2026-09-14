"use client";

import { useRef } from "react";
import { Link } from "@/i18n/navigation";

export interface LiveTickerItem {
  id: number;
  ticker: string;
  pctChange: number | null;
  roleLabel: string | null;
  amountLabel: string;
  dateLabel: string;
}

/** Scrolling strip of the latest purchases just below the hero — a compact,
 * terminal-style companion to the full table further down the page. The
 * chevron button nudges the strip forward; the row itself stays natively
 * horizontally scrollable (touch/trackpad) for anyone who wants to browse
 * further without waiting for the button. */
export function LiveTicker({ label, items }: { label: string; items: LiveTickerItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  return (
    <div className="border-y border-border bg-black/40">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <span className="inline-flex shrink-0 items-center gap-2 py-3 font-mono text-[11px] font-semibold tracking-wider text-foreground uppercase">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute h-[7px] w-[7px] rounded-full bg-gradient-accent" />
            <span className="absolute -inset-[5px] animate-[home-livepulse_2.2s_ease-out_infinite] rounded-full border border-[var(--accent-from)] motion-reduce:animate-none" />
          </span>
          {label}
        </span>

        <div ref={scrollerRef} className="flex min-w-0 flex-1 items-center gap-8 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const positive = item.pctChange !== null && item.pctChange >= 0;
            return (
              <Link
                key={item.id}
                href="/insider-kaeufe"
                className="flex shrink-0 items-center gap-2 text-sm whitespace-nowrap transition hover:opacity-80"
              >
                <span className="font-mono font-bold text-foreground">{item.ticker}</span>
                {item.pctChange !== null && (
                  <span className={positive ? "font-semibold text-[var(--accent-from)]" : "font-semibold text-red-400"}>
                    {positive ? "+" : ""}
                    {item.pctChange.toFixed(1)}%
                  </span>
                )}
                {item.roleLabel && <span className="text-muted">{item.roleLabel}</span>}
                <span className="font-medium text-foreground">{item.amountLabel}</span>
                <span className="text-muted">{item.dateLabel}</span>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Weiter"
          onClick={() => scrollerRef.current?.scrollBy({ left: 240, behavior: "smooth" })}
          className="hidden shrink-0 items-center justify-center rounded-full border border-border p-1.5 text-muted transition hover:text-foreground sm:flex"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
