import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Ornament } from "@/components/Ornament";
import heroPizza from "@/assets/hero-pizza.jpg";
import dishKebab from "@/assets/dish-kebab.jpg";
import dishFries from "@/assets/dish-fries.jpg";
import bbqPizza from "@/assets/BBQ pizza img.png";
import smashedBurger from "@/assets/Smashed Beef Burger.png";
import { restaurant } from "@/lib/menu-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Food Fort · Hunger Ends Here · Bluff Point WA" },
      { name: "description", content: "Wood-fired pizzas, hand-rolled kebabs and smashed burgers. 100% halal, freshly prepared in Bluff Point, Geraldton." },
      { property: "og:title", content: "Food Fort · Hunger Ends Here" },
      { property: "og:description", content: "Wood-fired pizzas, hand-rolled kebabs and smashed burgers in Bluff Point, WA." },
    ],
  }),
  component: HomePage,
});

const signatures = [
  { name: "BBQ Chicken Pizza", price: "24", image: bbqPizza, blurb: "Slow-marinated chicken, smoky BBQ, blistered crust." },
  { name: "Smashed Beef Burger", price: "24", image: smashedBurger, blurb: "Aged beef, melted cheese, caramelised onion on brioche." },
  { name: "Mixed Kebab", price: "19", image: dishKebab, blurb: "Doner and chicken, fresh herbs, warm flatbread." },
  { name: "Chicken Loaded Fries", price: "16.99", image: dishFries, blurb: "Crisp fries, peri chicken, molten cheese." },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--cream)] text-[var(--forest-deep)]">
      <SiteNav />

      {/* HERO */}
      <section className="relative min-h-screen flex items-end overflow-hidden bg-[var(--forest-deep)]">
        <div className="absolute inset-0">
          <img
            src={heroPizza}
            alt=""
            className="w-full h-full object-cover opacity-65 slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-deep)] via-[var(--forest-deep)]/55 to-[var(--forest-deep)]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--forest-deep)]/70 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pb-24 lg:pb-32 pt-40 w-full">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 fade-in">
              <span className="h-px w-12 bg-[var(--gold)]" />
              <span className="eyebrow text-[var(--gold)]">Est. Bluff Point · WA</span>
            </div>

            <h1 className="mt-8 font-display text-[clamp(3.5rem,9vw,8rem)] leading-[0.92] text-[var(--cream)] fade-up">
              Where great taste<br />
              meets <span className="italic gold-text">fresh flavour.</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg text-[var(--cream)]/75 leading-relaxed fade-up reveal-delay-2">
              Wood-fired pizzas, hand-rolled kebabs and smashed burgers — prepared
              fresh each day with 100% halal ingredients.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-6 fade-up reveal-delay-3">
              <Link
                to="/menu"
                className="group inline-flex items-center gap-3 bg-[var(--gold)] hover:bg-[var(--gold-soft)] text-[var(--forest-deep)] eyebrow px-8 py-4 transition-all duration-300"
              >
                View the Menu
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href={restaurant.phoneHref}
                className="eyebrow text-[var(--cream)] border-b border-[var(--gold)]/60 pb-1 hover:text-[var(--gold)] transition-colors"
              >
                Call to order · {restaurant.phone}
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 hidden lg:flex flex-col items-center gap-3 fade-in reveal-delay-4">
          <span className="eyebrow text-[var(--cream)]/50 rotate-90 origin-center translate-y-6">Scroll</span>
          <span className="h-12 w-px bg-[var(--cream)]/30" />
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="py-32 lg:py-48 px-6 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <Ornament className="w-40 mx-auto text-[var(--gold)]" />
          <p className="eyebrow text-[var(--forest)] mt-8">The Food Fort Promise</p>
          <h2 className="mt-8 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-tight text-[var(--forest-deep)]">
            A neighbourhood kitchen built on{" "}
            <span className="italic text-[var(--forest)]">flavour that comforts</span>{" "}
            and quality you can taste.
          </h2>
          <p className="mt-10 max-w-2xl mx-auto text-lg leading-relaxed text-[var(--forest)]/80">
            Every dough is proved on site. Every sauce simmered slow. We cook for
            cravings — generous, honest food made with care, never shortcuts.
          </p>
        </div>
      </section>

      {/* PILLARS */}
      <section className="px-6 lg:px-10 pb-32 lg:pb-48">
        <div className="mx-auto max-w-7xl grid md:grid-cols-3 gap-px bg-[var(--gold)]/30 border border-[var(--gold)]/30">
          {[
            { kicker: "01", title: "Flavour that comforts", body: "Recipes refined over years — the warm, familiar food you crave." },
            { kicker: "02", title: "For every craving", body: "Pizzas, kebabs, gozleme, tacos, burgers. One kitchen. No compromises." },
            { kicker: "03", title: "Quality you can taste", body: "100% halal, freshly prepared daily. Real ingredients only." },
          ].map((p) => (
            <div key={p.kicker} className="bg-[var(--cream)] p-12 lg:p-16">
              <span className="font-display text-5xl text-[var(--gold)]">{p.kicker}</span>
              <h3 className="mt-6 font-display text-2xl text-[var(--forest-deep)]">{p.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--forest)]/75">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SIGNATURES */}
      <section className="bg-[var(--forest-deep)] text-[var(--cream)] py-32 lg:py-48 relative overflow-hidden grain">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 relative">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-20">
            <div>
              <p className="eyebrow text-[var(--gold)]">Signatures</p>
              <h2 className="mt-6 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-tight max-w-2xl">
                The dishes our regulars come back for.
              </h2>
            </div>
            <Link
              to="/menu"
              className="eyebrow text-[var(--gold)] border-b border-[var(--gold)]/40 pb-1 hover:border-[var(--gold)] self-start"
            >
              See the full menu →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {signatures.map((s) => (
              <article key={s.name} className="group">
                <div className="aspect-[4/5] overflow-hidden bg-[var(--forest)]">
                  <img
                    src={s.image}
                    alt={s.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  />
                </div>
                <div className="mt-6 flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-xl text-[var(--cream)]">{s.name}</h3>
                  <span className="font-display text-lg text-[var(--gold)]">${s.price}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--cream)]/60 leading-relaxed">{s.blurb}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* STORY / SPLIT */}
      <section className="py-32 lg:py-48 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-6 relative">
            <div className="aspect-[4/5] overflow-hidden">
              <img src={smashedBurger} alt="Smashed beef burger on brioche" loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="hidden lg:block absolute -bottom-12 -right-12 w-64 aspect-square overflow-hidden border-8 border-[var(--cream)]">
              <img src={dishKebab} alt="" loading="lazy" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <p className="eyebrow text-[var(--forest)]">Our Story</p>
            <h2 className="mt-6 font-display text-[clamp(2.25rem,4vw,3.5rem)] leading-tight text-[var(--forest-deep)]">
              A fortress of flavour on Chapman Road.
            </h2>
            <Ornament className="w-32 text-[var(--gold)] mt-8" />
            <p className="mt-8 text-base leading-relaxed text-[var(--forest)]/80">
              Food Fort began with a simple idea: comfort food, done properly. From
              hand-stretched pizza dough to slow-marinated kebab meats, every dish
              earns its place on the menu.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[var(--forest)]/80">
              No frozen shortcuts. No tired classics. Just generous portions of
              real, fresh food — the way it ought to be.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-8">
              <div>
                <p className="font-display text-4xl text-[var(--gold)]">100%</p>
                <p className="eyebrow text-[var(--forest)]/60 mt-2">Halal ingredients</p>
              </div>
              <div>
                <p className="font-display text-4xl text-[var(--gold)]">Daily</p>
                <p className="eyebrow text-[var(--forest)]/60 mt-2">Fresh preparation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VISIT BAND */}
      <section className="bg-[var(--forest)] text-[var(--cream)] py-24 lg:py-32 relative grain overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative">
          <div>
            <p className="eyebrow text-[var(--gold)]">Visit Food Fort</p>
            <h2 className="mt-6 font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight">
              Find us in Bluff Point.
            </h2>
            <p className="mt-6 text-[var(--cream)]/75 max-w-md leading-relaxed">
              {restaurant.address}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={restaurant.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 bg-[var(--gold)] text-[var(--forest-deep)] eyebrow px-8 py-4 hover:bg-[var(--gold-soft)] transition-colors"
              >
                Get directions →
              </a>
              <Link
                to="/visit"
                className="inline-flex items-center eyebrow text-[var(--cream)] border-b border-[var(--gold)]/50 pb-1 hover:text-[var(--gold)] transition-colors"
              >
                Hours & contact
              </Link>
            </div>
          </div>

          <div className="space-y-8">
            {restaurant.hours.map((h) => (
              <div key={h.day} className="flex items-baseline justify-between border-b border-[var(--gold)]/20 pb-4">
                <span className="font-display text-2xl">{h.day}</span>
                <span className="eyebrow text-[var(--gold)]">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
