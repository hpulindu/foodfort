import { useMemo, useState, type RefCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ItemCustomizeModal } from "@/components/ExtrasModal";
import butterChickenPizza from "@/assets/FoodFort_ButterChickenPizza.jpg";
import smashedBeefBurger from "@/assets/FoodFort_SmashedBeefBurger.jpg";
import chickenKebab from "@/assets/FoodFort_ChickenKebab.jpg";
import chickenLoadedFries from "@/assets/FoodFort_ChickenLoadedFries.jpg";
import type { MenuItem } from "@/lib/menu-data";
import { fetchMenu, fetchSauces, findMenuItemByName } from "@/lib/menu-api";
import { getExtrasFromMenu } from "@/lib/menu-config";
import { getMenuItemDisplayPrice } from "@/lib/menu-item-options";
import {
  addMenuItemOrCustomize,
  menuItemCartId,
  type MenuItemCartTarget,
} from "@/lib/menu-item-cart";
import { useCart } from "@/lib/cart";

type SignatureEntry = {
  name: string;
  /** Alternate menu names when display title differs from Firestore */
  menuNames?: string[];
  price: string;
  image: string;
  blurb: string;
};

const SIGNATURES: SignatureEntry[] = [
  {
    name: "Butter Chicken Pizza",
    menuNames: ["Butter Chicken"],
    price: "24",
    image: butterChickenPizza,
    blurb: "Butter chicken sauce, cheese, onion, chicken, tomato and goat cheese on a crisp base.",
  },
  {
    name: "Smashed Beef Burger",
    price: "24",
    image: smashedBeefBurger,
    blurb: "Aged beef, melted cheese, caramelised onion on brioche.",
  },
  {
    name: "Chicken Kebab",
    price: "16",
    image: chickenKebab,
    blurb: "Marinated chicken, fresh salad and house sauce in warm flatbread.",
  },
  {
    name: "Chicken Loaded Fries",
    price: "16.99",
    image: chickenLoadedFries,
    blurb: "Crisp fries, peri chicken, molten cheese.",
  },
];

function isAvailable(available?: boolean) {
  return available !== false;
}

type SignaturesSectionProps = {
  revealRef: RefCallback<HTMLElement>;
};

export function SignaturesSection({ revealRef }: SignaturesSectionProps) {
  const { add } = useCart();
  const [customizeTarget, setCustomizeTarget] = useState<MenuItemCartTarget | null>(null);

  const menuQuery = useQuery({
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
    () => (menuQuery.data ? getExtrasFromMenu(menuQuery.data) : []),
    [menuQuery.data],
  );

  const menuReady = menuQuery.isSuccess && !!menuQuery.data;

  function resolveSignature(s: SignatureEntry) {
    if (!menuQuery.data) return null;
    return findMenuItemByName(menuQuery.data, s.name, s.menuNames ?? []);
  }

  return (
    <>
      <section
        ref={revealRef}
        className="reveal bg-[var(--forest-deep)] text-[var(--cream)] py-32 lg:py-48 relative overflow-hidden grain"
      >
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
              className="eyebrow text-[var(--gold)] border-b border-[var(--gold)]/40 pb-1 hover:border-[var(--gold)] self-start transition-colors"
            >
              See the full menu →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {SIGNATURES.map((s) => {
              const match = resolveSignature(s);
              const item: MenuItem | null = match?.item ?? null;
              const sectionId = match?.sectionId ?? "";
              const id = match ? menuItemCartId(sectionId, item!.name) : "";
              const displayPrice = item ? getMenuItemDisplayPrice(item) : `$${s.price}`;
              const soldOut = item ? !isAvailable(item.available) : false;
              const canAdd = menuReady && !!match && !soldOut;

              return (
                <article key={s.name} className="group flex flex-col">
                  <div className="aspect-[4/5] overflow-hidden bg-[var(--forest)]">
                    <img
                      src={s.image}
                      alt={s.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />
                  </div>

                  <div className="mt-6 flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-xl text-[var(--cream)]">{s.name}</h3>
                    <span className="font-display text-lg text-[var(--gold)] shrink-0">
                      {displayPrice}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[var(--cream)]/60 leading-relaxed flex-1">
                    {s.blurb}
                  </p>

                  <div className="mt-5">
                    {soldOut ? (
                      <span className="eyebrow text-xs text-[var(--cream)]/40 border border-[var(--cream)]/20 px-3 py-2 inline-block">
                        Sold out
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAdd && !menuQuery.isError}
                        onClick={() => {
                          if (!menuReady || !match || !item) {
                            toast.error("Menu still loading — please try again.");
                            return;
                          }

                          addMenuItemOrCustomize({
                            target: { id, item, sectionId },
                            extrasCount: menuExtras.length,
                            add,
                            onCustomize: setCustomizeTarget,
                          });
                        }}
                        aria-label={`Add ${s.name} to cart`}
                        className="inline-flex items-center gap-1.5 eyebrow text-xs text-[var(--gold-foreground)] bg-[var(--gold)] hover:bg-[var(--gold-soft)] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 transition-colors duration-200 cursor-pointer"
                      >
                        {menuQuery.isPending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Loading
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add to cart
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {customizeTarget && (
        <ItemCustomizeModal
          open
          item={customizeTarget.item}
          baseId={customizeTarget.id}
          sectionId={customizeTarget.sectionId}
          sauces={saucesQuery.data ?? []}
          extras={menuExtras}
          onClose={() => setCustomizeTarget(null)}
          onConfirm={(cartItem) => {
            add(cartItem);
            toast.success(`${cartItem.name} added`, { duration: 1500 });
            setCustomizeTarget(null);
          }}
        />
      )}
    </>
  );
}
