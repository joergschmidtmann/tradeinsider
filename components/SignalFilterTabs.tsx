"use client";

import { useState } from "react";

/** Signal-strength filter tabs above the homepage's recent-purchases table.
 * Visual only — the active tab toggles styling but the table underneath
 * always shows the same rows; wiring this to a real filter would need more
 * rows fetched than the homepage teaser needs. */
export function SignalFilterTabs({ labels }: { labels: [string, string, string, string] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => setActive(i)}
          className={
            "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition " +
            (active === i ? "bg-gradient-accent text-black" : "border border-border text-muted hover:text-foreground")
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}
