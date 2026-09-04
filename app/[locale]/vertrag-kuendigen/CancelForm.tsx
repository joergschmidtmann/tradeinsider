"use client";

import { useActionState } from "react";
import { submitCancellation } from "./actions";

export function CancelForm() {
  const [state, formAction, pending] = useActionState(submitCancellation, undefined);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
        <p className="font-medium text-foreground">Kündigung eingegangen</p>
        <p className="mt-1.5 text-muted">
          Wir haben deine Kündigung erhalten und bearbeiten sie zeitnah. Eine Bestätigung per Email folgt.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-full border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/25"
        />
      </div>
      <div>
        <label htmlFor="plan" className="mb-1.5 block text-sm font-medium text-foreground">
          Vertrag / Tarif
        </label>
        <input
          id="plan"
          name="plan"
          type="text"
          placeholder="z. B. TradeInsider Intelligence, monatlich"
          className="w-full rounded-full border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-white/25"
        />
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-foreground">Kündigung</legend>
        <div className="flex flex-col gap-2 text-sm text-muted">
          <label className="flex items-center gap-2">
            <input type="radio" name="requestedTermination" value="asap" defaultChecked />
            zum nächstmöglichen Zeitpunkt
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="requestedTermination" value="date" />
            zu einem konkreten Datum (bitte im Feld „Grund“ angeben)
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="requestedTermination" value="immediate" />
            außerordentlich, sofort
          </label>
        </div>
      </fieldset>
      <div>
        <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-foreground">
          Grund (optional)
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/25"
        />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Wird gesendet…" : "Jetzt kündigen"}
      </button>
    </form>
  );
}
