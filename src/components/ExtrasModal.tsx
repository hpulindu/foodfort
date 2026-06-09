import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { MenuItem } from "@/lib/menu-data";
import {
  buildCartItemId,
  cartItemUnitPrice,
  formatCartItemName,
  formatPrice,
  type CartExtra,
} from "@/lib/cart";

type ExtrasModalProps = {
  open: boolean;
  itemName: string;
  baseId: string;
  basePrice: number;
  extras: MenuItem[];
  onClose: () => void;
  onConfirm: (payload: {
    id: string;
    name: string;
    baseName: string;
    price: number;
    extras: CartExtra[];
  }) => void;
};

function isAvailable(available?: boolean) {
  return available !== false;
}

export function ExtrasModal({
  open,
  itemName,
  baseId,
  basePrice,
  extras,
  onClose,
  onConfirm,
}: ExtrasModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<CartExtra[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const availableExtras = useMemo(
    () => extras.filter((e) => isAvailable(e.available)),
    [extras],
  );

  const unitPrice = useMemo(
    () => cartItemUnitPrice(basePrice, selected),
    [basePrice, selected],
  );

  function toggleExtra(extra: MenuItem) {
    const id = `extras-${extra.name}`;
    const price = parseFloat(extra.price);
    setSelected((current) => {
      const exists = current.some((e) => e.id === id);
      if (exists) return current.filter((e) => e.id !== id);
      return [...current, { id, name: extra.name, price }];
    });
  }

  function handleConfirm() {
    onConfirm({
      id: buildCartItemId(baseId, selected),
      name: formatCartItemName(itemName, selected),
      baseName: itemName,
      price: unitPrice,
      extras: selected,
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
        aria-labelledby="extras-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--gold)]/20 px-6 py-5">
          <div>
            <p className="eyebrow text-[var(--gold)]">Add extras</p>
            <h2 id="extras-modal-title" className="font-display text-2xl mt-1">
              {itemName}
            </h2>
            <p className="mt-1 text-sm text-[var(--forest)]/60">
              Optional — select any extras for this item.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close extras"
            className="p-2 hover:text-[var(--gold)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3 max-h-[50vh] overflow-y-auto">
          {availableExtras.length === 0 ? (
            <p className="text-sm text-[var(--forest)]/60">No extras available right now.</p>
          ) : (
            availableExtras.map((extra) => {
              const id = `extras-${extra.name}`;
              const active = selected.some((e) => e.id === id);
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
            })
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
              className="eyebrow bg-[var(--forest-deep)] text-[var(--cream)] px-4 py-3 hover:bg-[var(--forest)] transition-colors"
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
