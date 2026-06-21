import type { CartItem } from "./cart";
import type { Sauce } from "./menu-data";

export const STANDALONE_SAUCE_BASE_FREE = 2;
export const STANDALONE_SAUCE_FREE_PER_FOOD_UNIT = 2;
export const STANDALONE_SAUCE_ID_PREFIX = "sauce-";

export function isStandaloneSauceLine(id: string): boolean {
  return id.startsWith(STANDALONE_SAUCE_ID_PREFIX);
}

export function isFreeStandaloneSauceLine(item: Pick<CartItem, "id" | "price">): boolean {
  return isStandaloneSauceLine(item.id) && item.price === 0;
}

export function standaloneSauceCartId(name: string): string {
  return `${STANDALONE_SAUCE_ID_PREFIX}${name}`;
}

export function countFoodUnits(items: Pick<CartItem, "id" | "qty">[]): number {
  return items
    .filter((item) => !isStandaloneSauceLine(item.id))
    .reduce((sum, item) => sum + item.qty, 0);
}

export function maxStandaloneFreeSauceUnits(items: Pick<CartItem, "id" | "qty">[]): number {
  return STANDALONE_SAUCE_BASE_FREE + STANDALONE_SAUCE_FREE_PER_FOOD_UNIT * countFoodUnits(items);
}

export function countStandaloneFreeSauceUnits(
  items: Pick<CartItem, "id" | "price" | "qty">[],
): number {
  return items
    .filter(isFreeStandaloneSauceLine)
    .reduce((sum, item) => sum + item.qty, 0);
}

export function getStandaloneSauceAllowance(
  items: Pick<CartItem, "id" | "price" | "qty">[],
): { max: number; used: number; remaining: number } {
  const max = maxStandaloneFreeSauceUnits(items);
  const used = countStandaloneFreeSauceUnits(items);
  return { max, used, remaining: Math.max(0, max - used) };
}

export function getStandaloneSauceLimitMessage(): string {
  return `Complimentary sauces: ${STANDALONE_SAUCE_BASE_FREE} included, plus ${STANDALONE_SAUCE_FREE_PER_FOOD_UNIT} per meal item.`;
}

function limitReachedReason(items: Pick<CartItem, "id" | "price" | "qty">[]): string {
  const foodUnits = countFoodUnits(items);
  if (foodUnits === 0) {
    return "Free sauce limit reached. Add a meal to your cart for more.";
  }
  return "Free sauce limit reached. Add another meal or remove sauces to continue.";
}

export function canAddStandaloneSauce(
  items: Pick<CartItem, "id" | "price" | "qty">[],
  sauce: Pick<Sauce, "price">,
  units = 1,
): { ok: true } | { ok: false; reason: string } {
  const price = parseFloat(sauce.price);
  if (Number.isFinite(price) && price > 0) {
    return { ok: true };
  }

  const { remaining } = getStandaloneSauceAllowance(items);
  if (remaining < units) {
    return { ok: false, reason: limitReachedReason(items) };
  }
  return { ok: true };
}

export function canIncreaseStandaloneSauceQty(
  items: CartItem[],
  itemId: string,
): { ok: true } | { ok: false; reason: string } {
  const item = items.find((entry) => entry.id === itemId);
  if (!item || !isFreeStandaloneSauceLine(item)) {
    return { ok: true };
  }
  return canAddStandaloneSauce(items, { price: "0" }, 1);
}

export function validateStandaloneSauceCart(
  items: Pick<CartItem, "id" | "price" | "qty">[],
): { ok: true } | { ok: false; reason: string } {
  const { max, used } = getStandaloneSauceAllowance(items);
  if (used <= max) {
    return { ok: true };
  }
  const excess = used - max;
  return {
    ok: false,
    reason: `Remove ${excess} free sauce${excess === 1 ? "" : "s"} to continue checkout.`,
  };
}
