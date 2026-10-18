import type { OrderRecord } from "@/lib/orders";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Read-only list of incoming orders for the operator to fulfil and deliver. */
export function AdminOrders({ orders }: { orders: OrderRecord[] }) {
  if (orders.length === 0) {
    return <p className="rounded-[12px] border border-line bg-ink-2 px-5 py-6 text-center text-[14px] text-paper/45">No orders yet.</p>;
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="panel p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold">
                {o.dish.variantTitle || o.dish.name}
                {o.dish.styleLabel ? <span className="tag ml-2 align-middle">{o.dish.styleLabel}</span> : null}
              </p>
              {o.dish.variantTitle && <p className="text-[12px] text-paper/45">{o.dish.name}</p>}
              <p className="mt-0.5 text-[13px] text-paper/70">
                {o.contact.name} · {o.contact.phone}
              </p>
              <p className="mt-0.5 text-[13px] text-paper/55">
                {o.address.line}
                {o.address.landmark ? `, ${o.address.landmark}` : ""}
                {o.address.pincode ? ` – ${o.address.pincode}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="dots text-[18px]">{inr(o.totals.totalInr)}</p>
              <span className="tag mt-1 border-saffron/30 text-saffron">{o.status}</span>
              <p className="mt-1 font-mono text-[10.5px] text-paper/35">{new Date(o.createdAt).toLocaleString("en-IN")}</p>
            </div>
          </div>
          <details className="group mt-3 border-t border-line pt-2">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[12.5px] text-paper/50 [&::-webkit-details-marker]:hidden">
              {o.lines.length} item{o.lines.length === 1 ? "" : "s"} · {o.id}
            </summary>
            <ul className="mt-2 space-y-1">
              {o.lines.map((l, i) => (
                <li key={`${o.id}-${i}`} className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-paper/80">
                    {l.name}
                    <span className="ml-2 font-mono text-[11px] text-paper/40">
                      {l.packSize}
                      {l.quantity > 1 ? ` ×${l.quantity}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-paper/70">{inr(l.priceInr)}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      ))}
    </div>
  );
}
