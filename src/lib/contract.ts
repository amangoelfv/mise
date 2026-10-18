/**
 * Mise ⇄ Cart API contract (v1.0). Human-readable spec with examples: CONTRACT.md.
 *
 * This file has no imports on purpose — copy it as-is into the cart service.
 */

export const CONTRACT_VERSION = "1.0" as const;

export type DishStyleId = "restaurant" | "basic" | "healthy" | "protein";
export type Diet = "any" | "vegetarian" | "eggetarian" | "vegan" | "jain";
export const BUDGET_PREFERENCES = ["best_rated", "best_price"] as const;
/** How the cart service should rank candidate products for an ingredient. */
export type BudgetPreference = (typeof BUDGET_PREFERENCES)[number];
export type Unit = "g" | "kg" | "ml" | "l" | "pcs" | "tsp" | "tbsp" | "bunch" | "pack";
export type IngredientCategory =
  | "produce"
  | "dairy"
  | "meat_seafood"
  | "bakery"
  | "pantry"
  | "spices"
  | "frozen"
  | "beverages"
  | "other";
export type Provider = "zepto";

/** One ingredient the cart service should find a product for. */
export interface CartItem {
  /** Stable within a request ("ing_01"); echoed back in CartLine.ingredientId. */
  id: string;
  /** Display name, e.g. "Fresh cream". */
  name: string;
  /** What a person would type into the store's search box, e.g. "fresh cream". */
  searchQuery: string;
  /** Amount the recipe uses (not the pack size). The cart service picks the pack. */
  quantity: number;
  unit: Unit;
  category: IngredientCategory;
  /** Nice-to-have garnish or add-on; fine to drop if unavailable. */
  optional: boolean;
  /** Commonly already at home (salt, oil, turmeric…). Only sent if the user kept it. */
  pantryStaple: boolean;
  /** Acceptable alternatives, best first. */
  substitutes: string[];
  notes?: string;
  /** Gemini's rough estimate for the smallest sensible pack, in INR. A hint only. */
  estimatedPriceInr?: number;
}

/**
 * How the cart service reaches the store for this user.
 * "mcp": call Zepto's official MCP server (github.com/zeptonow/mcp) with the bearer token.
 * The token is scoped to catalog + cart only; it cannot place orders or check out.
 */
export type CartConnector =
  | { provider: Provider; transport: "mcp"; mcpUrl: string; accessToken: string; expiresAt: string }
  | { provider: Provider; transport: "simulated"; connectionId: string };

/** POST {CART_API_URL}/v1/carts */
export interface CartRequest {
  version: typeof CONTRACT_VERSION;
  requestId: string;
  createdAt: string;
  source: "mise-web";
  user: { id: string; email: string; name: string };
  connector: CartConnector;
  delivery?: { pincode?: string };
  dish: {
    /** Exactly what the user typed. */
    query: string;
    /** Normalised dish name, e.g. "White Sauce Pasta". */
    name: string;
    cuisine?: string;
    style: DishStyleId;
    styleLabel: string;
    /** Gemini's name for this take, e.g. "Parmesan Alfredo Penne". */
    variantTitle: string;
    servings: number;
  };
  preferences: {
    diet: Diet;
    avoid: string[];
    /**
     * How to choose between products that both fit an ingredient.
     * "best_rated": rank by rating. "best_price": rank by lowest price for an acceptable pack.
     * Optional, and absent means "best_rated".
     */
    budget?: BudgetPreference;
  };
  items: CartItem[];
}

export type CartState = "processing" | "ready" | "partial" | "failed";

/** A product the cart service added for an ingredient. */
export interface CartLine {
  ingredientId: string;
  productId: string;
  name: string;
  brand?: string;
  /** Human-readable pack, e.g. "200 ml". */
  packSize: string;
  /** Number of packs added. */
  quantity: number;
  /** Line total in INR (price × quantity). */
  priceInr: number;
  mrpInr?: number;
  imageUrl?: string;
}

/** Returned by POST /v1/carts and GET /v1/carts/{cartId}. */
export interface CartStatus {
  version: typeof CONTRACT_VERSION;
  cartId: string;
  requestId: string;
  status: CartState;
  provider: Provider;
  /** Deep link that opens the prepared cart in the store. Required once ready/partial. */
  cartUrl?: string;
  lines: CartLine[];
  unavailable: { ingredientId: string; name: string; reason?: string }[];
  totals?: { itemsInr: number; deliveryInr?: number; totalInr: number; currency: "INR" };
  etaMinutes?: number;
  /** Shown to the user when status is "failed" (or as a note on "partial"). */
  message?: string;
  updatedAt: string;
}
