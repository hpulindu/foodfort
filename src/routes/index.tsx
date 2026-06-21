import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Ornament } from "@/components/Ornament";
import { PromiseSection } from "@/components/PromiseSection";
import { SignaturesSection } from "@/components/SignaturesSection";
import heroCover from "@/assets/FoodFort_Cover.jpg";
import heroLogo from "@/assets/Hero Section Logo.png";
import mixedMeatBox from "@/assets/FoodFort_MixedMeatBox.jpg";
import spinachGozleme from "@/assets/FoodFort_SpinachGozleme.jpg";
import tuesdaySpecialPoster from "@/assets/FoodFort_TuesdaySpecialPoster.png";
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

function HomePage() {
  const manifestoReveal = useReveal();
  const specialsReveal  = useReveal();
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

      <PromiseSection revealRef={manifestoReveal} />

      {/* TUESDAY SPECIALS */}
      <section ref={specialsReveal} className="reveal bg-white py-24 lg:py-36 px-6 lg:px-10">
        <div className="mx-auto max-w-7xl grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 xl:gap-24 items-center">
          {/* Poster + testimonial */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none pb-16 sm:pb-20 lg:pb-0">
            <div className="relative">
              <div
                className="relative bg-[var(--secondary)]"
                style={{ boxShadow: "0 24px 48px rgba(15,16,18,0.12), 0 0 0 1px rgba(188,106,47,0.08) inset" }}
              >
                <img
                  src={tuesdaySpecialPoster}
                  alt="Food Fort Tuesday Surprise Special poster"
                  loading="lazy"
                  className="w-full h-auto object-contain"
                />
              </div>

              <blockquote
                className="absolute bottom-0 left-1/2 z-10 w-[88%] max-w-[320px] -translate-x-1/2 translate-y-[72%] bg-[var(--cream)] border border-[var(--gold)]/20 px-4 py-3.5 text-center lg:bottom-0 lg:left-auto lg:right-0 lg:w-[175px] lg:max-w-[260px] lg:translate-x-[60%] lg:translate-y-[60%] lg:text-left lg:px-4 lg:py-3.5"
                style={{ boxShadow: "0 16px 40px rgba(15,16,18,0.1)" }}
              >
                <p className="font-display italic text-[var(--forest-deep)] text-sm leading-snug lg:text-[0.8125rem]">
                  &ldquo;Always a delightful surprise, highly recommend dropping by on a Tuesday!&rdquo;
                </p>
              </blockquote>
            </div>
          </div>

          {/* Copy */}
          <div className="lg:pl-4 mt-1 sm:mt-2 lg:mt-0 pt-2 sm:pt-3 lg:pt-0">
            <span className="eyebrow text-[var(--gold)]">
              Every Tuesday
            </span>

            <h2 className="mt-6 font-display text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.05] text-[var(--forest-deep)]">
              Tuesday Surprise Special
            </h2>

            <p className="mt-3 font-display text-xl sm:text-2xl italic text-[var(--gold)]">
              A new special every week
            </p>

            <p className="mt-8 text-base sm:text-lg leading-relaxed text-[var(--forest)]/80 max-w-lg">
              Every Tuesday, Food Fort serves a rotating special that changes weekly.
              From customer favourites to limited-time chef picks, there is always
              something different to try. Visit us in-store to see what&apos;s cooking
              this week.
            </p>

            <div className="mt-10 flex flex-col items-start gap-4">
              <Link
                to="/visit"
                className="group inline-flex items-center gap-2.5 bg-[var(--gold)] hover:bg-[var(--gold-soft)] text-[var(--gold-foreground)] eyebrow px-8 py-4 rounded-full transition-colors duration-200 cursor-pointer"
              >
                Visit Us Today
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </Link>
              <p className="eyebrow text-[var(--forest)]/45 text-[0.62rem] tracking-[0.28em]">
                Available every Tuesday, while stocks last
              </p>
            </div>
          </div>
        </div>
      </section>

      <SignaturesSection revealRef={signaturesReveal} />

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
