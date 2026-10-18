import type { CatalogEntry } from "./catalog";
import { normalizeName } from "./normalize";
import type { ZeptoProduct } from "./zepto-types";

/**
 * Deterministic product selection from noisy Zepto search results, with optional
 * rating + brand personalization.
 *
 *   + token overlap between query and product name (whole-token, singular-aware)
 *   − heavy penalty for a catalog negativeKeyword (wrong product)
 *   − small penalty for snack/processed qualifiers (prefer the raw ingredient)
 *   + rating nudge (when details are known) and a bonus for the user's usual brand
 *   + tiny in-stock nudge
 * Ties break to lower price. Must clear a positive threshold, else unavailable.
 */

const TOKEN_HIT = 2;
const NEGATIVE_PENALTY = 5;
const PROCESSED_PENALTY = 0.6;
const STOCK_BONUS = 0.5;
const RATING_WEIGHT = 1; // (rating - 4.0) -> up to ~0.9, breaks ties, never overrides a name match
const BRAND_BONUS = 1;

const PROCESSED_QUALIFIERS = new Set([
  "roasted",
  "fried",
  "namkeen",
  "chips",
  "wafers",
  "flavour",
  "flavoured",
  "flavored",
  "snack",
  "snacks",
]);

/** Stem variants: the token itself, -s and -es stripped. Handles tomatoes→tomato, potatoes→potato, grapes→grape. */
function stems(token: string): string[] {
  const out = [token];
  if (token.endsWith("es") && token.length > 3) out.push(token.slice(0, -2));
  if (token.endsWith("s") && token.length > 2) out.push(token.slice(0, -1));
  return out;
}

function tokenize(text: string): Set<string> {
  const tokens = normalizeName(text)
    .split(" ")
    .filter((t) => t.length > 1);
  return new Set(tokens.flatMap(stems));
}

function hasToken(nameTokens: ReadonlySet<string>, token: string): boolean {
  return token.length > 1 && stems(token).some((s) => nameTokens.has(s));
}

export interface SelectOptions {
  /** Normalized brand names the user buys often (order history) — gently preferred. */
  readonly preferredBrands?: ReadonlySet<string>;
}

export function scoreProduct(
  product: ZeptoProduct,
  query: string,
  entry: CatalogEntry | undefined,
  options: SelectOptions = {},
): number {
  const nameTokens = tokenize(product.name);
  const queryTokens = normalizeName(query)
    .split(" ")
    .filter((t) => t.length > 1);

  let score = 0;
  for (const t of queryTokens) if (hasToken(nameTokens, t)) score += TOKEN_HIT;

  for (const neg of entry?.negativeKeywords ?? []) {
    const negTokens = normalizeName(neg)
      .split(" ")
      .filter((t) => t.length > 1);
    if (negTokens.length > 0 && negTokens.every((t) => hasToken(nameTokens, t))) {
      score -= NEGATIVE_PENALTY;
    }
  }

  for (const token of nameTokens) if (PROCESSED_QUALIFIERS.has(token)) score -= PROCESSED_PENALTY;

  if (typeof product.averageRating === "number") score += RATING_WEIGHT * (product.averageRating - 4);
  if (product.brand && options.preferredBrands?.has(normalizeName(product.brand))) score += BRAND_BONUS;

  if (product.availableQuantity > 0) score += STOCK_BONUS;
  return score;
}

export interface Selection {
  readonly product: ZeptoProduct;
  /** Short, human-readable explanation of why this product was chosen. */
  readonly reason: string;
  /** How many in-stock candidates it was chosen from. */
  readonly fromCount: number;
}

/** A transparent, plain-English "why this one" from the winning product's signals. */
function explain(product: ZeptoProduct, entry: CatalogEntry | undefined, options: SelectOptions, fromCount: number): string {
  const parts: string[] = [];
  if (product.brand && options.preferredBrands?.has(normalizeName(product.brand))) parts.push("your usual brand");
  if (typeof product.averageRating === "number" && product.averageRating >= 4) {
    parts.push(`rated ${product.averageRating.toFixed(1)}★`);
  }
  if (parts.length === 0) parts.push(entry ? `best match for ${entry.canonicalName}` : "best match");
  if (fromCount > 1) parts.push(`chosen from ${fromCount}`);
  return parts.join(" · ");
}

export function selectBestProduct(
  products: readonly ZeptoProduct[],
  query: string,
  entry: CatalogEntry | undefined,
  options: SelectOptions = {},
): Selection | null {
  // Discard products with invalid pricing (price 0 is bad data, not a free item);
  // otherwise the lowest-price tie-break would always pick them.
  const usable = products.filter((p) => p.price > 0);
  if (usable.length === 0) return null;
  const inStock = usable.filter((p) => p.availableQuantity > 0);
  const pool = inStock.length > 0 ? inStock : usable;

  let best: ZeptoProduct | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const product of pool) {
    const score = scoreProduct(product, query, entry, options);
    if (score > bestScore || (score === bestScore && best !== null && product.price < best.price)) {
      best = product;
      bestScore = score;
    }
  }
  if (!best || bestScore < TOKEN_HIT) return null;
  return { product: best, reason: explain(best, entry, options, pool.length), fromCount: pool.length };
}
