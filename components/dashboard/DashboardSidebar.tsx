"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { logout } from "@/app/[locale]/konto/actions";

const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />
    </svg>
  ),
  insiderKaeufe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 15 4-5 3 3 5-7" />
    </svg>
  ),
  watchlist: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  ),
  screener: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  ),
  news: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h13a2 2 0 0 1 2 2v12a1 1 0 0 1-1.5.87L15 18H6a2 2 0 0 1-2-2V5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h7M7 12.5h7" />
    </svg>
  ),
  academy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2 8 10-5 10 5-10 5-10-5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10.5V16c0 1.1 2.7 3 6 3s6-1.9 6-3v-5.5" />
    </svg>
  ),
  intelligence: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.2-3.2" />
    </svg>
  ),
};

interface NavItem {
  key: keyof typeof ICONS;
  href?: string;
  label: string;
  soon?: boolean;
}

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("dashboard.sidebar");
  const tKonto = useTranslations("auth.konto");
  const pathname = usePathname();

  const items: NavItem[] = [
    { key: "dashboard", href: "/konto", label: t("dashboard") },
    { key: "insiderKaeufe", href: "/insider-kaeufe", label: t("insiderKaeufe") },
    { key: "watchlist", label: t("watchlist"), soon: true },
    { key: "screener", label: t("screener"), soon: true },
    { key: "news", label: t("news"), soon: true },
    { key: "academy", href: "/trading-academy", label: t("academy"), soon: true },
    { key: "intelligence", href: "/trading-intelligence", label: t("intelligence"), soon: true },
  ];

  return (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={onNavigate} className="px-5 py-5 text-xl font-extrabold tracking-tight text-foreground">
        trade<span className="text-gradient">insider</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const isActive = !!item.href && pathname === item.href;
          const content = (
            <>
              <span className={isActive ? "text-[var(--accent-from)]" : "text-muted"}>{ICONS[item.key]}</span>
              <span className="flex-1">{item.label}</span>
              {item.soon && (
                <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
                  {t("comingSoon")}
                </span>
              )}
            </>
          );

          if (!item.href) {
            return (
              <span key={item.key} className="flex cursor-default items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted/60">
                {content}
              </span>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
                (isActive ? "bg-surface-2 text-foreground" : "text-muted hover:bg-surface-2 hover:text-foreground")
              }
            >
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h10m0 0-3-3m3 3-3 3" />
            </svg>
            {tKonto("logout")}
          </button>
        </form>
      </div>
    </div>
  );
}
