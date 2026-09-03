"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = { de: "DE", en: "EN", es: "ES" };

export function LocaleSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeLocale = useLocale();

  return (
    <div className="flex items-center gap-0.5 text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          onClick={onNavigate}
          className={
            "rounded-full px-2 py-1 font-medium transition-colors " +
            (locale === activeLocale ? "text-foreground" : "text-muted hover:text-foreground")
          }
        >
          {LOCALE_LABELS[locale]}
        </Link>
      ))}
    </div>
  );
}
