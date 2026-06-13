import { Link } from "@tanstack/react-router";
import { AlertCircle, ShoppingBag, X, Plus, Minus, Trash2 } from "lucide-react";
import { useCart, formatPrice } from "@/lib/cart";
import { getSoldOutCartItemIds } from "@/lib/menu-availability";
import { fetchOperationHours, getStoreClosedMessage, isStoreOpen } from "@/lib/operation-hours";
import { fetchOrderingStatus, getOrderingPausedMessage } from "@/lib/ordering-status";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function CartButton({ onClick }: { onClick: () => void }) {
  const { count } = useCart();
  return (
    <button
      onClick={onClick}
      aria-label="Open cart"
      className="relative inline-flex items-center justify-center w-10 h-10 text-[var(--cream)] hover:text-[var(--gold)] transition-colors"
    >
      <ShoppingBag className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full bg-[var(--gold)] text-[var(--gold-foreground)] flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, subtotal, setQty, remove, soldOutIds, markSoldOut, hasSoldOutItems } = useCart();
  const [mounted, setMounted] = useState(false);
  const [storeOpen, setStoreOpen] = useState(true);
  const [storeClosedMessage, setStoreClosedMessage] = useState("");
  const [orderingPaused, setOrderingPaused] = useState(false);
  const [orderingPausedMessage, setOrderingPausedMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItemKey = items.map((i) => i.id).join("|");

  useEffect(() => {
    if (!open || items.length === 0) return;
    let cancelled = false;
    getSoldOutCartItemIds(items)
      .then((ids) => {
        if (!cancelled && ids.length > 0) markSoldOut(ids);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, cartItemKey, items, markSoldOut]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchOperationHours()
      .then((hours) => {
        if (cancelled) return;
        const openNow = isStoreOpen(hours);
        setStoreOpen(openNow);
        setStoreClosedMessage(openNow ? "" : getStoreClosedMessage(hours));
      })
      .catch(() => {
        if (!cancelled) {
          setStoreOpen(true);
          setStoreClosedMessage("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchOrderingStatus()
      .then((status) => {
        if (cancelled) return;
        setOrderingPaused(status.paused);
        setOrderingPausedMessage(getOrderingPausedMessage(status));
      })
      .catch(() => {
        if (!cancelled) {
          setOrderingPaused(false);
          setOrderingPausedMessage("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-[60] transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`fixed top-0 right-0 z-[70] flex h-dvh w-full flex-col bg-[var(--cream)] text-[var(--forest-deep)] shadow-2xl transition-transform duration-300 sm:w-[440px] ${open ? "translate-x-0" : "translate-x-full pointer-events-none"}`}
        aria-label="Shopping cart"
        aria-hidden={!open}
        inert={open ? undefined : true}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--gold)]/20 shrink-0">
          <div>
            <p className="eyebrow text-[var(--gold)]">Your Order</p>
            <h2 className="font-display text-2xl mt-1">
              {items.length === 0
                ? "Empty basket"
                : `${items.length} item${items.length > 1 ? "s" : ""}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="p-2 hover:text-[var(--gold)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto px-6 py-4 ${items.length > 0 ? "pb-44" : ""}`}>
          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-12 h-12 mx-auto text-[var(--gold)]/40" />
              <p className="mt-6 text-sm text-[var(--forest)]/70">
                Add something delicious from the menu.
              </p>
              <Link
                to="/menu"
                onClick={onClose}
                className="mt-6 inline-block eyebrow border-b border-[var(--gold)] pb-1"
              >
                Browse menu
              </Link>
            </div>
          ) : (
            <>
              {orderingPaused && orderingPausedMessage && (
                <div className="mb-4 flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{orderingPausedMessage}</p>
                </div>
              )}
              {!orderingPaused && !storeOpen && storeClosedMessage && (
                <div className="mb-4 flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{storeClosedMessage}</p>
                </div>
              )}
              {hasSoldOutItems && (
                <div className="mb-4 flex items-start gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>Some items are sold out. Remove them from your cart to continue checkout.</p>
                </div>
              )}
              <ul className="divide-y divide-[var(--gold)]/15">
                {items.map((item) => {
                  const soldOut = soldOutIds.includes(item.id);
                  return (
                    <li key={item.id} className={`py-5 flex gap-4 ${soldOut ? "opacity-70" : ""}`}>
                      <div className="flex-1">
                        <h3 className="font-display text-lg leading-tight">{item.name}</h3>
                        {item.extras && item.extras.length > 0 && (
                          <p className="mt-1 text-xs text-[var(--forest)]/55">
                            + {item.extras.map((e) => e.name).join(", ")}
                          </p>
                        )}
                        {soldOut && (
                          <p className="mt-1 eyebrow text-[0.65rem] text-amber-800">
                            Sold out — remove to continue
                          </p>
                        )}
                        <p className="mt-1 text-sm text-[var(--forest)]/60">
                          {formatPrice(item.price)} each
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex items-center border border-[var(--gold)]/30">
                            <button
                              onClick={() => setQty(item.id, item.qty - 1)}
                              aria-label="Decrease quantity"
                              className="w-8 h-8 flex items-center justify-center hover:bg-[var(--gold)]/10"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                            <button
                              onClick={() => setQty(item.id, item.qty + 1)}
                              aria-label="Increase quantity"
                              className="w-8 h-8 flex items-center justify-center hover:bg-[var(--gold)]/10"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => remove(item.id)}
                            aria-label="Remove item"
                            className="text-[var(--forest)]/50 hover:text-[var(--forest-deep)] ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="font-display text-lg whitespace-nowrap">
                        {formatPrice(item.qty * item.price)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="absolute bottom-0 inset-x-0 border-t border-[var(--gold)]/20 bg-[var(--cream)] p-6">
            <div className="flex justify-between items-baseline mb-4">
              <span className="eyebrow text-[var(--forest)]/70">Subtotal</span>
              <span className="font-display text-2xl">{formatPrice(subtotal)}</span>
            </div>
            {orderingPaused ? (
              <span className="block w-full text-center bg-[var(--forest-deep)]/50 text-[var(--cream)]/70 eyebrow py-4 cursor-not-allowed">
                Ordering paused
              </span>
            ) : !storeOpen ? (
              <span className="block w-full text-center bg-[var(--forest-deep)]/50 text-[var(--cream)]/70 eyebrow py-4 cursor-not-allowed">
                Currently closed
              </span>
            ) : hasSoldOutItems ? (
              <span className="block w-full text-center bg-[var(--forest-deep)]/50 text-[var(--cream)]/70 eyebrow py-4 cursor-not-allowed">
                Remove sold out items
              </span>
            ) : (
              <Link
                to="/checkout"
                onClick={onClose}
                className="block w-full text-center bg-[var(--forest-deep)] text-[var(--cream)] eyebrow py-4 hover:bg-[var(--forest)] transition-colors"
              >
                Checkout
              </Link>
            )}
            <p className="mt-3 text-[11px] text-center text-[var(--forest)]/50">
              Pickup & dine-in only · Taxes included
            </p>
          </div>
        )}
      </aside>
    </>,
    document.body,
  );
}

export function useCartDrawer() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}
