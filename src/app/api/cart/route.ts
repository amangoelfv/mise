import { CartApiError, createCart } from "@/lib/cart-api";
import { CONTRACT_VERSION, type CartItem, type CartRequest } from "@/lib/contract";
import { BUDGETS, CATEGORIES, DIETS, STYLES, UNITS, fail, num, oneOf, readJson, requireUser, str, strList } from "@/lib/http";
import { cartConnector } from "@/lib/connectors";
import { notifyCartBuilt } from "@/lib/notify";
import { styleById } from "@/lib/styles";

function sanitizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 40).flatMap((raw, index) => {
    const i = (raw ?? {}) as Record<string, unknown>;
    const name = str(i.name, "", 60);
    if (!name) return [];
    const notes = str(i.notes, "", 80);
    const price = num(i.estimatedPriceInr, 0, 0, 20000);
    return [
      {
        id: str(i.id, `ing_${String(index + 1).padStart(2, "0")}`, 24),
        name,
        searchQuery: str(i.searchQuery, name, 80),
        quantity: Math.round(num(i.quantity, 1, 0, 100000) * 100) / 100,
        unit: oneOf(i.unit, UNITS, "pcs"),
        category: oneOf(i.category, CATEGORIES, "other"),
        optional: i.optional === true,
        pantryStaple: i.pantryStaple === true,
        substitutes: strList(i.substitutes, 2, 40),
        ...(notes ? { notes } : {}),
        ...(price ? { estimatedPriceInr: Math.round(price) } : {}),
      },
    ];
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await readJson(req);
  const dish = (body.dish ?? {}) as Record<string, unknown>;
  const items = sanitizeItems(body.items);
  if (!items.length) return fail("Pick at least one ingredient.");

  const dryRun = body.dryRun === true;
  console.info(`[cart] POST ${dryRun ? "(dry run) " : ""}dish="${str(dish.name, "", 60)}" items=${items.length} user=${user.email}`);
  const connector = await cartConnector(user);
  console.info(`[cart] connector = ${connector ? connector.transport : "none"}`);
  if (!connector && !dryRun) return fail("Connect Zepto first.", 409, "connect_zepto");

  const style = oneOf(dish.style, STYLES, "basic");
  const pincode = str(body.pincode, "", 6);
  const request: CartRequest = {
    version: CONTRACT_VERSION,
    requestId: `req_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    source: "mise-web",
    user: { id: user.id, email: user.email, name: user.name },
    connector: connector ?? { provider: "zepto", transport: "simulated", connectionId: "not_connected" },
    ...(/^\d{6}$/.test(pincode) ? { delivery: { pincode } } : {}),
    dish: {
      query: str(dish.query, "", 80),
      name: str(dish.name, "", 60),
      cuisine: str(dish.cuisine, "", 60) || undefined,
      style,
      styleLabel: styleById(style).label,
      variantTitle: str(dish.variantTitle, "", 48),
      servings: Math.round(num(body.servings, 2, 1, 12)),
    },
    preferences: {
      diet: oneOf(body.diet, DIETS, "any"),
      avoid: strList(body.avoid, 10, 40),
      budget: oneOf(body.budget, BUDGETS, "best_rated"),
    },
    items,
  };

  if (dryRun) {
    // Preview for the UI: never expose the real connection handle to the browser.
    const masked = {
      ...request,
      connector:
        request.connector.transport === "mcp" ? { ...request.connector, accessToken: "eyJ•••• (sent to the cart API only)" } : request.connector,
    };
    return Response.json({ request: masked });
  }

  try {
    const status = await createCart(request);
    // Optional heads-up that a cart was built (gated by NOTIFY_CART_BUILD); never blocks the response.
    void notifyCartBuilt({
      dish: request.dish.name,
      itemCount: status.lines.length,
      totalInr: status.totals?.totalInr ?? 0,
      user: user.email,
      dataSource: status.dataSource,
    });
    return Response.json({ status });
  } catch (error) {
    console.error("[cart]", error);
    if (error instanceof CartApiError) return fail(error.message, error.status);
    return fail("Couldn't build your cart. Try again?", 502);
  }
}
