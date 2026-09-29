"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

function isNavItemActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// Mirrors the display-name fallback in app/konto/page.tsx (saved display_name,
// else a name derived from the email's local part) so the header's avatar and
// the dashboard's greeting agree on who the user is. Two-letter initials from
// a space-separated name ("Jörg Schmidtmann" -> "JS"), else the first two
// characters of the single word we do have.
function deriveInitials(email: string | undefined, displayName: string | undefined): string {
  const emailName = email?.split("@")[0]?.split(/[._+-]/)[0] ?? "";
  const name = displayName?.trim() || emailName;
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function AccountAvatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-accent font-semibold text-black " + (className ?? "")
      }
    >
      {initials}
    </span>
  );
}

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initials, setInitials] = useState("");

  const NAV_ITEMS = [
    { href: "/", label: t("home") },
    { href: "/insider-kaeufe", label: t("insiderKaeufe") },
    { href: "/trading-intelligence", label: t("tradingIntelligence") },
    { href: "/trading-academy", label: t("tradingAcademy") },
  ];

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function loadUser(userId: string | undefined, email: string | undefined) {
      setIsLoggedIn(!!userId);
      if (!userId) {
        setInitials("");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userId).single();
      setInitials(deriveInitials(email, profile?.display_name ?? undefined));
    }

    supabase.auth.getUser().then(({ data }) => loadUser(data.user?.id, data.user?.email));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user?.id, session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  // The dashboard at /konto has its own sidebar navigation instead of the
  // marketing site's top nav.
  if (pathname === "/konto") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-black/70 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 justify-self-start text-2xl font-extrabold tracking-tight text-foreground"
          onClick={() => setMenuOpen(false)}
        >
          trade<span className="text-gradient">insider</span>
        </Link>

        <nav className="hidden items-center justify-self-center gap-1 whitespace-nowrap lg:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors " +
                  (isActive ? "text-foreground" : "text-muted hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-self-end gap-3">
          <div className="hidden lg:block">
            <LocaleSwitcher />
          </div>

          {isLoggedIn ? (
            <Link href="/konto" aria-label={t("konto")} className="hidden transition-opacity hover:opacity-85 lg:block">
              <AccountAvatar initials={initials} className="h-8 w-8 text-xs" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground lg:block"
            >
              {t("login")}
            </Link>
          )}

          {!isLoggedIn && (
            <Link
              href="/signup"
              className="hidden rounded-full bg-gradient-accent px-4 py-1.5 text-sm font-semibold whitespace-nowrap text-black transition hover:opacity-90 lg:block"
            >
              {t("signup")}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t("menuClose") : t("menuOpen")}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={
                  "rounded-lg px-3 py-2.5 text-base font-medium transition-colors " +
                  (isActive ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground")
                }
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href={isLoggedIn ? "/konto" : "/login"}
            onClick={() => setMenuOpen(false)}
            className={
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-base font-medium transition-colors " +
              (isNavItemActive(pathname, isLoggedIn ? "/konto" : "/login")
                ? "bg-surface-2 text-foreground"
                : "text-muted hover:text-foreground")
            }
          >
            {isLoggedIn && <AccountAvatar initials={initials} className="h-7 w-7 text-[11px]" />}
            {isLoggedIn ? t("konto") : t("login")}
          </Link>
          {!isLoggedIn && (
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="mt-1 rounded-full bg-gradient-accent px-3 py-2.5 text-center text-base font-semibold text-black"
            >
              {t("signup")}
            </Link>
          )}
          <div className="mt-2 border-t border-border px-3 pt-3">
            <LocaleSwitcher onNavigate={() => setMenuOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  );
}
