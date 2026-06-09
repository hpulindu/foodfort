import type { CartItem } from "./cart";
import { getBaseCartItemId } from "./cart";
import { fetchMenu, fetchSauces } from "./menu-api";
import { EXTRAS_SECTION_ID } from "./menu-config";

/** Returns cart item IDs that are currently unavailable in Firestore. */
export async function getSoldOutCartItemIds(items: CartItem[]): Promise<string[]> {
  if (items.length === 0) return [];

  const [sections, sauces] = await Promise.all([fetchMenu(), fetchSauces()]);
  const soldOut: string[] = [];

  const extrasSection = sections.find((s) => s.id === EXTRAS_SECTION_ID);

  for (const item of items) {
    if (item.id.startsWith("sauce-")) {
      const sauceName = item.id.slice("sauce-".length);
      const sauce = sauces.find((s) => s.name === sauceName);
      if (sauce?.available === false) soldOut.push(item.id);
      continue;
    }

    const baseId = getBaseCartItemId(item.id);
    for (const section of sections) {
      const menuItem = section.items.find((i) => `${section.id}-${i.name}` === baseId);
      if (menuItem?.available === false) {
        soldOut.push(item.id);
        break;
      }
    }

    for (const extra of item.extras ?? []) {
      const extraItem = extrasSection?.items.find((i) => i.name === extra.name);
      if (extraItem?.available === false) soldOut.push(item.id);
    }
  }

  return soldOut;
}

/** Extract sold-out item IDs from a payment error message. */
export function soldOutIdsFromError(message: string, items: CartItem[]): string[] {
  const match = message.match(/"([^"]+)" is currently sold out/i);
  if (!match) return [];

  const soldOutName = match[1].toLowerCase().trim();
  return items
    .filter((item) => {
      if (item.name.toLowerCase().trim() === soldOutName) return true;
      if (item.baseName.toLowerCase().trim() === soldOutName) return true;
      return (item.extras ?? []).some((e) => e.name.toLowerCase().trim() === soldOutName);
    })
    .map((item) => item.id);
}

export function isSoldOutMessage(message: string): boolean {
  return /is currently sold out/i.test(message);
}
