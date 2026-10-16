/**
 * Client-safe view of the built-in menu (src/lib/feed.ts builds CATALOG on the server and passes
 * it down as props), plus the autocomplete matcher. No ingredient lists here, so it stays tiny.
 */

export const MENU_GROUPS = ["Breakfast", "Curries & dals", "Rice & one-pot", "Street & Indo-Chinese", "Pasta"] as const;
export type MenuGroup = (typeof MENU_GROUPS)[number];

export interface CatalogDish {
  id: string;
  name: string;
  aliases: string[];
  cuisine: string;
  summary: string;
  veg: boolean;
  group: MenuGroup;
  /** Fastest style's time, for "from N min". */
  minutes: number;
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function scoreKey(key: string, q: string): number {
  if (key === q) return 100;
  if (key.startsWith(q)) return 90 - Math.min(key.length - q.length, 30) * 0.2;
  if (key.split(" ").some((word) => word.startsWith(q))) return 75;
  if (q.length >= 3 && key.includes(q)) return 55;
  return 0;
}

/** Ranks dishes for what's typed so far: names first, then aliases, then cuisine. */
export function searchCatalog(catalog: CatalogDish[], query: string, limit = 6): CatalogDish[] {
  const q = normalise(query);
  if (!q) return [];
  return catalog
    .map((dish) => {
      const name = scoreKey(normalise(dish.name), q);
      const alias = Math.max(0, ...dish.aliases.map((a) => scoreKey(normalise(a), q))) * 0.92;
      const cuisine = scoreKey(normalise(dish.cuisine), q) * 0.5;
      return { dish, score: Math.max(name, alias, cuisine) };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.dish.name.localeCompare(b.dish.name))
    .slice(0, limit)
    .map((m) => m.dish);
}
