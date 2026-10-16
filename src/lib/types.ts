import type { CartItem, Diet, DishStyleId } from "./contract";

export type Source = "gemini" | "sample";

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
export type VariantsResult = VariantsOk | { ok: false; message: string };

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
}

export interface IngredientsInput {
  dish: string;
  cuisine: string;
  style: DishStyleId;
  variant: { title: string; tagline: string; highlights: string[] };
  servings: number;
  diet: Diet;
  avoid: string[];
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

