import { useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function SearchBar({
  initialQuery,
  role,
  company,
  insider,
  country,
  locale,
}: {
  initialQuery: string;
  role: string;
  company?: string;
  insider?: string;
  country?: string;
  locale: Locale;
}) {
  const t = useTranslations("insiderKaeufe");
  const action = getPathname({ href: "/insider-kaeufe", locale });

  return (
    <form action={action} method="get" className="mb-8">
      <input type="hidden" name="role" value={role} />
      {company && <input type="hidden" name="company" value={company} />}
      {insider && <input type="hidden" name="insider" value={insider} />}
      {country && <input type="hidden" name="country" value={country} />}
      <div className="relative max-w-md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
        >
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="text"
          name="q"
          defaultValue={initialQuery}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-full border border-border bg-surface py-2.5 pr-4 pl-10 text-sm text-foreground placeholder:text-muted outline-none focus:border-white/25"
        />
      </div>
    </form>
  );
}
