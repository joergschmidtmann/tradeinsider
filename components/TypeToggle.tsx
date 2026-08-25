import Link from "next/link";

const TABS = [
  { code: "P", label: "Käufe" },
  { code: "S", label: "Verkäufe" },
] as const;

export function TypeToggle({
  activeCode,
  role,
  region,
  q,
}: {
  activeCode: string;
  role: string;
  region: string;
  q: string;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-1 text-sm">
      {TABS.map((tab) => {
        const isActive = tab.code === activeCode;
        return (
          <Link
            key={tab.code}
            href={{ pathname: "/insider-kaeufe", query: { ...(q ? { q } : {}), role, region, type: tab.code } }}
            className={
              isActive
                ? "rounded-full bg-gradient-accent px-4 py-1.5 font-medium text-white"
                : "rounded-full px-4 py-1.5 text-muted transition-colors hover:text-foreground"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
