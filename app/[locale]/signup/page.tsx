"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Link } from "@/i18n/navigation";
import { signup } from "./actions";

export default function SignupPage() {
  const t = useTranslations("auth.signup");
  const [state, formAction, pending] = useActionState(signup, undefined);

  if (state?.success) {
    return (
      <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">{t("successHeading")}</h1>
        <p className="mt-2 text-sm text-muted">{t("successText")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{t("heading")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      <form action={formAction} className="mt-8 flex flex-col gap-4">
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
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-white/25"
          />
          <p className="mt-1.5 text-xs text-muted">{t("passwordHint")}</p>
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
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-foreground underline underline-offset-2">
          {t("signInLink")}
        </Link>
      </p>
    </div>
  );
}
