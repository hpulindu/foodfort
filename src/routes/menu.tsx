import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, RotateCw, Loader2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Ornament } from "@/components/Ornament";
import { MenuSkeleton } from "@/components/MenuSkeleton";
import { ExtrasModal } from "@/components/ExtrasModal";
import { restaurant, type MenuItem, type MenuSection, type Sauce } from "@/lib/menu-data";
import { fetchMenu, fetchSauces } from "@/lib/menu-api";
import { getExtrasFromMenu, isExtrasSection, supportsExtras } from "@/lib/menu-config";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu · Food Fort · Bluff Point WA" },
      { name: "description", content: "The full Food Fort menu — pizzas, kebabs, gozleme, burgers, tacos, salads, loaded fries, kids menu and combos." },
      { property: "og:title", content: "Menu · Food Fort" },
      { property: "og:description", content: "Wood-fired pizzas, hand-rolled kebabs, smashed burgers, fresh salads and more." },
    ],
  }),
  component: MenuPage,
});

function Badge({ kind }: { kind: "chef" | "veg" }) {
  if (kind === "chef") {
    return <span className="eyebrow text-[var(--gold)] ml-2 align-middle">★ Chef</span>;
  }
  return <span className="eyebrow text-[var(--forest)]/70 ml-2 align-middle">◆ Veg</span>;
}

function SoldOutLabel() {
  return (
    <span className="eyebrow text-xs text-[var(--forest)]/45 border border-[var(--forest)]/20 px-3 py-2">
      Sold out
    </span>
  );
}

function isAvailable(available?: boolean) {
  return available !== false;
}

function AddBtn({
  id,
  name,
  price,
  available = true,
  sectionId,
  extras,
  onOpenExtras,
}: {
  id: string;
  name: string;
  price: number;
  available?: boolean;
  sectionId: string;
  extras: MenuItem[];
  onOpenExtras: (item: { id: string; name: string; price: number }) => void;
}) {
  const { add } = useCart();
  if (!isAvailable(available)) {
    return <SoldOutLabel />;
  }

  const canCustomize = supportsExtras(sectionId) && extras.length > 0;

  return (
    <button
      onClick={() => {
        if (canCustomize) {
          onOpenExtras({ id, name, price });
          return;
        }
        add({ id, name, baseName: name, price });
        toast.success(`${name} added`, { duration: 1500 });
      }}
      aria-label={`Add ${name} to cart`}
      className="inline-flex items-center gap-1.5 eyebrow text-xs text-[var(--cream)] bg-[var(--forest-deep)] hover:bg-[var(--gold)] hover:text-[var(--gold-foreground)] px-3 py-2 transition-colors"
    >
      <Plus className="w-3 h-3" />
      Add
    </button>
  );
}

function SectionNav({ sections }: { sections: MenuSection[] }) {
  return (
    <nav className="sticky top-20 z-40 bg-[var(--cream)]/95 backdrop-blur border-b border-[var(--gold)]/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-4 flex gap-6 overflow-x-auto eyebrow text-[var(--forest)]/70 scrollbar-thin">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="whitespace-nowrap hover:text-[var(--forest-deep)] transition-colors">
            {s.title}
          </a>
        ))}
        <a href="#sauces" className="whitespace-nowrap hover:text-[var(--forest-deep)] transition-colors">
          Sauces
        </a>
      </div>
    </nav>
  );
}

