import type { CartItem, DishStyleId } from "./contract";
import type { IngredientsOk, VariantsOk } from "./types";

/** Built-in White Sauce Pasta data, served when GEMINI_API_KEY is not set so the UI stays demoable. */

export function sampleVariants(): VariantsOk {
  return {
    ok: true,
    source: "sample",
    dish: "White Sauce Pasta",
    cuisine: "Italian · Indian home-style",
    summary: "Pasta folded through a creamy, garlicky béchamel.",
    isVeg: true,
    variants: [
      {
        style: "restaurant",
        title: "Parmesan Alfredo Penne",
        tagline: "Silky cream sauce, aged Parmesan, garlic butter and basil.",
        highlights: ["Parmesan", "Fresh cream", "Mushrooms"],
        timeMinutes: 35,
        kcalPerServing: 640,
        proteinGrams: 19,
      },
      {
        style: "basic",
        title: "Classic White Sauce Pasta",
        tagline: "The weeknight version: milk, butter, flour, done.",
        highlights: ["Milk", "Butter", "Oregano"],
        timeMinutes: 25,
        kcalPerServing: 480,
        proteinGrams: 14,
      },
      {
        style: "healthy",
        title: "Whole-Wheat Veggie Penne",
        tagline: "Lighter toned-milk sauce, loaded with broccoli and spinach.",
        highlights: ["Whole-wheat penne", "Broccoli", "Spinach"],
        timeMinutes: 30,
        kcalPerServing: 390,
        proteinGrams: 16,
      },
      {
        style: "protein",
        title: "Paneer Protein Alfredo",
        tagline: "Chickpea pasta, seared paneer and a Greek-yogurt finish.",
        highlights: ["Chickpea pasta", "Paneer", "Greek yogurt"],
        timeMinutes: 30,
        kcalPerServing: 540,
        proteinGrams: 38,
      },
    ],
  };
}

type Row = Omit<CartItem, "id" | "substitutes" | "optional" | "pantryStaple"> &
  Partial<Pick<CartItem, "substitutes" | "optional" | "pantryStaple">>;

