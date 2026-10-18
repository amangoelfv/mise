import {
  CONTRACT_VERSION,
  type CartItem,
  type CartLine,
  type CartRequest,
  type CartState,
  type CartStatus,
} from "@/lib/contract";
import type { AiProductSelector } from "@/lib/gemini";
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
  /** Optional AI selector (style/brand-aware). Falls back to the deterministic scorer. */
  aiSelect?: AiProductSelector,
): Promise<CartStatus> {
  const orders = await source.getOrderHistory();
  const pantry = buildPantry(orders, catalog);

  const toBuy: CartItem[] = [];
  const skipped: NonNullable<CartStatus["skipped"]> = [];
  for (const item of request.items) {
    const have = probablyHave(item.name, pantry, catalog, now);
    if (have) {
      skipped.push({
        ingredientId: item.id,
        name: item.name,
        reason: have.reason,
        boughtDaysAgo: have.lastAcquiredDaysAgo,
        shelfLifeDays: have.shelfLifeDays,
      });
      console.info(`[resolve] skip "${item.name}" — already have (${have.reason})`);
    } else {
      toBuy.push(item);
    }
  }
  console.info(`[resolve] ${request.items.length} items → ${toBuy.length} to search, ${skipped.length} already have (${orders.length} past orders)`);

  const results = await source.searchMany(toBuy.map((i) => i.searchQuery || i.name));

  // "Your usual brand": brands that appear in both order history and the candidates.
  const knownBrands = new Set<string>();
  for (const products of results.values()) {
    for (const p of products) if (p.brand) knownBrands.add(normalizeName(p.brand));
  }
  const preferredBrands = buildBrandPreference(orders, knownBrands);

  // Optional AI selection: let Gemini pick the best product per ingredient for the
  // dish style/diet. Only asked when there's a real choice; algo decides otherwise.
  let aiPicks = new Map<string, { pid: string; reason: string }>();
  if (aiSelect) {
    const aiItems = toBuy
      .map((item) => ({
        id: item.id,
        ingredient: item.name,
        options: (results.get(normalizeName(item.searchQuery || item.name)) ?? [])
          .filter((p) => p.price > 0 && p.availableQuantity > 0)
          .slice(0, 5)
          .map((p) => ({
            pid: p.productVariantId,
            name: p.name,
            pack: p.packSize,
            price: Math.round(p.price / 100),
            rating: p.averageRating ?? null,
          })),
      }))
      .filter((i) => i.options.length > 1);
    if (aiItems.length > 0) {
      try {
        aiPicks = await aiSelect(aiItems, { style: request.dish.style, diet: request.preferences.diet });
      } catch (error) {
        console.warn("[resolve] AI selection failed, using algo picks:", error);
      }
    }
  }

  const lines: CartLine[] = [];
  const unavailable: { ingredientId: string; name: string; reason: string }[] = [];
  let requiredUnavailable = 0;
  for (const item of toBuy) {
    const products = results.get(normalizeName(item.searchQuery || item.name)) ?? [];
    const outcome = resolveLine(item, products, catalog, { preferredBrands }, aiPicks.get(item.id));
    if (outcome.kind === "line") {
      lines.push(outcome.line);
      console.info(
        `[resolve] "${item.name}" → ${outcome.line.name} (${outcome.line.packSize} ×${outcome.line.quantity}, ₹${outcome.line.priceInr}) from ${products.length} candidates`,
      );
    } else {
      unavailable.push(outcome.item);
      if (!item.optional) requiredUnavailable += 1;
      console.warn(`[resolve] "${item.name}" → UNAVAILABLE (${outcome.item.reason}, ${products.length} candidates)`);
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
