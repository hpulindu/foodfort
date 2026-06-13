import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Ornament } from "@/components/Ornament";
import heroCover from "@/assets/FoodFort_Cover.jpg";
import heroLogo from "@/assets/Hero Section Logo.png";
import butterChickenPizza from "@/assets/FoodFort_ButterChickenPizza.jpg";
import smashedBeefBurger from "@/assets/FoodFort_SmashedBeefBurger.jpg";
import chickenKebab from "@/assets/FoodFort_ChickenKebab.jpg";
import chickenLoadedFries from "@/assets/FoodFort_ChickenLoadedFries.jpg";
import mixedMeatBox from "@/assets/FoodFort_MixedMeatBox.jpg";
import spinachGozleme from "@/assets/FoodFort_SpinachGozleme.jpg";
import { restaurant } from "@/lib/menu-data";

const TICKER_ITEMS = [
  "100% Halal",
  "Freshly Prepared Daily",
  "Open Tue – Sun",
  "Bluff Point WA",
  "Hunger Ends Here",
];

function useReveal() {
  return useCallback((node: HTMLElement | null) => {
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      node.classList.add("is-visible");
      return;
    }
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { node.classList.add("is-visible"); io.unobserve(node); } },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );
    io.observe(node);
  }, []);
}

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
  { name: "Butter Chicken Pizza", price: "24", image: butterChickenPizza, blurb: "Butter chicken sauce, cheese, onion, chicken, tomato and goat cheese on a crisp base." },
  { name: "Smashed Beef Burger", price: "24", image: smashedBeefBurger, blurb: "Aged beef, melted cheese, caramelised onion on brioche." },
  { name: "Chicken Kebab", price: "16", image: chickenKebab, blurb: "Marinated chicken, fresh salad and house sauce in warm flatbread." },
  { name: "Chicken Loaded Fries", price: "16.99", image: chickenLoadedFries, blurb: "Crisp fries, peri chicken, molten cheese." },
];

