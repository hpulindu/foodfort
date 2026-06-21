import type { RefCallback } from "react";
import { Ornament } from "@/components/Ornament";
import pillarIconComfort from "@/assets/FoodFort_PillarIcon_Comfort.png";
import pillarIconCraving from "@/assets/FoodFort_PillarIcon_Craving.png";
import pillarIconQuality from "@/assets/FoodFort_PillarIcon_Quality.png";

const PILLARS = [
  {
    kicker: "01",
    title: "Flavour that comforts",
    body: "Recipes refined over years, the warm, familiar food you crave.",
    icon: pillarIconComfort,
    iconClass: "h-7 w-7",
  },
  {
    kicker: "02",
    title: "For every craving",
    body: "Pizzas, kebabs, gozleme, tacos, burgers. One kitchen. No compromises.",
    icon: pillarIconCraving,
    iconClass: "h-6 w-8",
  },
  {
    kicker: "03",
    title: "Quality you can taste",
    body: "100% halal, freshly prepared daily. Real ingredients only.",
    icon: pillarIconQuality,
    iconClass: "h-8 w-8",
  },
] as const;

function PillarIconBadge({ src, iconClass }: { src: string; iconClass: string }) {
  return (
    <div
      className="absolute -top-7 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--secondary)]"
      aria-hidden
    >
      <img src={src} alt="" className={`${iconClass} object-contain`} />
    </div>
  );
}

type PromiseSectionProps = {
  revealRef: RefCallback<HTMLElement>;
};

export function PromiseSection({ revealRef }: PromiseSectionProps) {
  return (
    <section ref={revealRef} className="reveal py-32 lg:py-48 px-6 lg:px-10">
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

      <div className="mx-auto max-w-7xl w-full mt-16 lg:mt-24 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-[auto_auto_1fr] gap-12 md:gap-x-10 lg:gap-x-16 md:gap-y-0">
          {PILLARS.map((p) => (
            <div
              key={p.kicker}
              className="relative grid w-full grid-rows-[auto_auto_1fr] gap-y-4 px-8 pb-12 pt-10 text-center sm:px-10 md:row-span-3 md:grid-rows-subgrid lg:px-12 lg:pb-16 lg:pt-11"
            >
              <div className="flex justify-center">
                <PillarIconBadge src={p.icon} iconClass={p.iconClass} />
              </div>
              <h3 className="font-display flex w-full items-start justify-center self-start text-2xl leading-snug text-[var(--forest-deep)]">
                {p.title}
              </h3>
              <p className="max-w-xs justify-self-center text-sm leading-relaxed text-[var(--forest)]/75">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
