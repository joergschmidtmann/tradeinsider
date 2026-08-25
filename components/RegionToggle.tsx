import Link from "next/link";

const REGIONS = [
  { code: "US", label: "USA" },
  { code: "EU", label: "Europa" },
] as const;

export function RegionToggle({
  activeCode,
  type,
  q,
}: {
  activeCode: string;
  type: string;
  q: string;
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-surface p-1 text-sm">
      {REGIONS.map((region) => {
        const isActive = region.code === activeCode;
        return (
          <Link
            key={region.code}
            href={{ pathname: "/insider-kaeufe", query: { ...(q ? { q } : {}), type, region: region.code } }}
            className={
              isActive
                ? "rounded-full bg-gradient-accent px-4 py-1.5 font-medium text-white"
                : "rounded-full px-4 py-1.5 text-muted transition-colors hover:text-foreground"
            }
          >
            {region.label}
          </Link>
        );
      })}
    </div>
  );
}
