import { isAdmin } from "@/lib/admin";
import { fail, num, readJson, requireUser, str } from "@/lib/http";
import { notifyOrderPlaced } from "@/lib/notify";
import { type NewOrder, type OrderLine, orderStore } from "@/lib/orders";

function sanitizeLines(value: unknown): OrderLine[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 40).flatMap((raw) => {
    const l = (raw ?? {}) as Record<string, unknown>;
    const name = str(l.name, "", 120);
    if (!name) return [];
    const imageUrl = str(l.imageUrl, "", 400);
    return [
      {
        name,
        packSize: str(l.packSize, "", 40),
        quantity: Math.max(1, Math.round(num(l.quantity, 1, 1, 99))),
        priceInr: Math.round(num(l.priceInr, 0, 0, 1_000_000)),
        ...(imageUrl ? { imageUrl } : {}),
      },
    ];
  });
}

/** Create an order for home delivery. The operator fulfils it from the admin view. */
export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const body = await readJson(req);
  const contact = (body.contact ?? {}) as Record<string, unknown>;
  const address = (body.address ?? {}) as Record<string, unknown>;
  const dish = (body.dish ?? {}) as Record<string, unknown>;
  const totals = (body.totals ?? {}) as Record<string, unknown>;

  const name = str(contact.name, "", 60);
  const phone = str(contact.phone, "", 20).replace(/[^\d+]/g, "");
  const line = str(address.line, "", 200);
  const lines = sanitizeLines(body.lines);

  if (!name) return fail("Please add a name for the delivery.");
  if (phone.replace(/\D/g, "").length < 10) return fail("Please add a valid 10-digit phone number.");
  if (!line) return fail("Please add a delivery address.");
  if (!lines.length) return fail("This cart has no items to order.");

  const itemsInr = Math.round(num(totals.itemsInr, 0, 0, 1_000_000));
  const deliveryInr = Math.round(num(totals.deliveryInr, 0, 0, 100000));
  const totalInr = Math.round(num(totals.totalInr, itemsInr + deliveryInr, 0, 1_000_000));

  const order: NewOrder = {
    user: { id: user.id, email: user.email },
    dish: {
      name: str(dish.name, "", 80),
      variantTitle: str(dish.variantTitle, "", 80),
      styleLabel: str(dish.styleLabel, "", 40) || undefined,
    },
    contact: { name, phone },
    address: {
      line,
      landmark: str(address.landmark, "", 120) || undefined,
      pincode: str(address.pincode, "", 6) || undefined,
    },
    lines,
    totals: { itemsInr, deliveryInr, totalInr },
    etaMinutes: Math.round(num(body.etaMinutes, 10, 1, 240)),
    cartId: str(body.cartId, "", 48),
  };

  const created = await orderStore.create(order);
  await notifyOrderPlaced(created); // email the operator (no-op if Resend isn't configured)
  return Response.json({ order: { id: created.id, status: created.status, etaMinutes: created.etaMinutes } });
}

/** List orders. Operators (ADMIN_ENABLED) see all; everyone else sees their own. */
export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const all = await orderStore.list();
  const orders = (await isAdmin()) ? all : all.filter((o) => o.user.id === user.id);
  return Response.json({ orders });
}
