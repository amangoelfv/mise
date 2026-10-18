import type { IngredientCategory, PurchaseStrategy } from "./ingredient";
import { normalizeName, pluralInsensitiveKey } from "./normalize";

/**
 * Canonical ingredient definition — the extensibility backbone. Add one entry to
 * support a new ingredient; everything else matches on canonicalName.
 */
export interface CatalogEntry {
  readonly canonicalName: string;
  readonly aliases: readonly string[];
  readonly category: IngredientCategory;
  readonly purchaseStrategy: PurchaseStrategy;
  readonly defaultShelfLifeDays: number;
  /** For measured items: recipe unit -> base units (grams/millilitres). */
  readonly conversions?: Readonly<Record<string, number>>;
  /** Words that, in a product name, mean it's the WRONG product (reject noise). */
  readonly negativeKeywords?: readonly string[];
  /** For count produce sold by weight (onion, tomato): approx grams per piece. */
  readonly gramsPerPiece?: number;
}

interface KeyIndexEntry {
  readonly entry: CatalogEntry;
  readonly tokens: readonly string[];
}

/** Immutable, indexed lookup: resolve a name/alias, or find the ingredient in a product title. */
export class IngredientCatalog {
  private readonly exactIndex: ReadonlyMap<string, CatalogEntry>;
  private readonly pluralIndex: ReadonlyMap<string, CatalogEntry>;
  private readonly keyIndex: readonly KeyIndexEntry[];

  constructor(entries: readonly CatalogEntry[]) {
    const exact = new Map<string, CatalogEntry>();
    const plural = new Map<string, CatalogEntry>();
    const keyIndex: KeyIndexEntry[] = [];

    for (const entry of entries) {
      for (const key of [entry.canonicalName, ...entry.aliases]) {
        const exactKey = normalizeName(key);
        if (!exact.has(exactKey)) exact.set(exactKey, entry);
        const pluralKey = pluralInsensitiveKey(key);
        if (!plural.has(pluralKey)) plural.set(pluralKey, entry);
        const tokens = exactKey.split(" ").filter((t) => t.length > 1);
        if (tokens.length > 0) keyIndex.push({ entry, tokens });
      }
    }
    keyIndex.sort((a, b) => b.tokens.length - a.tokens.length); // most specific first

    this.exactIndex = exact;
    this.pluralIndex = plural;
    this.keyIndex = keyIndex;
  }

  resolve(rawName: string): CatalogEntry | undefined {
    const exactHit = this.exactIndex.get(normalizeName(rawName));
    if (exactHit) return exactHit;
    return this.pluralIndex.get(pluralInsensitiveKey(rawName));
  }

  /** Finds which ingredient a free-form product title refers to (order history). */
  findInText(text: string): CatalogEntry | undefined {
    const titleTokens = new Set(
      normalizeName(text)
        .split(" ")
        .filter((t) => t.length > 1)
        .flatMap((t) => [t, t.endsWith("s") ? t.slice(0, -1) : t]),
    );
    for (const { entry, tokens } of this.keyIndex) {
      const allPresent = tokens.every(
        (t) => titleTokens.has(t) || titleTokens.has(t.endsWith("s") ? t.slice(0, -1) : t),
      );
      if (!allPresent) continue;
      const conflict = (entry.negativeKeywords ?? []).some((neg) => {
        const negTokens = normalizeName(neg)
          .split(" ")
          .filter((t) => t.length > 1);
        return negTokens.length > 0 && negTokens.every((t) => titleTokens.has(t));
      });
      if (!conflict) return entry;
    }
    return undefined;
  }
}
