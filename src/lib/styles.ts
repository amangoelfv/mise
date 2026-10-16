import type { DishStyleId } from "./contract";

export interface DishStyle {
  id: DishStyleId;
  label: string;
  blurb: string;
  /** How Gemini should interpret the style. */
  guidance: string;
}

export const DISH_STYLES: DishStyle[] = [
  {
    id: "restaurant",
    label: "Restaurant Style",
    blurb: "Richer, with the finishing touches.",
    guidance:
      "Restaurant-quality and indulgent: richer ingredients (butter, cream, aged cheese, good oil), proper aromatics, garnishes and finishing touches.",
  },
  {
    id: "basic",
    label: "Basic Ingredients",
    blurb: "Fewest items, mostly pantry staples.",
    guidance:
      "The simplest honest version: as few ingredients as possible, mostly common staples, budget-friendly, still tasty. No garnish-only items.",
  },
  {
    id: "healthy",
    label: "Healthy",
    blurb: "Lighter, with more vegetables.",
    guidance:
      "Lighter and nourishing: whole grains, more vegetables, less butter/cream/sugar/refined flour, smart swaps that keep it satisfying.",
  },
  {
    id: "protein",
    label: "Protein Rich Alternative",
    blurb: "More protein on the same plate.",
    guidance:
      "Maximise protein per serving (aim for 30 g+) with swaps and add-ons such as paneer, tofu, eggs, chicken, Greek yogurt, legume pasta or lentils, while staying true to the dish.",
  },
];

export const styleById = (id: DishStyleId) => DISH_STYLES.find((s) => s.id === id)!;
