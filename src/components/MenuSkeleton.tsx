function Bar({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-sm ${className}`} />;
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <section className="scroll-mt-40">
      <header className="flex items-baseline gap-6 mb-12">
        <Bar className="h-8 w-10" />
        <div className="flex-1 space-y-3">
          <Bar className="h-9 w-56 max-w-[60%]" />
          <Bar className="h-3 w-72 max-w-[80%]" />
        </div>
        <span className="hidden lg:block flex-1 h-px bg-[var(--gold)]/20 max-w-xs" />
      </header>

      <ul className="divide-y divide-[var(--gold)]/20">
        {Array.from({ length: rows }).map((_, i) => (
          <li
            key={i}
            className="py-6 lg:py-7 grid grid-cols-[1fr_auto] gap-4 sm:gap-6 items-center"
          >
            <div className="space-y-3">
              <Bar className="h-6 w-48 max-w-[70%]" />
              <Bar className="h-3 w-96 max-w-[90%]" />
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              <Bar className="h-6 w-14" />
              <Bar className="h-9 w-16" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MenuSkeleton() {
  const layout = [5, 4, 3];
  return (
    <div
      className="mx-auto max-w-5xl space-y-24 lg:space-y-32"
      aria-busy="true"
      aria-label="Loading menu"
    >
      {layout.map((rows, i) => (
        <SectionSkeleton key={i} rows={rows} />
      ))}
    </div>
  );
}
