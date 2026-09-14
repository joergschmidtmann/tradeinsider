"use client";

import { useState } from "react";
import { BuySignalIcon } from "@/components/BuySignalIcon";
import { BUY_SIGNAL_COLOR, type BuySignalTier } from "@/lib/buySignal";

export interface CarouselExample {
  id: number;
  ticker: string;
  issuerName: string;
  tier: BuySignalTier;
  tierLabel: string;
  kindLabel: string | null;
  amountLabel: string;
  dateLabel: string;
  pctChange: number | null;
}

/** Sparkline from the real purchase price to the real current price — a
 * smooth curve, not a fabricated daily series (we only have two real price
 * points, see scripts/ingest-prices.ts), styled to read as a trend rather
 * than a literal chart. */
function Sparkline({ positive }: { positive: boolean }) {
  const color = positive ? "var(--accent-from)" : "#ef4444";
  const d = positive ? "M2 46 C 40 44, 60 38, 90 26 S 150 6, 198 4" : "M2 6 C 40 10, 60 20, 90 30 S 150 42, 198 46";
  return (
    <svg viewBox="0 0 200 50" className="h-16 w-full sm:h-20" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

export function ExampleCarousel({ examples, sincePurchaseLabel }: { examples: CarouselExample[]; sincePurchaseLabel: string }) {
  const [index, setIndex] = useState(0);
  if (examples.length === 0) return null;
  const example = examples[index % examples.length];
  const positive = example.pctChange !== null && example.pctChange >= 0;

  return (
    <div>
      <div className="rounded-2xl border border-white/[0.14] bg-surface p-6 shadow-[0_0_40px_-12px_rgba(120,255,70,0.2)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xl font-bold text-foreground">{example.ticker}</div>
            <div className="text-sm text-muted">{example.issuerName}</div>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase"
            style={{ color: BUY_SIGNAL_COLOR[example.tier], backgroundColor: `${BUY_SIGNAL_COLOR[example.tier]}1f` }}
          >
            <BuySignalIcon tier={example.tier} size={12} />
            {example.tierLabel}
          </span>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-end">
          <div>
            {example.kindLabel && <div className="text-xs text-muted">{example.kindLabel}</div>}
            <div className="mt-1 text-2xl font-bold whitespace-nowrap text-foreground">{example.amountLabel}</div>
            <div className="mt-1 text-xs text-muted">{example.dateLabel}</div>
          </div>
          <div>
            <Sparkline positive={positive} />
            {example.pctChange !== null && (
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`text-xl font-bold ${positive ? "text-[var(--accent-from)]" : "text-red-400"}`}>
                  {positive ? "+" : ""}
                  {example.pctChange.toFixed(1)}%
                </span>
                <span className="text-xs text-muted">{sincePurchaseLabel}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Zurück"
          onClick={() => setIndex((i) => (i - 1 + examples.length) % examples.length)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 5-7 7 7 7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          {examples.map((e, i) => (
            <button
              key={e.id}
              type="button"
              aria-label={`Beispiel ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-gradient-accent" : "w-1.5 bg-white/15"}`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Weiter"
          onClick={() => setIndex((i) => (i + 1) % examples.length)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
