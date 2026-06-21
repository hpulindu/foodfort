import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";

export type CartExtra = {
  id: string;
  name: string;
  price: number;
};

export type CartItem = {
  id: string;
  /** Display name, may include selected extras */
  name: string;
  /** Base menu item name used for server price validation */
  baseName: string;
  price: number;
  qty: number;
  extras?: CartExtra[];
  /** Selected size / variant */
  variant?: CartExtra;
  /** Sauces chosen for this item (not standalone sauce line items) */
  sauces?: CartExtra[];
};

export function getBaseCartItemId(id: string): string {
  const idx = id.indexOf("--");
  return idx === -1 ? id : id.slice(0, idx);
}

export function buildCartItemId(
  baseId: string,
  extras: CartExtra[],
  variant?: CartExtra,
  sauces: CartExtra[] = [],
): string {
  if (!variant && sauces.length === 0) {
    if (extras.length === 0) return baseId;
    const extraKey = [...extras].map((e) => e.id).sort().join(",");
    return `${baseId}--${extraKey}`;
  }

  const parts = [baseId];
  if (variant) parts.push(`v:${variant.id}`);
  if (sauces.length) parts.push(`s:${[...sauces].map((s) => s.id).sort().join(",")}`);
  if (extras.length) parts.push(`e:${[...extras].map((e) => e.id).sort().join(",")}`);
  return parts.join("--");
}

export function formatCartItemName(
  baseName: string,
  extras: CartExtra[],
  variant?: CartExtra,
  sauces: CartExtra[] = [],
): string {
  let name = variant ? `${baseName} (${variant.name})` : baseName;
  const parts = [
    ...(sauces.length ? [sauces.map((s) => s.name).join(", ")] : []),
    ...(extras.length ? [extras.map((e) => e.name).join(", ")] : []),
  ];
  if (parts.length) name = `${name} (+ ${parts.join("; ")})`;
  return name;
}

export function cartItemUnitPrice(
  basePrice: number,
  extras: CartExtra[],
  variant?: CartExtra,
  sauces: CartExtra[] = [],
): number {
  const start = variant?.price ?? basePrice;
  const addOns = [...(sauces ?? []), ...extras].reduce((sum, entry) => sum + entry.price, 0);
  return +(start + addOns).toFixed(2);
}

function normalizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    baseName: item.baseName ?? item.name,
    extras: item.extras ?? [],
    sauces: item.sauces ?? [],
  };
}

type State = { items: CartItem[]; soldOutIds: string[] };
type Action =
  | { type: "add"; item: Omit<CartItem, "qty">; qty?: number }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number }
  | { type: "clear" }
  | { type: "hydrate"; state: Pick<State, "items"> }
  | { type: "markSoldOut"; ids: string[] }
  | { type: "clearSoldOut" };

const STORAGE_KEY = "foodfort_cart_v1";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const qty = action.qty ?? 1;
      const existing = state.items.find(i => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.item.id ? { ...i, qty: i.qty + qty } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, qty }] };
    }
    case "remove":
      return {
        items: state.items.filter(i => i.id !== action.id),
        soldOutIds: state.soldOutIds.filter(id => id !== action.id),
      };
    case "setQty":
      if (action.qty <= 0) {
        return {
          items: state.items.filter(i => i.id !== action.id),
          soldOutIds: state.soldOutIds.filter(id => id !== action.id),
        };
      }
      return {
        items: state.items.map(i => (i.id === action.id ? { ...i, qty: action.qty } : i)),
        soldOutIds: state.soldOutIds,
      };
    case "clear":
      return { items: [], soldOutIds: [] };
    case "hydrate":
      return { ...state, items: action.state.items };
    case "markSoldOut": {
      const merged = new Set([...state.soldOutIds, ...action.ids]);
      return { ...state, soldOutIds: [...merged] };
    }
    case "clearSoldOut":
      return { ...state, soldOutIds: [] };
    default:
      return state;
  }
}

type CartCtx = {
  items: CartItem[];
  soldOutIds: string[];
  count: number;
  subtotal: number;
  hasSoldOutItems: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  markSoldOut: (ids: string[]) => void;
  clearSoldOut: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], soldOutIds: [] });

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as { items?: CartItem[] };
        if (Array.isArray(parsed.items)) {
          dispatch({
            type: "hydrate",
            state: { items: parsed.items.map((item) => normalizeCartItem(item as CartItem)) },
          });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items }));
    } catch {}
  }, [state]);

  const value = useMemo<CartCtx>(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0);
    const subtotal = state.items.reduce((n, i) => n + i.qty * i.price, 0);
    return {
      items: state.items,
      soldOutIds: state.soldOutIds,
      count,
      subtotal,
      hasSoldOutItems: state.soldOutIds.length > 0,
      add: (item, qty) => dispatch({ type: "add", item, qty }),
      remove: id => dispatch({ type: "remove", id }),
      setQty: (id, qty) => dispatch({ type: "setQty", id, qty }),
      clear: () => dispatch({ type: "clear" }),
      markSoldOut: ids => dispatch({ type: "markSoldOut", ids }),
      clearSoldOut: () => dispatch({ type: "clearSoldOut" }),
    };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}

export const formatPrice = (n: number) =>
  n.toLocaleString("en-AU", { style: "currency", currency: "AUD" });

const SERVICE_CHARGE_RATE = 0.05;
const SERVICE_CHARGE_CAP = 3;
// Standard Stripe Australia domestic card rate, passed through to the customer.
// The backend uses the same constants — frontend values are for display only.
const CARD_PROCESSING_RATE = 0.0175;
const CARD_PROCESSING_FIXED = 0.3;

export function serviceChargeFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.min(+(subtotal * SERVICE_CHARGE_RATE).toFixed(2), SERVICE_CHARGE_CAP);
}

export function cardProcessingFeeFor(base: number): number {
  if (base <= 0) return 0;
  return +(base * CARD_PROCESSING_RATE + CARD_PROCESSING_FIXED).toFixed(2);
}
