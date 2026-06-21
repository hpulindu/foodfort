export const STANDALONE_SAUCE_BASE_FREE = 2;
export const STANDALONE_SAUCE_FREE_PER_FOOD_UNIT = 2;
export const STANDALONE_SAUCE_ID_PREFIX = "sauce-";

type CartLineInput = {
  id: string;
  qty: number;
};

export function isStandaloneSauceLine(id: string): boolean {
  return id.startsWith(STANDALONE_SAUCE_ID_PREFIX);
}

export function countFoodUnits(items: CartLineInput[]): number {
  return items
    .filter((item) => !isStandaloneSauceLine(item.id))
    .reduce((sum, item) => sum + item.qty, 0);
}

export function maxStandaloneFreeSauceUnitsForFoodUnits(foodUnits: number): number {
  return STANDALONE_SAUCE_BASE_FREE + STANDALONE_SAUCE_FREE_PER_FOOD_UNIT * foodUnits;
}

export function getStandaloneFreeSauceExcess(
  foodUnits: number,
  freeStandaloneSauceUnits: number,
): number {
  const max = maxStandaloneFreeSauceUnitsForFoodUnits(foodUnits);
  return Math.max(0, freeStandaloneSauceUnits - max);
}
