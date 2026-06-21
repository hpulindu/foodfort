import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import {
  menu as fallbackMenu,
  sauces as fallbackSauces,
  type MenuItem,
  type MenuItemSauceSelection,
  type MenuItemVariant,
  type MenuSection,
  type Sauce,
} from "./menu-data";

export const MENU_COLLECTION = "menuSections";
export const SAUCES_COLLECTION = "sauces";

function normalizeVariant(raw: unknown): MenuItemVariant | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== "string" || !r.name.trim()) return null;
  const price =
    typeof r.price === "number"
      ? r.price
      : parseFloat(String(r.price ?? ""));
  if (!Number.isFinite(price) || price < 0) return null;
  return {
    id: typeof r.id === "string" && r.id.trim() ? r.id.trim() : undefined,
    name: r.name.trim(),
    price: +price.toFixed(2),
  };
}

function normalizeSauceSelection(raw: unknown): MenuItemSauceSelection | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  if (r.enabled !== true) return undefined;
  const max =
    typeof r.maxSauces === "number" ? Math.floor(r.maxSauces) : 1;
  return { enabled: true, maxSauces: Math.min(10, Math.max(1, max)) };
}

function normalizeItem(
  raw: unknown,
  availability?: Record<string, boolean>,
): MenuItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== "string") return null;
  const image = typeof r.image === "string" && r.image.trim() ? r.image.trim() : undefined;
  const variants = Array.isArray(r.variants)
    ? r.variants.map(normalizeVariant).filter((v): v is MenuItemVariant => v !== null)
    : undefined;
  const sauceSelection = normalizeSauceSelection(r.sauceSelection);
  return {
    name: r.name,
    description: typeof r.description === "string" ? r.description : undefined,
    price: typeof r.price === "number" ? r.price.toFixed(2) : String(r.price ?? ""),
    badge: r.badge === "chef" || r.badge === "veg" ? r.badge : undefined,
    image,
    available: availability?.[r.name] ?? true,
    variants: variants?.length ? variants : undefined,
    sauceSelection,
  };
}

function normalizeSection(id: string, raw: Record<string, unknown>): MenuSection {
  const availability = raw.availability as Record<string, boolean> | undefined;
  const items = Array.isArray(raw.items)
    ? raw.items.map((item) => normalizeItem(item, availability)).filter((i): i is MenuItem => i !== null)
    : [];
  return {
    id: typeof raw.id === "string" ? raw.id : id,
    number: typeof raw.number === "string" ? raw.number : String(raw.number ?? ""),
    title: typeof raw.title === "string" ? raw.title : id,
    subtitle: typeof raw.subtitle === "string" ? raw.subtitle : undefined,
    items,
  };
}

// Fetches menu sections from Firestore, ordered by their `order` field.
// Falls back to the bundled menu when Firebase isn't configured or the
// collection is empty, so the page always renders something useful.
export async function fetchMenu(): Promise<MenuSection[]> {
  if (!isFirebaseConfigured) return fallbackMenu;

  const snap = await getDocs(query(collection(db, MENU_COLLECTION), orderBy("order")));
  if (snap.empty) return fallbackMenu;

  return snap.docs.map((d) => normalizeSection(d.id, d.data() as Record<string, unknown>));
}

function normalizeSauce(raw: Record<string, unknown>): Sauce | null {
  if (typeof raw.name !== "string") return null;
  return {
    name: raw.name,
    price: typeof raw.price === "number" ? raw.price.toFixed(2) : String(raw.price ?? "0.00"),
    available: typeof raw.available === "boolean" ? raw.available : true,
  };
}

// Fetches sauces from Firestore, ordered by their `order` field.
// Falls back to the bundled sauces when Firebase isn't configured or empty.
export async function fetchSauces(): Promise<Sauce[]> {
  if (!isFirebaseConfigured) return fallbackSauces;

  const snap = await getDocs(query(collection(db, SAUCES_COLLECTION), orderBy("order")));
  if (snap.empty) return fallbackSauces;

  return snap.docs
    .map((d) => normalizeSauce(d.data() as Record<string, unknown>))
    .filter((s): s is Sauce => s !== null);
}

/** Locate a menu item by exact name across all sections (with optional aliases). */
export function findMenuItemByName(
  sections: MenuSection[],
  name: string,
  aliases: string[] = [],
): { item: MenuItem; sectionId: string } | null {
  for (const lookup of [name, ...aliases]) {
    for (const section of sections) {
      const item = section.items.find((i) => i.name === lookup);
      if (item) return { item, sectionId: section.id };
    }
  }
  return null;
}
