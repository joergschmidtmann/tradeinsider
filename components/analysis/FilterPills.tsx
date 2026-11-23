import { Link } from "@/i18n/navigation";

export interface Pill {
  key: string;
  label: string;
  query: Record<string, string>;
  active: boolean;
}

/** Segment-Umschalter im Stil von RoleToggle, für die Filter der Übersicht. */
export function FilterPills({ pills, pathname }: { pills: Pill[]; pathname: string }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-full border border-border bg-surface p-1 text-sm">
      {pills.map((p) => (
        <Link
          key={p.key}
          href={{ pathname, query: p.query }}
          className={
            p.active
              ? "rounded-full bg-gradient-accent px-4 py-1.5 font-medium whitespace-nowrap text-black"
              : "rounded-full px-4 py-1.5 whitespace-nowrap text-muted transition-colors hover:text-foreground"
          }
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
