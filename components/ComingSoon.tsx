export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center sm:px-6">
      <span className="rounded-full border border-border px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
        Bald verfügbar
      </span>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 text-lg text-muted">{description}</p>
    </div>
  );
}
