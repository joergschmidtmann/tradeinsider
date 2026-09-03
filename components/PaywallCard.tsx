import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function PaywallCard({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("auth.paywall");

  return (
    <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
      <h3 className="text-lg font-semibold text-foreground">{t("heading")}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{t("description")}</p>
      <Link
        href={isLoggedIn ? "/konto" : "/signup"}
        className="mt-6 inline-block rounded-full bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {isLoggedIn ? t("ctaLoggedIn") : t("ctaLoggedOut")}
      </Link>
    </div>
  );
}
