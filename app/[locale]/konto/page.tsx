import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logout, createCheckoutSession, openBillingPortal } from "./actions";

export default async function KontoPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect({ href: { pathname: "/login", query: { next: "/konto" } }, locale });
    return null;
  }

  const t = await getTranslations("auth.konto");
  const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).single();
  const isPro = profile?.tier === "pro";

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">{t("heading")}</h1>
      <p className="mt-2 text-sm text-muted">{t("loggedInAs", { email: user.email ?? "" })}</p>

      {isPro ? (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
          <span className="inline-flex items-center rounded-full bg-gradient-accent px-3 py-1 text-xs font-semibold text-white">
            {t("proBadge")}
          </span>
          <p className="mt-3 text-sm text-muted">{t("proDescription")}</p>
          <form action={openBillingPortal} className="mt-4">
            <button
              type="submit"
              className="w-full rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
            >
              {t("manageSubscription")}
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">{t("upgradeHeading")}</h2>
          <p className="mt-1.5 text-sm text-muted">{t("upgradeDescription")}</p>
          <div className="mt-4 flex flex-col gap-2">
            <form action={createCheckoutSession.bind(null, "month")}>
              <button
                type="submit"
                className="w-full rounded-full bg-gradient-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t("monthly")}
              </button>
            </form>
            <form action={createCheckoutSession.bind(null, "year")}>
              <button
                type="submit"
                className="w-full rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                {t("yearly")}
              </button>
            </form>
          </div>
        </div>
      )}

      <form action={logout} className="mt-8">
        <button
          type="submit"
          className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
        >
          {t("logout")}
        </button>
      </form>
    </div>
  );
}
