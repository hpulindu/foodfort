import type { MenuItem, MenuItemSauceSelection, MenuItemVariant, Sauce } from "./menu-data";
import type { CartExtra } from "./cart";

export function itemHasVariants(item: MenuItem): boolean {
  return (item.variants?.length ?? 0) > 0;
}

export function itemAllowsSauceSelection(item: MenuItem): boolean {
  return item.sauceSelection?.enabled === true;
}

export function itemNeedsCustomization(
  item: MenuItem,
  sectionId: string,
  extrasCount: number,
  supportsExtras: (sectionId: string) => boolean,
): boolean {
  if (itemHasVariants(item)) return true;
  if (itemAllowsSauceSelection(item)) return true;
  return supportsExtras(sectionId) && extrasCount > 0;
}

export function getMenuItemDisplayPrice(item: MenuItem): string {
  if (itemHasVariants(item)) {
    const min = Math.min(...item.variants!.map((v) => Number(v.price)));
    return `From $${min.toFixed(2)}`;
  }
  return `$${item.price}`;
}

export function getDefaultVariant(item: MenuItem): MenuItemVariant | undefined {
  return item.variants?.[0];
}

export function toCartModifier(id: string, name: string, price: number): CartExtra {
  return { id, name, price: +price.toFixed(2) };
}

export function sauceToCartModifier(sauce: Sauce): CartExtra {
  const price = parseFloat(sauce.price);
  return toCartModifier(`sauce-mod-${sauce.name}`, sauce.name, Number.isFinite(price) ? price : 0);
}

export function variantToCartModifier(variant: MenuItemVariant): CartExtra {
  return toCartModifier(`variant-${variant.id ?? variant.name}`, variant.name, variant.price);
}

export function getMaxSauces(selection?: MenuItemSauceSelection | null): number {
  if (!selection?.enabled) return 0;
  return Math.min(10, Math.max(1, selection.maxSauces ?? 1));
}
