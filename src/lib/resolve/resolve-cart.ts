import {
  CONTRACT_VERSION,
  type CartItem,
  type CartLine,
  type CartRequest,
  type CartState,
  type CartStatus,
} from "@/lib/contract";
import type { IngredientCatalog } from "./catalog";
import { buildBrandPreference, buildPantry, probablyHave } from "./inventory";
import { normalizeName } from "./normalize";
import { resolveLine } from "./resolve-line";
import type { ZeptoSource } from "./zepto-source";

const round2 = (n: number) => Math.round(n * 100) / 100;

function pickStatus(lineCount: number, requiredUnavailable: number, toBuyCount: number): CartState {
  if (toBuyCount === 0) return "ready"; // everything already in the kitchen
  if (lineCount === 0) return "failed";
  return requiredUnavailable > 0 ? "partial" : "ready";
}

function buildMessage(
  status: CartState,
  lineCount: number,
  skippedCount: number,
  requiredUnavailable: number,
  itemsInr: number,
): string {
  if (status === "failed") return "Couldn't find these items on Zepto right now.";
  const parts = [`${lineCount} item${lineCount === 1 ? "" : "s"}, ₹${itemsInr}`];
  if (skippedCount > 0) parts.push(`${skippedCount} you already have`);
  if (requiredUnavailable > 0) parts.push(`${requiredUnavailable} unavailable`);
  return parts.join(" · ");
}

/**
 * The cart brain: order-history inventory skip -> search -> product selection
 * (rating + your-usual-brand) -> pack sizing -> totals. Pure orchestration over
 * an injected ZeptoSource, so it runs identically on the golden cache or live MCP.
 */
export async function resolveCart(
  request: CartRequest,
  source: ZeptoSource,
  catalog: IngredientCatalog,
  now: Date = new Date(),
): Promise<CartStatus> {
  const orders = await source.getOrderHistory();
  const pantry = buildPantry(orders, catalog);

  const toBuy: CartItem[] = [];
  const skipped: { ingredientId: string; name: string; reason: string }[] = [];
  for (const item of request.items) {
    const have = probablyHave(item.name, pantry, catalog, now);
    if (have) skipped.push({ ingredientId: item.id, name: item.name, reason: have.reason });
    else toBuy.push(item);
  }

  const results = await source.searchMany(toBuy.map((i) => i.searchQuery || i.name));

  // "Your usual brand": brands that appear in both order history and the candidates.
  const knownBrands = new Set<string>();
  for (const products of results.values()) {
    for (const p of products) if (p.brand) knownBrands.add(normalizeName(p.brand));
  }
  const preferredBrands = buildBrandPreference(orders, knownBrands);

  const lines: CartLine[] = [];
  const unavailable: { ingredientId: string; name: string; reason: string }[] = [];
  let requiredUnavailable = 0;
  for (const item of toBuy) {
    const products = results.get(normalizeName(item.searchQuery || item.name)) ?? [];
    const outcome = resolveLine(item, products, catalog, { preferredBrands });
    if (outcome.kind === "line") {
      lines.push(outcome.line);
    } else {
      unavailable.push(outcome.item);
      if (!item.optional) requiredUnavailable += 1;
    }
  }

  const itemsInr = round2(lines.reduce((sum, l) => sum + l.priceInr, 0));
  const deliveryInr = itemsInr >= 199 ? 0 : 30;
  const status = pickStatus(lines.length, requiredUnavailable, toBuy.length);

  return {
    version: CONTRACT_VERSION,
    cartId: `cart_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    requestId: request.requestId,
    status,
    provider: "zepto",
    cartUrl: "https://www.zeptonow.com/",
    lines,
    unavailable,
    skipped,
    totals: { itemsInr, deliveryInr, totalInr: round2(itemsInr + deliveryInr), currency: "INR" },
    etaMinutes: 10,
    message: buildMessage(status, lines.length, skipped.length, requiredUnavailable, itemsInr),
    dataSource: source.label,
    updatedAt: new Date().toISOString(),
  };
}
