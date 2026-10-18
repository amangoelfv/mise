/**
 * Internal ingredient taxonomy for the resolver (shelf-life + purchase strategy
 * defaults). This is separate from the contract's CartItem.category — it is our
 * own classification that drives inventory and pack decisions.
 */

export type IngredientCategory =
  | "staple" // salt, sugar, oil — long shelf life
  | "spice" // haldi, garam masala
  | "fresh" // onion, tomato, coriander
  | "dairy" // milk, butter, paneer, curd, cheese
  | "grain" // atta, rice, pasta, bread
  | "sauce" // ketchup, pasta sauce
  | "protein" // eggs, chicken, tofu
  | "beverage"
  | "other";

/**
 * How an ingredient becomes a purchasable quantity:
 * - `binary`   : have-it-or-not; if missing, buy one default pack (staples/spices).
 * - `count`    : buy by whole units (2 onions).
 * - `measured` : convert the recipe amount to a buyable amount, then size packs.
 */
export type PurchaseStrategy = "binary" | "count" | "measured";

const SHELF_LIFE_DEFAULTS: Record<IngredientCategory, number> = {
  staple: 365,
  spice: 365,
  fresh: 5,
  dairy: 7,
  grain: 180,
  sauce: 180,
  protein: 3,
  beverage: 30,
  other: 30,
};

const STRATEGY_DEFAULTS: Record<IngredientCategory, PurchaseStrategy> = {
  staple: "binary",
  spice: "binary",
  fresh: "count",
  dairy: "measured",
  grain: "measured",
  sauce: "measured",
  protein: "measured",
  beverage: "measured",
  other: "measured",
};

export function defaultShelfLifeForCategory(category: IngredientCategory): number {
  return SHELF_LIFE_DEFAULTS[category];
}

export function defaultStrategyForCategory(category: IngredientCategory): PurchaseStrategy {
  return STRATEGY_DEFAULTS[category];
}