const LISTS: Record<DishStyleId, { tip: string; items: Row[] }> = {
  restaurant: {
    tip: "Take the pan off the heat before adding Parmesan so the sauce stays glossy, not grainy.",
    items: [
      { name: "Penne pasta", searchQuery: "penne pasta", quantity: 250, unit: "g", category: "pantry", estimatedPriceInr: 99, substitutes: ["Fusilli"] },
      { name: "Fresh cream", searchQuery: "fresh cream", quantity: 200, unit: "ml", category: "dairy", estimatedPriceInr: 70 },
      { name: "Parmesan cheese", searchQuery: "parmesan cheese", quantity: 40, unit: "g", category: "dairy", estimatedPriceInr: 299, substitutes: ["Processed cheese"] },
      { name: "Unsalted butter", searchQuery: "unsalted butter", quantity: 40, unit: "g", category: "dairy", estimatedPriceInr: 62 },
      { name: "Full cream milk", searchQuery: "full cream milk", quantity: 250, unit: "ml", category: "dairy", estimatedPriceInr: 34 },
      { name: "Button mushrooms", searchQuery: "button mushroom", quantity: 200, unit: "g", category: "produce", estimatedPriceInr: 59 },
      { name: "Garlic", searchQuery: "garlic", quantity: 1, unit: "pcs", category: "produce", estimatedPriceInr: 35, notes: "about 6 cloves" },
      { name: "Fresh basil", searchQuery: "basil leaves", quantity: 1, unit: "bunch", category: "produce", estimatedPriceInr: 45, optional: true },
      { name: "Extra virgin olive oil", searchQuery: "extra virgin olive oil", quantity: 2, unit: "tbsp", category: "pantry", estimatedPriceInr: 349 },
      { name: "Red chilli flakes", searchQuery: "chilli flakes", quantity: 1, unit: "tsp", category: "spices", estimatedPriceInr: 45, optional: true },
      { name: "Maida", searchQuery: "maida", quantity: 1.5, unit: "tbsp", category: "pantry", estimatedPriceInr: 40, pantryStaple: true },
      { name: "Black pepper powder", searchQuery: "black pepper powder", quantity: 1, unit: "tsp", category: "spices", estimatedPriceInr: 65, pantryStaple: true },
      { name: "Salt", searchQuery: "salt", quantity: 1, unit: "tsp", category: "spices", estimatedPriceInr: 28, pantryStaple: true },
    ],
  },
  basic: {
    tip: "Whisk cold milk into the hot butter-flour roux a splash at a time to avoid lumps.",
    items: [
      { name: "Penne pasta", searchQuery: "penne pasta", quantity: 200, unit: "g", category: "pantry", estimatedPriceInr: 99, substitutes: ["Macaroni"] },
      { name: "Toned milk", searchQuery: "toned milk", quantity: 400, unit: "ml", category: "dairy", estimatedPriceInr: 28 },
      { name: "Butter", searchQuery: "salted butter", quantity: 30, unit: "g", category: "dairy", estimatedPriceInr: 62 },
      { name: "Garlic", searchQuery: "garlic", quantity: 1, unit: "pcs", category: "produce", estimatedPriceInr: 35, notes: "about 4 cloves" },
      { name: "Oregano", searchQuery: "oregano", quantity: 1, unit: "tsp", category: "spices", estimatedPriceInr: 55 },
      { name: "Maida", searchQuery: "maida", quantity: 2, unit: "tbsp", category: "pantry", estimatedPriceInr: 40, pantryStaple: true },
      { name: "Black pepper powder", searchQuery: "black pepper powder", quantity: 0.5, unit: "tsp", category: "spices", estimatedPriceInr: 65, pantryStaple: true },
      { name: "Salt", searchQuery: "salt", quantity: 1, unit: "tsp", category: "spices", estimatedPriceInr: 28, pantryStaple: true },
    ],
  },
  healthy: {
    tip: "Blanch the broccoli in the pasta water for the last two minutes, one pot, no extra mess.",
    items: [
      { name: "Whole-wheat penne", searchQuery: "whole wheat penne pasta", quantity: 180, unit: "g", category: "pantry", estimatedPriceInr: 129 },
      { name: "Toned milk", searchQuery: "toned milk", quantity: 350, unit: "ml", category: "dairy", estimatedPriceInr: 28 },
      { name: "Broccoli", searchQuery: "broccoli", quantity: 200, unit: "g", category: "produce", estimatedPriceInr: 65 },
      { name: "Spinach", searchQuery: "spinach", quantity: 1, unit: "bunch", category: "produce", estimatedPriceInr: 30 },
      { name: "Red bell pepper", searchQuery: "red bell pepper", quantity: 1, unit: "pcs", category: "produce", estimatedPriceInr: 45 },
      { name: "Garlic", searchQuery: "garlic", quantity: 1, unit: "pcs", category: "produce", estimatedPriceInr: 35, notes: "about 4 cloves" },
      { name: "Olive oil", searchQuery: "olive oil", quantity: 1, unit: "tbsp", category: "pantry", estimatedPriceInr: 299 },
      { name: "Oregano", searchQuery: "oregano", quantity: 1, unit: "tsp", category: "spices", estimatedPriceInr: 55 },
      { name: "Atta", searchQuery: "whole wheat atta", quantity: 1.5, unit: "tbsp", category: "pantry", estimatedPriceInr: 65, pantryStaple: true },
      { name: "Black pepper powder", searchQuery: "black pepper powder", quantity: 0.5, unit: "tsp", category: "spices", estimatedPriceInr: 65, pantryStaple: true },
      { name: "Salt", searchQuery: "salt", quantity: 1, unit: "tsp", category: "spices", estimatedPriceInr: 28, pantryStaple: true },
    ],
  },
  protein: {
    tip: "Stir the Greek yogurt in off the heat; boiling it will split the sauce.",
    items: [
      { name: "Chickpea pasta", searchQuery: "chickpea pasta", quantity: 200, unit: "g", category: "pantry", estimatedPriceInr: 199, substitutes: ["Whole-wheat penne"] },
      { name: "Paneer", searchQuery: "paneer", quantity: 200, unit: "g", category: "dairy", estimatedPriceInr: 95, substitutes: ["Firm tofu"] },
      { name: "Greek yogurt", searchQuery: "greek yogurt plain", quantity: 100, unit: "g", category: "dairy", estimatedPriceInr: 60 },
      { name: "Toned milk", searchQuery: "toned milk", quantity: 250, unit: "ml", category: "dairy", estimatedPriceInr: 28 },
      { name: "Broccoli", searchQuery: "broccoli", quantity: 150, unit: "g", category: "produce", estimatedPriceInr: 65 },
      { name: "Mozzarella cheese", searchQuery: "mozzarella cheese", quantity: 50, unit: "g", category: "dairy", estimatedPriceInr: 120, optional: true },
      { name: "Butter", searchQuery: "salted butter", quantity: 15, unit: "g", category: "dairy", estimatedPriceInr: 62 },
      { name: "Garlic", searchQuery: "garlic", quantity: 1, unit: "pcs", category: "produce", estimatedPriceInr: 35, notes: "about 5 cloves" },
      { name: "Red chilli flakes", searchQuery: "chilli flakes", quantity: 1, unit: "tsp", category: "spices", estimatedPriceInr: 45 },
      { name: "Oregano", searchQuery: "oregano", quantity: 1, unit: "tsp", category: "spices", estimatedPriceInr: 55 },
      { name: "Black pepper powder", searchQuery: "black pepper powder", quantity: 0.5, unit: "tsp", category: "spices", estimatedPriceInr: 65, pantryStaple: true },
      { name: "Salt", searchQuery: "salt", quantity: 1, unit: "tsp", category: "spices", estimatedPriceInr: 28, pantryStaple: true },
    ],
  },
};

export function sampleIngredients(style: DishStyleId, servings: number): IngredientsOk {
  const list = LISTS[style];
  const factor = servings / 2;
  return {
    ok: true,
    source: "sample",
    dish: "White Sauce Pasta",
    style,
    servings,
    tip: list.tip,
    items: list.items.map((row, index) => ({
      substitutes: [],
      optional: false,
      pantryStaple: false,
      ...row,
      id: `ing_${String(index + 1).padStart(2, "0")}`,
      quantity: row.unit === "pcs" || row.unit === "bunch" ? Math.max(1, Math.round(row.quantity * factor)) : row.quantity * factor,
    })),
  };
}
