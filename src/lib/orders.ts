/**
 * Orders placed by users for home delivery. Mise builds the cart on the single
 * operator Zepto account and the operator fulfils + delivers to the user's address
 * (Zepto's API can't place orders, and it's the operator's account/payment).
 *
 * Storage is an in-memory store behind a small interface so it can be swapped for
 * Firestore later without touching the routes. In-memory is fine for a single
 * running instance (the demo); it resets on restart.
 */

export type OrderStatus = "requested" | "placing" | "placed" | "delivered" | "cancelled";

export interface OrderContact {
  name: string;
  phone: string;
}

export interface OrderAddress {
  line: string;
  landmark?: string;
  pincode?: string;
}

export interface OrderLine {
  name: string;
  packSize: string;
  quantity: number;
  priceInr: number;
  imageUrl?: string;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  status: OrderStatus;
  user: { id: string; email: string };
  dish: { name: string; variantTitle: string; styleLabel?: string };
  contact: OrderContact;
  address: OrderAddress;
  lines: OrderLine[];
  totals: { itemsInr: number; deliveryInr: number; totalInr: number };
  etaMinutes?: number;
  cartId: string;
}

export type NewOrder = Omit<OrderRecord, "id" | "createdAt" | "status">;

export interface OrderStore {
  create(order: NewOrder): Promise<OrderRecord>;
  get(id: string): Promise<OrderRecord | null>;
  list(): Promise<OrderRecord[]>;
  setStatus(id: string, status: OrderStatus): Promise<OrderRecord | null>;
}

class InMemoryOrderStore implements OrderStore {
  private readonly orders = new Map<string, OrderRecord>();

  create(order: NewOrder): Promise<OrderRecord> {
    const id = `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const record: OrderRecord = { ...order, id, createdAt: new Date().toISOString(), status: "requested" };
    this.orders.set(id, record);
    const recipe = order.dish.variantTitle || order.dish.name;
    console.info(
      `[orders] created ${id} for ${order.user.email}: "${recipe}"${order.dish.styleLabel ? ` [${order.dish.styleLabel}]` : ""} ` +
        `${order.lines.length} items → ${order.address.line} (₹${order.totals.totalInr})`,
    );
    return Promise.resolve(record);
  }

  get(id: string): Promise<OrderRecord | null> {
    return Promise.resolve(this.orders.get(id) ?? null);
  }

  list(): Promise<OrderRecord[]> {
    return Promise.resolve([...this.orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  setStatus(id: string, status: OrderStatus): Promise<OrderRecord | null> {
    const order = this.orders.get(id);
    if (!order) return Promise.resolve(null);
    const updated = { ...order, status };
    this.orders.set(id, updated);
    return Promise.resolve(updated);
  }
}

// Module-level singleton so every request in this instance shares the same orders.
const globalForOrders = globalThis as unknown as { __miseOrderStore?: OrderStore };
export const orderStore: OrderStore = (globalForOrders.__miseOrderStore ??= new InMemoryOrderStore());
