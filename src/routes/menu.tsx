import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Ornament } from "@/components/Ornament";
import { menu, sauces, restaurant } from "@/lib/menu-data";

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

function MenuPage() {
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

      {/* Section navigator */}
      <nav className="sticky top-20 z-40 bg-[var(--cream)]/95 backdrop-blur border-b border-[var(--gold)]/20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 py-4 flex gap-6 overflow-x-auto eyebrow text-[var(--forest)]/70 scrollbar-thin">
          {menu.map(s => (
            <a key={s.id} href={`#${s.id}`} className="whitespace-nowrap hover:text-[var(--forest-deep)] transition-colors">
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      {/* Menu sections */}
      <div className="px-6 lg:px-10 py-20 lg:py-32">
        <div className="mx-auto max-w-5xl space-y-24 lg:space-y-32">
          {menu.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-40">
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
                {section.items.map((item) => (
                  <li key={item.name} className="py-6 lg:py-7 grid grid-cols-[1fr_auto] gap-6 items-baseline group">
                    <div>
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
                    <div className="flex items-baseline gap-3 whitespace-nowrap">
                      <span className="hidden sm:block w-16 lg:w-32 border-b border-dotted border-[var(--gold)]/40 mb-1.5" />
                      <span className="font-display text-xl text-[var(--forest-deep)]">${item.price}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {/* Sauces */}
          <section id="sauces" className="scroll-mt-40">
            <header className="flex items-baseline gap-6 mb-12">
              <span className="font-display text-3xl text-[var(--gold)]">12</span>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] text-[var(--forest-deep)]">Sauces</h2>
            </header>
            <div className="flex flex-wrap gap-x-6 gap-y-3 font-display text-lg lg:text-xl text-[var(--forest-deep)]">
              {sauces.map((s, i) => (
                <span key={s} className="flex items-center gap-6">
                  {s}
                  {i < sauces.length - 1 && <span className="text-[var(--gold)]">·</span>}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* CTA */}
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
      </div>

      <SiteFooter />
    </div>
  );
}
