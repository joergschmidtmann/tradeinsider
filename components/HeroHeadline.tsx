"use client";

import { useEffect, useState } from "react";

export interface HeroHeadlineLine {
  text: string;
  accent: boolean;
}

interface HeroHeadlineProps {
  variants: HeroHeadlineLine[][];
}

// Renders the first variant during SSR/hydration (so the server-rendered
// HTML and the client's first render match exactly, avoiding a hydration
// mismatch), then swaps to a random variant right after mount. The one-time
// post-mount flash is an accepted tradeoff for "a different headline on
// every reload" without opting the whole homepage out of ISR caching.
export function HeroHeadline({ variants }: HeroHeadlineProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (variants.length <= 1) return;
    // Deliberately not "syncing state from an external system" in the usual
    // sense this lint rule guards against — the whole point is a one-time,
    // client-only pick that must differ from the SSR-rendered first variant
    // (picking randomly during render itself would produce a hydration
    // mismatch instead).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(Math.floor(Math.random() * variants.length));
  }, [variants.length]);

  const lines = variants[index] ?? variants[0] ?? [];

  return (
    <h1 className="mt-6 text-5xl leading-[0.95] font-extrabold tracking-tight text-balance uppercase sm:text-6xl">
      {lines.map((line, i) => (
        <span key={i} className={"block " + (line.accent ? "text-gradient" : "text-foreground")}>
          {line.text}
        </span>
      ))}
    </h1>
  );
}
