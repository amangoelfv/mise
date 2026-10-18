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

function singular(token: string): string {
  return token.endsWith("s") ? token.slice(0, -1) : token;
}

function tokenize(text: string): Set<string> {
  const tokens = normalizeName(text)
    .split(" ")
    .filter((t) => t.length > 1);
  return new Set(tokens.flatMap((t) => [t, singular(t)]));
}

function hasToken(nameTokens: ReadonlySet<string>, token: string): boolean {
  return token.length > 1 && (nameTokens.has(token) || nameTokens.has(singular(token)));
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

export function selectBestProduct(
  products: readonly ZeptoProduct[],
  query: string,
  entry: CatalogEntry | undefined,
  options: SelectOptions = {},
): ZeptoProduct | null {
  const inStock = products.filter((p) => p.availableQuantity > 0);
  const pool = inStock.length > 0 ? inStock : products;

  let best: ZeptoProduct | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const product of pool) {
    const score = scoreProduct(product, query, entry, options);
    if (score > bestScore || (score === bestScore && best !== null && product.price < best.price)) {
      best = product;
      bestScore = score;
    }
  }
  return bestScore >= TOKEN_HIT ? best : null;
}
