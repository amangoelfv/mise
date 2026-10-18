import { IngredientCatalog } from "./catalog";
import { SEED_CATALOG } from "./catalog-data";

let instance: IngredientCatalog | null = null;

/** Shared, lazily-built catalog from the seed taxonomy. */
export function defaultCatalog(): IngredientCatalog {
  return (instance ??= new IngredientCatalog(SEED_CATALOG));
}
