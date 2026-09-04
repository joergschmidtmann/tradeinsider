"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { createCheckoutSession } from "./actions";

export function UpgradeSection({
  heading,
  description,
  monthlyLabel,
  yearlyLabel,
}: {
  heading: string;
  description: string;
  monthlyLabel: string;
  yearlyLabel: string;
}) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedEarlyStart, setAcceptedEarlyStart] = useState(false);
  const canSubmit = acceptedTerms && acceptedEarlyStart;

  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
      <p className="mt-1.5 text-sm text-muted">{description}</p>

      <p className="mt-4 text-xs text-muted">
        TradeInsider Pro — €14,99 / Monat oder €149 / Jahr, jeweils inkl. gesetzlicher Umsatzsteuer, soweit
        anfällt. Das Abonnement verlängert sich automatisch um den gewählten Zeitraum, sofern es nicht vor Ablauf
        der laufenden Periode gekündigt wird. Details siehe{" "}
        <Link href="/agb" className="underline hover:text-foreground">
          AGB
        </Link>
        .
      </p>

      <div className="mt-4 flex flex-col gap-2.5 text-xs text-muted">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 shrink-0"
          />
          <span>
            Ich akzeptiere die{" "}
            <Link href="/agb" className="underline hover:text-foreground">
              AGB
            </Link>
            , die{" "}
            <Link href="/widerruf" className="underline hover:text-foreground">
              Widerrufsbelehrung
            </Link>
            , die{" "}
            <Link href="/datenschutz" className="underline hover:text-foreground">
              Datenschutzerklärung
            </Link>{" "}
            und die{" "}
            <Link href="/risikohinweise" className="underline hover:text-foreground">
              Risikohinweise
            </Link>
            .
          </span>
        </label>
        {/* TODO LEGAL REVIEW – genaue Formulierung abhängig von rechtlicher Einordnung als Dienstleistung/digitale Leistung (siehe /widerruf) */}
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={acceptedEarlyStart}
            onChange={(e) => setAcceptedEarlyStart(e.target.checked)}
            className="mt-0.5 shrink-0"
          />
          <span>
            Ich verlange ausdrücklich, dass TradeInsider bereits vor Ablauf der Widerrufsfrist mit der Erbringung
            der gebuchten Leistungen beginnt.
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <form action={createCheckoutSession.bind(null, "month")}>
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {monthlyLabel}
          </button>
        </form>
        <form action={createCheckoutSession.bind(null, "year")}>
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {yearlyLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
