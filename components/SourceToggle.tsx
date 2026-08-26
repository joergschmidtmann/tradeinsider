import Link from "next/link";

const SOURCES = [
  { code: "all", label: "Alle" },
  { code: "ecb", label: "EZB" },
  { code: "destatis", label: "Destatis" },
  { code: "eqs_corporate", label: "Unternehmen" },
] as const;

export function SourceToggle({ activeCode }: { activeCode: string }) {
  return (
    <div className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-border bg-surface p-1 text-sm">
      {SOURCES.map((source) => {
        const isActive = source.code === activeCode;
        return (
          <Link
            key={source.code}
            href={{ pathname: "/wirtschaftsnews", query: { source: source.code } }}
            className={
              isActive
                ? "rounded-full bg-gradient-accent px-4 py-1.5 font-medium text-white"
                : "rounded-full px-4 py-1.5 text-muted transition-colors hover:text-foreground"
            }
          >
            {source.label}
          </Link>
        );
      })}
    </div>
  );
}
