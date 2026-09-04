"use client";

import { useActionState } from "react";
import { submitWithdrawal } from "./actions";

export function WithdrawForm() {
  const [state, formAction, pending] = useActionState(submitWithdrawal, undefined);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
        <p className="font-medium text-foreground">Widerruf eingegangen</p>
        <p className="mt-1.5 text-muted">
          Wir haben deinen Widerruf erhalten. Eine Bestätigung per Email folgt; bereits gezahlte Beträge erstatten
          wir gemäß unserer Widerrufsbelehrung.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-full border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/25"
        />
      </div>
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
      <div>
        <label htmlFor="orderDate" className="mb-1.5 block text-sm font-medium text-foreground">
          Bestelldatum (optional)
        </label>
        <input
          id="orderDate"
          name="orderDate"
          type="date"
          className="w-full rounded-full border border-border bg-surface-2 px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/25"
        />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Wird gesendet…" : "Widerruf bestätigen"}
      </button>
    </form>
  );
}
