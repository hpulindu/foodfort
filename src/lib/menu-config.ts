import type { MenuItem, MenuSection } from "./menu-data";

export const EXTRAS_SECTION_ID = "extras";

/** Sections where extras cannot be attached (sauces are a separate collection). */
export const SECTIONS_WITHOUT_EXTRAS = new Set([
  "fries",
  "drinks",
  "desserts",
  "combos",
  EXTRAS_SECTION_ID,
]);

export function supportsExtras(sectionId: string): boolean {
  return !SECTIONS_WITHOUT_EXTRAS.has(sectionId);
}

export function getExtrasFromMenu(sections: MenuSection[]): MenuItem[] {
  return sections.find((s) => s.id === EXTRAS_SECTION_ID)?.items ?? [];
}

export function isExtrasSection(sectionId: string): boolean {
  return sectionId === EXTRAS_SECTION_ID;
}
