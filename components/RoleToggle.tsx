import Link from "next/link";

// "Vorstand" also covers supervisory-board rows (role="supervisory_board")
// under the hood — see the `roles` expansion in app/insider-kaeufe/page.tsx.
// Per-row owner_title still shows which one a given transaction actually was.
const ROLES = [
  { code: "management_board", label: "Vorstand" },
  { code: "politician", label: "Politiker" },
  { code: "hedge_fund", label: "Hedgefonds" },
] as const;

export function RoleToggle({ activeCode, q }: { activeCode: string; q: string }) {
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
            {role.label}
          </Link>
        );
      })}
    </div>
  );
}
