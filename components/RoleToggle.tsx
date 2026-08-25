import Link from "next/link";

const ROLES = [
  { code: "management_board", label: "Vorstand" },
  { code: "supervisory_board", label: "Aufsichtsrat" },
  { code: "politician", label: "Politiker" },
] as const;

export function RoleToggle({
  activeCode,
  region,
  type,
  q,
}: {
  activeCode: string;
  region: string;
  type: string;
  q: string;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-1 text-sm">
      {ROLES.map((role) => {
        const isActive = role.code === activeCode;
        // Politician data only exists for the US, so switching to it pins the region.
        const targetRegion = role.code === "politician" ? "US" : region;
        return (
          <Link
            key={role.code}
            href={{
              pathname: "/insider-kaeufe",
              query: { ...(q ? { q } : {}), type, region: targetRegion, role: role.code },
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
