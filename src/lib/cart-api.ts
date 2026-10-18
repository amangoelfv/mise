import { type CartRequest, type CartStatus } from "./contract";
import { defaultCatalog } from "./resolve/default-catalog";
import { resolveCart } from "./resolve/resolve-cart";
import { createZeptoSource } from "./resolve/zepto-mcp";

/**
 * Cart curation. Two modes:
 * - CART_API_URL set → delegate to an external cart service (the original contract).
 * - otherwise → resolve in-process with our engine: live Zepto MCP when the user
 *   is connected (with golden-cache fallback), else the bundled golden cache.
 *   Either way the cart is REAL products + prices, never a fabricated mock.
 */

const BASE_URL = process.env.CART_API_URL?.replace(/\/+$/, "") ?? "";
const API_KEY = process.env.CART_API_KEY ?? "";
export const cartApiMode: "live" | "local" = BASE_URL ? "live" : "local";

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

export async function createCart(request: CartRequest): Promise<CartStatus> {
  if (cartApiMode === "live") return call<CartStatus>("/v1/carts", { method: "POST", body: request });
  // In-process engine. createZeptoSource picks live MCP (connected) or golden cache,
  // and wraps live with a golden-cache fallback so it can never hard-fail.
  const source = createZeptoSource(request.connector);
  return resolveCart(request, source, defaultCatalog());
}

export async function getCart(cartId: string): Promise<CartStatus> {
  if (cartApiMode === "live") return call<CartStatus>(`/v1/carts/${encodeURIComponent(cartId)}`, { method: "GET" });
  // The in-process engine resolves synchronously in createCart; nothing to poll.
  throw new CartApiError("Cart not found.", 404);
}
