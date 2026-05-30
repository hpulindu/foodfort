import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Ornament } from "@/components/Ornament";
import { restaurant } from "@/lib/menu-data";

export const Route = createFileRoute("/visit")({
  head: () => ({
    meta: [
      { title: "Visit · Food Fort · Bluff Point WA" },
      { name: "description", content: `Find Food Fort at ${restaurant.address}. Opening hours, phone and directions.` },
      { property: "og:title", content: "Visit Food Fort" },
      { property: "og:description", content: `${restaurant.address}. Open daily.` },
    ],
  }),
  component: VisitPage,
});

function VisitPage() {
  return (
    <div className="min-h-screen bg-[var(--cream)] text-[var(--forest-deep)]">
      <SiteNav />

      <section className="pt-40 pb-24 px-6 lg:px-10 bg-[var(--forest-deep)] text-[var(--cream)] grain relative overflow-hidden">
        <div className="mx-auto max-w-4xl text-center">
          <p className="eyebrow text-[var(--gold)]">Find Us</p>
          <h1 className="mt-6 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.95]">
            Visit <span className="italic gold-text">Food Fort.</span>
          </h1>
          <Ornament className="w-40 mx-auto text-[var(--gold)] mt-8" />
        </div>
      </section>

      <section className="py-24 lg:py-32 px-6 lg:px-10">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="space-y-12">
            <div>
              <p className="eyebrow text-[var(--gold)]">Address</p>
              <p className="mt-4 font-display text-2xl lg:text-3xl leading-snug">
                {restaurant.address}
              </p>
              <a
                href={restaurant.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-3 bg-[var(--forest-deep)] text-[var(--cream)] eyebrow px-7 py-3.5 hover:bg-[var(--forest)] transition-colors"
              >
                Open in Maps →
              </a>
            </div>

            <div>
              <p className="eyebrow text-[var(--gold)]">Contact</p>
              <div className="mt-4 space-y-3">
                <a href={restaurant.phoneHref} className="block font-display text-2xl hover:text-[var(--gold)] transition-colors">
                  {restaurant.phone}
                </a>
                <a href={`mailto:${restaurant.email}`} className="block font-display text-xl text-[var(--forest)] hover:text-[var(--gold)] transition-colors">
                  {restaurant.email}
                </a>
              </div>
            </div>

            <div>
              <p className="eyebrow text-[var(--gold)]">Hours</p>
              <div className="mt-4 space-y-4">
                {restaurant.hours.map(h => (
                  <div key={h.day} className="flex justify-between items-baseline border-b border-[var(--gold)]/25 pb-3">
                    <span className="font-display text-xl">{h.day}</span>
                    <span className="eyebrow text-[var(--forest)]/80">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="aspect-square lg:aspect-auto lg:min-h-[600px] overflow-hidden border border-[var(--gold)]/30">
            <iframe
              title="Food Fort location"
              src="https://www.google.com/maps?q=Shop+6%2F429+Chapman+Rd%2C+Bluff+Point+WA+6530&output=embed"
              className="w-full h-full grayscale-[0.3]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
