import {
  CONTRACT_VERSION,
  type CartItem,
  type CartLine,
  type CartRequest,
  type CartStatus,
} from "./contract";

/**
 * Adapter for the cart curation service (see CONTRACT.md).
 * With CART_API_URL unset, everything is simulated locally so the app is demoable end to end.
 */

const BASE_URL = process.env.CART_API_URL?.replace(/\/+$/, "") ?? "";
const API_KEY = process.env.CART_API_KEY ?? "";
export const cartApiMode: "live" | "mock" = BASE_URL ? "live" : "mock";

export class CartApiError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: { method: "GET" | "POST" | "DELETE"; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
  } catch {
    throw new CartApiError("The cart service didn't respond. Try again in a moment.", 504);
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string; message?: string }) | null;
  if (!res.ok || !data) {
    const message = data?.error || data?.message || `Cart service error (${res.status})`;
    throw new CartApiError(message, res.status >= 400 && res.status < 500 ? res.status : 502);
  }
  return data;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const randomId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

export async function createCart(request: CartRequest): Promise<CartStatus> {
  if (cartApiMode === "live") return call<CartStatus>("/v1/carts", { method: "POST", body: request });
  await sleep(2600);
  return mockCart(request);
}

export async function getCart(cartId: string): Promise<CartStatus> {
  if (cartApiMode === "live") return call<CartStatus>(`/v1/carts/${encodeURIComponent(cartId)}`, { method: "GET" });
  // The mock resolves synchronously in createCart, so there is never anything to poll.
  throw new CartApiError("Cart not found.", 404);
}

const PACKS: Partial<Record<CartItem["unit"], number[]>> = {
  g: [100, 200, 250, 500, 1000],
  kg: [1, 2, 5],
  ml: [200, 250, 500, 1000],
  l: [1, 2, 5],
};

function mockPack(item: CartItem): { packSize: string; quantity: number } {
  const sizes = PACKS[item.unit];
  if (sizes) {
    const fit = sizes.find((s) => s >= item.quantity);
    if (fit) return { packSize: `${fit} ${item.unit}`, quantity: 1 };
    const largest = sizes[sizes.length - 1];
    return { packSize: `${largest} ${item.unit}`, quantity: Math.ceil(item.quantity / largest) };
  }
  if (item.unit === "tsp" || item.unit === "tbsp") return { packSize: item.category === "spices" ? "50 g" : "250 ml", quantity: 1 };
  if (item.unit === "bunch") return { packSize: "1 bunch", quantity: Math.max(1, Math.ceil(item.quantity)) };
  if (item.unit === "pack") return { packSize: "1 pack", quantity: Math.max(1, Math.ceil(item.quantity)) };
  return { packSize: `${Math.max(1, Math.ceil(item.quantity))} pc`, quantity: 1 };
}

function mockCart(request: CartRequest): CartStatus {
  const lines: CartLine[] = request.items.map((item, index) => {
    const { packSize, quantity } = mockPack(item);
    const unitPrice = item.estimatedPriceInr || 49;
    return {
      ingredientId: item.id,
      productId: `zp_${String(index + 1).padStart(4, "0")}`,
      name: item.name,
      packSize,
      quantity,
      priceInr: unitPrice * quantity,
      mrpInr: Math.round(unitPrice * quantity * 1.12),
    };
  });
  const itemsInr = lines.reduce((sum, line) => sum + line.priceInr, 0);
  const deliveryInr = itemsInr >= 199 ? 0 : 30;
  return {
    version: CONTRACT_VERSION,
    cartId: randomId("mock_cart"),
    requestId: request.requestId,
    status: "ready",
    provider: "zepto",
    cartUrl: "https://www.zeptonow.com/",
    lines,
    unavailable: [],
    totals: { itemsInr, deliveryInr, totalInr: itemsInr + deliveryInr, currency: "INR" },
    etaMinutes: 10,
    message: "Simulated cart: set CART_API_URL to curate a real one.",
    updatedAt: new Date().toISOString(),
  };
}
