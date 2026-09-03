import { useTranslations } from "next-intl";

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
    </footer>
  );
}
