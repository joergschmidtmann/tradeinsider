import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// "Vorstand" also covers supervisory-board rows (role="supervisory_board")
// under the hood — see the `roles` expansion in app/[locale]/insider-kaeufe/page.tsx.
// Per-row owner_title still shows which one a given transaction actually was.
const ROLES = [
  { code: "management_board", labelKey: "managementBoard" },
  { code: "politician", labelKey: "politician" },
  { code: "hedge_fund", labelKey: "hedgeFund" },
] as const;

export function RoleToggle({ activeCode, q }: { activeCode: string; q: string }) {
  const t = useTranslations("insiderKaeufe.roles");

  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-1 text-sm">
      {ROLES.map((role) => {
        const isActive = role.code === activeCode;
        return (
          <Link
            key={role.code}
            href={{
              pathname: "/insider-kaeufe",
              query: { ...(q ? { q } : {}), role: role.code },
            }}
            className={
              isActive
                ? "rounded-full bg-gradient-accent px-4 py-1.5 font-medium text-white"
                : "rounded-full px-4 py-1.5 text-muted transition-colors hover:text-foreground"
            }
          >
            {t(role.labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
