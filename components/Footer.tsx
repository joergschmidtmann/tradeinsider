import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-auto border-t border-border py-8 text-center text-xs text-muted">
      <p className="mx-auto max-w-2xl px-4">
        {t.rich("disclaimer", {
          link: (chunks) => (
            <a
              href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&company=&dateb=&owner=include&count=100"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
      <p className="mx-auto mt-2 max-w-2xl px-4">{t("riskNotice")}</p>
      <p className="mx-auto mt-3 flex max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4">
        <Link href="/impressum" className="hover:text-foreground">
          {t("impressum")}
        </Link>
        <Link href="/datenschutz" className="hover:text-foreground">
          {t("privacy")}
        </Link>
        <Link href="/agb" className="hover:text-foreground">
          {t("agb")}
        </Link>
        <Link href="/widerruf" className="hover:text-foreground">
          {t("withdrawalNotice")}
        </Link>
        <Link href="/risikohinweise" className="hover:text-foreground">
          {t("riskDisclosures")}
        </Link>
        <Link href="/methodik" className="hover:text-foreground">
          {t("methodology")}
        </Link>
        <Link href="/interessenkonflikte" className="hover:text-foreground">
          {t("conflictsOfInterest")}
        </Link>
        <Link href="/vertrag-kuendigen" className="hover:text-foreground">
          {t("cancelContract")}
        </Link>
        <Link href="/vertrag-widerrufen" className="hover:text-foreground">
          {t("withdrawContract")}
        </Link>
      </p>
    </footer>
  );
}
