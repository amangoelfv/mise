import type { IngredientCatalog } from "./catalog";
import { normalizeName } from "./normalize";

/**
 * The "knows your kitchen" brain. Builds a pantry estimate from the user's real
 * Zepto order history and decides which requested ingredients they probably have.
 * Order dates come from the order id (UUIDv7, first 48 bits = purchase time ms).
 */

export interface OrderHistoryItem {
  readonly id: string; // UUIDv7
  readonly items: readonly string[]; // product titles
}

export interface PantryEntry {
  readonly canonicalName: string;
  readonly lastAcquired: Date;
  readonly shelfLifeDays: number;
}

export interface HaveDecision {
  readonly canonicalName: string;
  readonly lastAcquiredDaysAgo: number;
  readonly shelfLifeDays: number;
  readonly reason: string;
}

/** Timestamp embedded in a UUIDv7 (first 48 bits = unix ms). Null unless truly v7. */
export function uuidV7ToDate(id: string): Date | null {
  const hex = id.replace(/-/g, "");
  if (hex.length < 13 || !/^[0-9a-f]+$/i.test(hex)) return null;
  if (hex[12] !== "7") return null; // version nibble must be 7
  const ms = parseInt(hex.slice(0, 12), 16);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return new Date(ms);
}

export function buildPantry(
  orders: readonly OrderHistoryItem[],
  catalog: IngredientCatalog,
): Map<string, PantryEntry> {
  const pantry = new Map<string, PantryEntry>();
  for (const order of orders) {
    const date = uuidV7ToDate(order.id);
    if (!date) continue;
    for (const title of order.items) {
      const entry = catalog.findInText(title);
      if (!entry) continue;
      const existing = pantry.get(entry.canonicalName);
      if (!existing || date > existing.lastAcquired) {
        pantry.set(entry.canonicalName, {
          canonicalName: entry.canonicalName,
          lastAcquired: date,
          shelfLifeDays: entry.defaultShelfLifeDays,
        });
      }
    }
  }
  return pantry;
}

/** Brand names the user buys (from order history titles) — gently preferred in selection. */
export function buildBrandPreference(
  orders: readonly OrderHistoryItem[],
  knownBrands: ReadonlySet<string>,
): Set<string> {
  const preferred = new Set<string>();
  for (const order of orders) {
    for (const title of order.items) {
      const norm = normalizeName(title);
      for (const brand of knownBrands) {
        if (brand && norm.includes(brand)) preferred.add(brand);
      }
    }
  }
  return preferred;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function probablyHave(
  ingredientName: string,
  pantry: ReadonlyMap<string, PantryEntry>,
  catalog: IngredientCatalog,
  now: Date = new Date(),
): HaveDecision | null {
  const entry = catalog.resolve(ingredientName);
  if (!entry) return null;
  const pantryEntry = pantry.get(entry.canonicalName);
  if (!pantryEntry) return null;

  const daysAgo = Math.floor((now.getTime() - pantryEntry.lastAcquired.getTime()) / MS_PER_DAY);
  if (daysAgo < 0 || daysAgo >= pantryEntry.shelfLifeDays) return null;

  return {
    canonicalName: entry.canonicalName,
    lastAcquiredDaysAgo: daysAgo,
    shelfLifeDays: pantryEntry.shelfLifeDays,
    reason: `bought ${daysAgo} day${daysAgo === 1 ? "" : "s"} ago, lasts ${pantryEntry.shelfLifeDays}`,
  };
}
