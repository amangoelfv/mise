import type { BudgetPreference, CartItem, Diet, DishStyleId } from "./contract";

/** "sample": no Gemini configured. "fallback": Gemini failed on every model. Both serve the built-in menu (src/lib/feed.ts). */
export type Source = "gemini" | "sample" | "fallback";

export interface DishVariant {
  style: DishStyleId;
  title: string;
  tagline: string;
  highlights: string[];
  timeMinutes: number;
  kcalPerServing: number;
  proteinGrams: number;
}

export interface VariantsOk {
  ok: true;
  source: Source;
  dish: string;
  cuisine: string;
  summary: string;
  isVeg: boolean;
  variants: DishVariant[];
}
export type VariantsResult = VariantsOk | { ok: false; message: string; suggestions?: string[] };

export interface IngredientsOk {
  ok: true;
  source: Source;
  dish: string;
  style: DishStyleId;
  servings: number;
  tip: string;
  items: CartItem[];
}

export interface VariantsInput {
  query: string;
  diet: Diet;
  avoid: string[];
  budget: BudgetPreference;
  /** Derived from age band and weight on the device; null when the profile was skipped. */
  proteinTargetG: number | null;
}

export interface IngredientsInput {
  dish: string;
  cuisine: string;
  style: DishStyleId;
  variant: { title: string; tagline: string; highlights: string[] };
  servings: number;
  diet: Diet;
  avoid: string[];
  budget: BudgetPreference;
}

export interface CartBody {
  dish: { query: string; name: string; cuisine: string; style: DishStyleId; variantTitle: string };
  servings: number;
  items: CartItem[];
  diet: Diet;
  avoid: string[];
  pincode?: string;
  dryRun?: boolean;
}

export interface ZeptoState {
  connected: boolean;
  /** "zepto" = signed in on Zepto via OAuth; "simulated" = local demo connection. */
  via?: "zepto" | "simulated";
  since?: string;
}