function HomePage() {
  const manifestoReveal = useReveal();
  const pillarsReveal   = useReveal();
  const signaturesReveal = useReveal();
  const storyReveal     = useReveal();

  return (
    <div className="min-h-screen bg-[var(--cream)] text-[var(--forest-deep)]">
      <SiteNav />

      {/* HERO — main content + ticker share one viewport height */}
      <section className="relative hero-height flex flex-col overflow-hidden bg-[var(--forest-deep)]">

        {/* Mobile-only background image (desktop uses the right-column card instead) */}
        <div className="absolute inset-0 lg:hidden" aria-hidden>
          <img src={heroCover} alt="" className="w-full h-full object-cover opacity-50 slow-zoom" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--forest-deep)] via-[var(--forest-deep)]/55 to-[var(--forest-deep)]/15" />
        </div>

        {/* ── Grid: text left | photo right ── */}
        <div className="relative flex-1 min-h-0 grid lg:grid-cols-[45fr_55fr]">

          {/* LEFT: text content */}
          <div className="relative flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20 pt-16 sm:pt-20 pb-4 sm:pb-6 max-w-2xl lg:max-w-none">

            {/* Brand headline with castle logo */}
            <div className="flex items-center gap-5 sm:gap-7 lg:gap-8 fade-up">
              <img
                src={heroLogo}
                alt=""
                className="h-[clamp(7rem,16vw,13rem)] w-auto shrink-0"
                aria-hidden
              />
              <h1>
                <span className="block font-display text-[clamp(3.25rem,6.5vw,8rem)] leading-[0.88] text-[var(--cream)]">
                  Food
                </span>
                <span className="block font-display text-[clamp(3.25rem,6.5vw,8rem)] leading-[0.88] italic gold-text fade-up reveal-delay-1">
                  Fort
                </span>
                <span className="block font-display text-[clamp(1.25rem,1.9vw,2.1rem)] italic text-[var(--cream)]/40 mt-2 sm:mt-3 fade-up reveal-delay-2">
                  Hunger Ends Here
                </span>
              </h1>
            </div>

            {/* Description */}
            <p className="mt-4 sm:mt-6 max-w-[26rem] lg:max-w-[30rem] text-[var(--cream)]/55 text-sm sm:text-base leading-relaxed fade-up reveal-delay-2 hidden sm:block">
              Pizzas, kebabs, burgers, tacos and more, crafted with fresh
              ingredients, bold flavours, and a whole lot of heart. Every
              craving, conquered.
            </p>

            {/* CTA buttons — pill-shaped, matching the reference */}
            <div className="mt-5 sm:mt-7 flex flex-wrap items-center gap-3 sm:gap-4 fade-up reveal-delay-3">
              <Link
                to="/menu"
                className="group inline-flex items-center gap-2.5 bg-[var(--gold)] hover:bg-[var(--gold-soft)] text-[var(--gold-foreground)] eyebrow px-7 sm:px-8 py-3 sm:py-3.5 rounded-full transition-colors duration-200"
              >
                Order Now
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center eyebrow text-[var(--cream)]/70 border border-white/20 hover:border-white/40 px-7 sm:px-8 py-3 sm:py-3.5 rounded-full transition-colors duration-200"
              >
                View Menu
              </Link>
            </div>

            {/* Location + Phone */}
            <div className="mt-5 sm:mt-8 flex items-start gap-10 sm:gap-12 fade-up reveal-delay-3">
              <div>
                <p className="eyebrow text-[var(--cream)]/30 mb-1.5">Location</p>
                <p className="text-[var(--cream)]/65 text-sm sm:text-base">Bluff Point, WA</p>
              </div>
              <div>
                <p className="eyebrow text-[var(--cream)]/30 mb-1.5">Phone</p>
                <a
                  href={restaurant.phoneHref}
                  className="text-[var(--cream)]/65 text-sm sm:text-base hover:text-[var(--gold)] transition-colors"
                >
                  {restaurant.phone}
                </a>
              </div>
            </div>

          </div>

          {/* RIGHT: contained photo card */}
          <div className="hidden lg:flex items-center px-8 xl:px-12 pt-16 pb-4 fade-in reveal-delay-1">
            {/* Outer wrapper — overflow-visible so the floating badge can protrude */}
            <div className="relative w-full">

              {/* Photo card */}
              <div
                className="relative aspect-[4/3] rounded-2xl overflow-hidden"
                style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset" }}
              >
                <img
                  src={heroCover}
                  alt="Food Fort"
                  className="w-full h-full object-cover slow-zoom"
                />
                {/* Subtle bottom vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating badge — protrudes well outside the card on the left */}
              <div
                className="absolute bottom-8 -left-14 bg-[var(--gold)] px-5 py-4 max-w-[185px]"
                style={{ boxShadow: "0 12px 32px rgba(188,106,47,0.4)" }}
              >
                <p className="eyebrow text-white/55" style={{ fontSize: "0.57rem" }}>Where great taste</p>
                <p className="font-display italic text-white text-xl leading-tight mt-1">
                  Meets Fresh<br />Flavour
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Ticker strip — pinned to bottom of hero, always visible on load */}
        <div className="relative shrink-0 overflow-hidden border-t border-[var(--gold)]/15 py-2.5 sm:py-3">
          <div className="ticker-track" aria-hidden>
            {[0, 1].map(copy => (
              <span key={copy} className="flex items-center">
                {TICKER_ITEMS.map((item, i) => (
                  <span key={i} className="flex items-center gap-6 px-6 eyebrow text-[var(--cream)]/50 whitespace-nowrap">
                    {item}
                    <span className="text-[var(--gold)]/40">◆</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

      </section>

      {/* MANIFESTO */}
      <section ref={manifestoReveal} className="reveal py-32 lg:py-48 px-6 lg:px-10">
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
            cravings, generous, honest food made with care, never shortcuts.
          </p>
        </div>
      </section>

      {/* PILLARS */}
      <section ref={pillarsReveal} className="reveal px-6 lg:px-10 pb-32 lg:pb-48">
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
      <section ref={signaturesReveal} className="reveal bg-[var(--forest-deep)] text-[var(--cream)] py-32 lg:py-48 relative overflow-hidden grain">
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
              <article key={s.name} className="group cursor-pointer">
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
      <section ref={storyReveal} className="reveal py-32 lg:py-48 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-6 relative lg:pb-12">
            <div className="aspect-[4/5] overflow-hidden">
              <img src={mixedMeatBox} alt="Mixed meat box with rice and salad" loading="lazy" className="w-full h-full object-cover" />
            </div>
            <div className="hidden lg:block absolute -bottom-4 -right-12 w-64 aspect-square overflow-hidden border-8 border-[var(--cream)]">
              <img src={spinachGozleme} alt="Spinach gozleme" loading="lazy" className="w-full h-full object-cover" />
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
              real, fresh food, the way it ought to be.
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
                className="inline-flex items-center gap-3 bg-[var(--gold)] text-[var(--gold-foreground)] eyebrow px-8 py-4 hover:bg-[var(--gold-soft)] transition-colors"
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