function MenuSections({
  sections,
  extras,
  onOpenExtras,
}: {
  sections: MenuSection[];
  extras: MenuItem[];
  onOpenExtras: (item: { id: string; name: string; price: number }) => void;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-24 lg:space-y-32">
      {sections.map((section, idx) => (
        <section
          key={section.id}
          id={section.id}
          className="scroll-mt-40 fade-up"
          style={{ animationDelay: `${Math.min(idx, 4) * 0.08}s` }}
        >
          <header className="flex items-baseline gap-6 mb-12">
            <span className="font-display text-3xl text-[var(--gold)]">{section.number}</span>
            <div className="flex-1">
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--forest-deep)]">
                {section.title}
              </h2>
              {section.subtitle && (
                <p className="eyebrow text-[var(--forest)]/60 mt-2">{section.subtitle}</p>
              )}
            </div>
            <span className="hidden lg:block flex-1 h-px bg-[var(--gold)]/30 max-w-xs" />
          </header>

          <ul className="divide-y divide-[var(--gold)]/20">
            {section.items.map((item) => {
              const id = `${section.id}-${item.name}`;
              const soldOut = !isAvailable(item.available);
              const hasImage = Boolean(item.image);
              return (
                <li
                  key={item.name}
                  className={`py-6 lg:py-7 grid gap-4 sm:gap-6 items-center group ${
                    hasImage
                      ? "grid-cols-[auto_1fr_auto]"
                      : "grid-cols-[1fr_auto]"
                  } ${soldOut ? "opacity-60" : ""}`}
                >
                  {hasImage && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 shrink-0 overflow-hidden border border-[var(--gold)]/25 bg-[var(--forest)]/5">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className={hasImage ? "min-w-0" : undefined}>
                    <h3 className="font-display text-xl lg:text-2xl text-[var(--forest-deep)]">
                      {item.name}
                      {item.badge && <Badge kind={item.badge} />}
                    </h3>
                    {item.description && (
                      <p className="mt-2 text-sm text-[var(--forest)]/70 leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 sm:gap-5 whitespace-nowrap">
                    <span className="font-display text-xl text-[var(--forest-deep)]">${item.price}</span>
                    <AddBtn
                      id={id}
                      name={item.name}
                      price={parseFloat(item.price)}
                      available={item.available}
                      sectionId={section.id}
                      extras={extras}
                      onOpenExtras={onOpenExtras}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SauceChip({ sauce }: { sauce: Sauce }) {
  const { add } = useCart();
  const price = parseFloat(sauce.price);
  const isFree = !price;
  const soldOut = !isAvailable(sauce.available);

  if (soldOut) {
    return (
      <div
        aria-label={`${sauce.name} sauce sold out`}
        className="flex items-center justify-between gap-3 border border-[var(--forest)]/15 bg-[var(--forest)]/[0.03] px-4 py-3 text-left opacity-60"
      >
        <span className="font-display text-lg text-[var(--forest-deep)]">{sauce.name}</span>
        <span className="eyebrow text-[0.65rem] text-[var(--forest)]/45">Sold out</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        add({
          id: `sauce-${sauce.name}`,
          name: `${sauce.name} Sauce`,
          baseName: `${sauce.name} Sauce`,
          price,
        });
        toast.success(`${sauce.name} sauce added`, { duration: 1500 });
      }}
      aria-label={`Add ${sauce.name} sauce to cart`}
      className="group flex items-center justify-between gap-3 border border-[var(--gold)]/30 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 px-4 py-3 transition-colors text-left"
    >
      <span className="font-display text-lg text-[var(--forest-deep)]">{sauce.name}</span>
      <span className="flex items-center gap-2 whitespace-nowrap">
        <span className="eyebrow text-[0.65rem] text-[var(--forest)]/60">
          {isFree ? "Free" : `$${sauce.price}`}
        </span>
        <Plus className="w-4 h-4 text-[var(--gold)] transition-transform group-hover:scale-125" />
      </span>
    </button>
  );
}

function SaucesBlock({ sauces, isPending }: { sauces?: Sauce[]; isPending: boolean }) {
  return (
    <section id="sauces" className="scroll-mt-40 fade-up">
      <header className="flex items-baseline gap-6 mb-12">
        <span className="font-display text-3xl text-[var(--gold)]">★</span>
        <div className="flex-1">
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--forest-deep)]">Sauces</h2>
          <p className="eyebrow text-[var(--forest)]/60 mt-2">Pick your favourites — tap to add</p>
        </div>
        <span className="hidden lg:block flex-1 h-px bg-[var(--gold)]/30 max-w-xs" />
      </header>

      {isPending ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shimmer h-[52px] rounded-sm" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sauces?.map((s) => (
            <SauceChip key={s.name} sauce={s} />
          ))}
        </div>
      )}
    </section>
  );
}

function MenuError({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="mx-auto max-w-xl text-center py-10">
      <Ornament className="w-40 mx-auto text-[var(--gold)]" />
      <h2 className="mt-8 font-display text-3xl text-[var(--forest-deep)]">
        We couldn't load the menu
      </h2>
      <p className="mt-4 text-[var(--forest)]/70">
        Something went wrong reaching the kitchen. Please try again.
      </p>
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-8 inline-flex items-center gap-2 bg-[var(--forest-deep)] text-[var(--cream)] eyebrow px-8 py-4 hover:bg-[var(--forest)] transition-colors disabled:opacity-60"
      >
        {isRetrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
        {isRetrying ? "Retrying" : "Try again"}
      </button>
    </div>
  );
}

function MenuPage() {
  const { add } = useCart();
  const [extrasTarget, setExtrasTarget] = useState<{
    id: string;
    name: string;
    price: number;
  } | null>(null);

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["menu"],
    queryFn: fetchMenu,
    staleTime: 60 * 1000,
  });

  const saucesQuery = useQuery({
    queryKey: ["sauces"],
    queryFn: fetchSauces,
    staleTime: 60 * 1000,
  });

  const menuExtras = useMemo(
    () => (data ? getExtrasFromMenu(data) : []),
    [data],
  );

  const displaySections = useMemo(
    () => (data ? data.filter((section) => !isExtrasSection(section.id)) : []),
    [data],
  );

  return (
    <div className="min-h-screen bg-[var(--cream)] text-[var(--forest-deep)]">
      <SiteNav />

      {/* Header */}
      <section className="pt-40 pb-20 lg:pb-28 px-6 lg:px-10 text-center bg-[var(--forest-deep)] text-[var(--cream)] relative grain overflow-hidden">
        <div className="mx-auto max-w-4xl relative">
          <p className="eyebrow text-[var(--gold)]">The Menu</p>
          <h1 className="mt-6 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.95]">
            Hunger ends <span className="italic gold-text">here.</span>
          </h1>
          <Ornament className="w-48 mx-auto text-[var(--gold)] mt-10" />
          <p className="mt-8 max-w-xl mx-auto text-[var(--cream)]/70 leading-relaxed">
            100% halal ingredients. Freshly prepared every day.
          </p>
        </div>
      </section>

      {/* Section navigator — only once data is available */}
      {displaySections.length > 0 && !isError && <SectionNav sections={displaySections} />}

      {/* Menu body */}
      <div className="px-6 lg:px-10 py-20 lg:py-32">
        {isPending && <MenuSkeleton />}
        {isError && <MenuError onRetry={() => refetch()} isRetrying={isFetching} />}
        {data && !isError && (
          <>
            <MenuSections
              sections={displaySections}
              extras={menuExtras}
              onOpenExtras={setExtrasTarget}
            />
            <div className="mx-auto max-w-5xl mt-24 lg:mt-32">
              <SaucesBlock sauces={saucesQuery.data} isPending={saucesQuery.isPending} />
            </div>
          </>
        )}

        {/* CTA */}
        {data && !isError && (
          <div className="mx-auto max-w-5xl mt-32 text-center">
            <Ornament className="w-40 mx-auto text-[var(--gold)]" />
            <h3 className="mt-8 font-display text-[clamp(2rem,4vw,3rem)] text-[var(--forest-deep)]">
              Ready to order?
            </h3>
            <p className="mt-4 text-[var(--forest)]/70">Call us — we'll have it ready.</p>
            <a
              href={restaurant.phoneHref}
              className="mt-8 inline-flex items-center gap-3 bg-[var(--forest-deep)] text-[var(--cream)] eyebrow px-8 py-4 hover:bg-[var(--forest)] transition-colors"
            >
              {restaurant.phone}
            </a>
          </div>
        )}
      </div>

      <ExtrasModal
        open={extrasTarget != null}
        itemName={extrasTarget?.name ?? ""}
        baseId={extrasTarget?.id ?? ""}
        basePrice={extrasTarget?.price ?? 0}
        extras={menuExtras}
        onClose={() => setExtrasTarget(null)}
        onConfirm={(item) => {
          add(item);
          toast.success(`${item.name} added`, { duration: 1500 });
        }}
      />

      <SiteFooter />
    </div>
  );
}
