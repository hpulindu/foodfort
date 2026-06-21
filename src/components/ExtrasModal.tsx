import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { MenuItem, MenuItemVariant, Sauce } from "@/lib/menu-data";
import {
  buildCartItemId,
  cartItemUnitPrice,
  formatCartItemName,
  formatPrice,
  type CartExtra,
} from "@/lib/cart";
import {
  getMaxSauces,
  itemAllowsSauceSelection,
  itemHasVariants,
  sauceToCartModifier,
  variantToCartModifier,
} from "@/lib/menu-item-options";
import { supportsExtras } from "@/lib/menu-config";

type ItemCustomizeModalProps = {
  open: boolean;
  item: MenuItem;
  baseId: string;
  sectionId: string;
  sauces: Sauce[];
  extras: MenuItem[];
  onClose: () => void;
  onConfirm: (payload: {
    id: string;
    name: string;
    baseName: string;
    price: number;
    extras: CartExtra[];
    variant?: CartExtra;
    sauces?: CartExtra[];
  }) => void;
};

function isAvailable(available?: boolean) {
  return available !== false;
}

export function ItemCustomizeModal({
  open,
  item,
  baseId,
  sectionId,
  sauces,
  extras,
  onClose,
  onConfirm,
}: ItemCustomizeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | null>(null);
  const [selectedSauces, setSelectedSauces] = useState<CartExtra[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<CartExtra[]>([]);

  const hasVariants = itemHasVariants(item);
  const allowsSauces = itemAllowsSauceSelection(item);
  const maxSauces = getMaxSauces(item.sauceSelection);
  const canPickExtras = supportsExtras(sectionId);

  const availableSauces = useMemo(
    () => sauces.filter((s) => isAvailable(s.available)),
    [sauces],
  );
  const availableExtras = useMemo(
    () => (canPickExtras ? extras.filter((e) => isAvailable(e.available)) : []),
    [canPickExtras, extras],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSelectedVariant(null);
      setSelectedSauces([]);
      setSelectedExtras([]);
      return;
    }
    setSelectedVariant(item.variants?.[0] ?? null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, item]);

  const basePrice = parseFloat(item.price);
  const variantMod = selectedVariant ? variantToCartModifier(selectedVariant) : undefined;
  const unitPrice = useMemo(
    () => cartItemUnitPrice(basePrice, selectedExtras, variantMod, selectedSauces),
    [basePrice, selectedExtras, variantMod, selectedSauces],
  );

  function toggleSauce(sauce: Sauce) {
    const mod = sauceToCartModifier(sauce);
    setSelectedSauces((current) => {
      const exists = current.some((s) => s.id === mod.id);
      if (exists) return current.filter((s) => s.id !== mod.id);
      if (current.length >= maxSauces) return current;
      return [...current, mod];
    });
  }

  function toggleExtra(extra: MenuItem) {
    const id = `extras-${extra.name}`;
    const price = parseFloat(extra.price);
    setSelectedExtras((current) => {
      const exists = current.some((e) => e.id === id);
      if (exists) return current.filter((e) => e.id !== id);
      return [...current, { id, name: extra.name, price }];
    });
  }

  function handleConfirm() {
    if (hasVariants && !selectedVariant) return;

    const variant = selectedVariant ? variantToCartModifier(selectedVariant) : undefined;
    const saucesSelected = allowsSauces ? selectedSauces : [];

    onConfirm({
      id: buildCartItemId(baseId, selectedExtras, variant, saucesSelected),
      name: formatCartItemName(item.name, selectedExtras, variant, saucesSelected),
      baseName: item.name,
      price: unitPrice,
      extras: selectedExtras,
      variant,
      sauces: saucesSelected.length ? saucesSelected : undefined,
    });
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[80] bg-black/60 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`fixed inset-x-4 top-1/2 z-[90] mx-auto max-w-md -translate-y-1/2 bg-[var(--cream)] text-[var(--forest-deep)] shadow-2xl transition-all ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--gold)]/20 px-6 py-5">
          <div>
            <p className="eyebrow text-[var(--gold)]">Customize</p>
            <h2 id="customize-modal-title" className="font-display text-2xl mt-1">
              {item.name}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:text-[var(--gold)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[55vh] overflow-y-auto">
          {hasVariants && (
            <div className="space-y-2">
              <p className="eyebrow text-[var(--forest)]/70">Choose size / option</p>
              <div className="space-y-2">
                {item.variants!.map((variant) => {
                  const active = selectedVariant?.name === variant.name;
                  return (
                    <button
                      key={variant.id ?? variant.name}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full flex items-center justify-between gap-4 border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-[var(--forest-deep)] bg-[var(--forest-deep)] text-[var(--cream)]"
                          : "border-[var(--gold)]/30 hover:border-[var(--forest-deep)]"
                      }`}
                    >
                      <span className="font-display text-lg">{variant.name}</span>
                      <span className={`eyebrow text-xs ${active ? "text-[var(--gold)]" : "text-[var(--forest)]/60"}`}>
                        {formatPrice(variant.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {allowsSauces && (
            <div className="space-y-2">
              <p className="eyebrow text-[var(--forest)]/70">
                Choose sauces (up to {maxSauces})
              </p>
              {availableSauces.length === 0 ? (
                <p className="text-sm text-[var(--forest)]/60">No sauces available right now.</p>
              ) : (
                <div className="space-y-2">
                  {availableSauces.map((sauce) => {
                    const mod = sauceToCartModifier(sauce);
                    const active = selectedSauces.some((s) => s.id === mod.id);
                    const disabled = !active && selectedSauces.length >= maxSauces;
                    return (
                      <button
                        key={sauce.name}
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleSauce(sauce)}
                        className={`w-full flex items-center justify-between gap-4 border px-4 py-3 text-left transition-colors disabled:opacity-40 ${
                          active
                            ? "border-[var(--forest-deep)] bg-[var(--forest-deep)] text-[var(--cream)]"
                            : "border-[var(--gold)]/30 hover:border-[var(--forest-deep)]"
                        }`}
                      >
                        <span className="font-display text-lg">{sauce.name}</span>
                        <span className={`eyebrow text-xs ${active ? "text-[var(--gold)]" : "text-[var(--forest)]/60"}`}>
                          {parseFloat(sauce.price) > 0 ? formatPrice(parseFloat(sauce.price)) : "Free"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {canPickExtras && availableExtras.length > 0 && (
            <div className="space-y-2">
              <p className="eyebrow text-[var(--forest)]/70">Optional extras</p>
              <div className="space-y-2">
                {availableExtras.map((extra) => {
                  const id = `extras-${extra.name}`;
                  const active = selectedExtras.some((e) => e.id === id);
                  return (
                    <button
                      key={extra.name}
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`w-full flex items-center justify-between gap-4 border px-4 py-3 text-left transition-colors ${
                        active
                          ? "border-[var(--forest-deep)] bg-[var(--forest-deep)] text-[var(--cream)]"
                          : "border-[var(--gold)]/30 hover:border-[var(--forest-deep)]"
                      }`}
                    >
                      <span className="font-display text-lg">{extra.name}</span>
                      <span className={`eyebrow text-xs ${active ? "text-[var(--gold)]" : "text-[var(--forest)]/60"}`}>
                        +{formatPrice(parseFloat(extra.price))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[var(--gold)]/20 px-6 py-5">
          <div className="flex items-baseline justify-between mb-4">
            <span className="eyebrow text-[var(--forest)]/70">Item total</span>
            <span className="font-display text-2xl">{formatPrice(unitPrice)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="eyebrow border border-[var(--gold)]/30 px-4 py-3 hover:border-[var(--forest-deep)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={hasVariants && !selectedVariant}
              className="eyebrow bg-[var(--forest-deep)] text-[var(--cream)] px-4 py-3 hover:bg-[var(--forest)] transition-colors disabled:opacity-50"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

/** @deprecated Use ItemCustomizeModal */
export const ExtrasModal = ItemCustomizeModal;
