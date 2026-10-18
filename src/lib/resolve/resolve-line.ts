import type { CartItem, CartLine } from "@/lib/contract";
import type { IngredientCatalog } from "./catalog";
import { parsePackSize, type PackKind } from "./pack-size";
import { selectBestProduct, type SelectOptions } from "./product-select";
import type { ZeptoProduct } from "./zepto-types";

/**
 * Resolve one requested item against Zepto search results into a priced cart line
 * or an unavailable entry. Pure: search is done by the caller and passed in.
 */

export type ResolveOutcome =
  | { readonly kind: "line"; readonly line: CartLine }
  | { readonly kind: "unavailable"; readonly item: { ingredientId: string; name: string; reason: string } };

const MAX_PACKS = 99;

function neededBase(
  item: CartItem,
  conversions: Readonly<Record<string, number>> | undefined,
  gramsPerPiece: number | undefined,
): { kind: PackKind; amount: number } | null {
  const unit = item.unit.toLowerCase();
  const qty = item.quantity;
  if (!Number.isFinite(qty) || qty <= 0) return null;

  switch (unit) {
    case "g":
      return { kind: "mass", amount: qty };
    case "kg":
      return { kind: "mass", amount: qty * 1000 };
    case "ml":
      return { kind: "volume", amount: qty };
    case "l":
      return { kind: "volume", amount: qty * 1000 };
    default:
      break;
  }

  const factor = conversions?.[unit];
  if (typeof factor === "number" && Number.isFinite(factor)) return { kind: "mass", amount: qty * factor };

  if ((unit === "pcs" || unit === "pc" || unit === "piece") && gramsPerPiece) {
    return { kind: "mass", amount: qty * gramsPerPiece };
  }
  return null;
}

export function computePackCount(
  item: CartItem,
  packBase: number,
  packKind: PackKind,
  conversions?: Readonly<Record<string, number>>,
  gramsPerPiece?: number,
): number {
  const need = neededBase(item, conversions, gramsPerPiece);
  if (need && need.kind === packKind && packBase > 0 && Number.isFinite(need.amount)) {
    const packs = Math.ceil(need.amount / packBase);
    if (!Number.isFinite(packs) || packs < 1) return 1;
    return Math.min(packs, MAX_PACKS);
  }
  return 1;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function resolveLine(
  item: CartItem,
  products: readonly ZeptoProduct[],
  catalog: IngredientCatalog,
  options: SelectOptions = {},
): ResolveOutcome {
  const entry = catalog.resolve(item.name) ?? catalog.resolve(item.searchQuery);
  const best = selectBestProduct(products, item.searchQuery || item.name, entry, options);

  if (!best) {
    return {
      kind: "unavailable",
      item: {
        ingredientId: item.id,
        name: item.name,
        reason: products.length === 0 ? "not_found" : "no_match",
      },
    };
  }

  const pack = parsePackSize(best.packSize);
  const quantity = computePackCount(item, pack.base, pack.kind, entry?.conversions, entry?.gramsPerPiece);
  const unitInr = best.price / 100;
  const unitMrpInr = best.mrp / 100;

  return {
    kind: "line",
    line: {
      ingredientId: item.id,
      productId: best.productVariantId,
      name: best.name,
      ...(best.brand ? { brand: best.brand } : {}),
      packSize: best.packSize,
      quantity,
      priceInr: round2(unitInr * quantity), // line total (contract: price × quantity)
      mrpInr: round2(unitMrpInr * quantity),
      ...(best.imageUrl ? { imageUrl: best.imageUrl } : {}),
    },
  };
}
