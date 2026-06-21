import { toast } from "sonner";
import type { MenuItem } from "./menu-data";
import { itemNeedsCustomization } from "./menu-item-options";
import { supportsExtras } from "./menu-config";
import type { CartItem } from "./cart";

export type MenuItemCartTarget = {
  id: string;
  item: MenuItem;
  sectionId: string;
};

export function menuItemCartId(sectionId: string, itemName: string) {
  return `${sectionId}-${itemName}`;
}

export function menuItemNeedsCustomization(
  item: MenuItem,
  sectionId: string,
  extrasCount: number,
) {
  return itemNeedsCustomization(item, sectionId, extrasCount, supportsExtras);
}

export function addMenuItemOrCustomize({
  target,
  extrasCount,
  add,
  onCustomize,
}: {
  target: MenuItemCartTarget;
  extrasCount: number;
  add: (item: Omit<CartItem, "qty">) => void;
  onCustomize: (target: MenuItemCartTarget) => void;
}) {
  if (menuItemNeedsCustomization(target.item, target.sectionId, extrasCount)) {
    onCustomize(target);
    return;
  }

  add({
    id: target.id,
    name: target.item.name,
    baseName: target.item.name,
    price: parseFloat(target.item.price),
  });
  toast.success(`${target.item.name} added`, { duration: 1500 });
}
