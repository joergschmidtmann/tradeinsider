"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { login } from "./actions";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const [state, formAction, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/konto";

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{t("heading")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
            {t("emailLabel")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-white/25"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
            {t("passwordLabel")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-white/25"
          />
        </div>

        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t("submitPending") : t("submit")}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/signup" className="text-foreground underline underline-offset-2">
          {t("signUpLink")}
        </Link>
      </p>
    </div>
  );
}
