"use client";

import { inr } from "@/lib/client";
import type { CartLine, CartStatus } from "@/lib/contract";
import { ArrowLeft, ArrowRight, Check, Close, Minus, Plus, Refresh } from "../icons";

export type CartPhase =
  | { phase: "building" }
  | { phase: "ready"; status: CartStatus }
  | { phase: "placing"; status: CartStatus }
  | { phase: "placed"; status: CartStatus; order: { id: string; etaMinutes?: number }; address: string }
  | { phase: "failed"; message: string };

// ── In-cart edits (remove / change quantity / add back a skipped item) ──────────
export interface CartEdits {
  removed: ReadonlySet<string>;
  qty: Readonly<Record<string, number>>;
  /** Keys of "already have" items the user chose to add back into the cart. */
  added: ReadonlySet<string>;
}
export const EMPTY_EDITS: CartEdits = { removed: new Set(), qty: {}, added: new Set() };
export const lineKey = (l: Pick<CartLine, "ingredientId" | "productId">) => `${l.ingredientId}-${l.productId}`;

/** The cart as the user has edited it: skipped items added back, removed lines dropped, quantities (and prices) adjusted, totals recomputed. */
export function effectiveCart(status: CartStatus, edits: CartEdits) {
  const addedBack = (status.skipped ?? [])
    .map((s) => s.line)
    .filter((l): l is CartLine => !!l && edits.added.has(lineKey(l)));
  const lines = [...status.lines, ...addedBack]
    .filter((l) => !edits.removed.has(lineKey(l)))
    .map((l) => {
      const q = edits.qty[lineKey(l)] ?? l.quantity;
      if (q === l.quantity || l.quantity <= 0) return l;
      const unit = l.priceInr / l.quantity;
      const unitMrp = l.mrpInr != null ? l.mrpInr / l.quantity : undefined;
      return { ...l, quantity: q, priceInr: Math.round(unit * q), ...(unitMrp != null ? { mrpInr: Math.round(unitMrp * q) } : {}) };
    });
  const itemsInr = lines.reduce((s, l) => s + l.priceInr, 0);
  const deliveryInr = lines.length === 0 ? 0 : itemsInr >= 199 ? 0 : 30;
  const packs = lines.reduce((s, l) => s + l.quantity, 0);
  return { lines, itemsInr, deliveryInr, totalInr: itemsInr + deliveryInr, packs };
}

const BUILD_LOG = ["Sending list to Zepto", "Matching products", "Picking pack sizes", "Checking stock nearby", "Assembling cart"];

export function CartView({
  cart,
  variantTitle,
  styleLabel,
  itemCount,
  edits,
  onRemove,
  onQty,
  onAddBack,
  onPlaceOrder,
  onRetry,
  onBack,
  onStartOver,
}: {
  cart: CartPhase;
  variantTitle: string;
  styleLabel?: string;
  itemCount: number;
  edits: CartEdits;
  onRemove: (key: string) => void;
  onQty: (key: string, delta: number) => void;
  onAddBack: (key: string) => void;
  onPlaceOrder: () => void;
  onRetry: () => void;
  onBack: () => void;
  onStartOver: () => void;
}) {
  if (cart.phase === "building") {
    return (
      <section className="mx-auto mt-8 w-full max-w-md text-center">
        <h1 className="display animate-rise text-[clamp(1.8rem,4.4vw,2.6rem)]">Building your cart</h1>
        <p className="mt-2 text-paper/50">
          {itemCount} ingredients for {variantTitle}
        </p>
        <ol className="receipt mt-10 space-y-2.5 px-6 py-5 text-left font-mono text-[12.5px] uppercase tracking-[0.06em]">
          {BUILD_LOG.map((line, i) => (
            <li key={line} className="log-line flex items-baseline gap-2 text-paper/70" style={{ "--i": i } as React.CSSProperties}>
              <span>{line}</span>
              <span className="leader" />
              <span className="log-ok text-herb">OK</span>
              {i === BUILD_LOG.length - 1 && <span className="printing text-saffron" />}
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (cart.phase === "failed") {
    return (
      <section className="animate-rise mx-auto mt-8 flex max-w-md flex-col items-center text-center">
        <h1 className="display text-3xl">The cart didn&apos;t come together.</h1>
        <p className="mt-3 text-paper/55">{cart.message}</p>
        <div className="mt-8 flex gap-3">
          <button type="button" onClick={onBack} className="btn-ghost">
            <ArrowLeft size={17} /> Edit list
          </button>
          <button type="button" onClick={onRetry} className="btn">
            <Refresh size={17} /> Try again
          </button>
        </div>
      </section>
    );
  }

  if (cart.phase === "placed") {
    const { order, address } = cart;
    const eff = effectiveCart(cart.status, edits);
    return (
      <section className="animate-rise mx-auto mt-10 flex max-w-md flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-full border border-herb/40 bg-herb/10 text-herb">
          <Check size={30} strokeWidth={2.4} />
        </span>
        <h1 className="display mt-6 text-[clamp(2rem,5vw,3rem)]">Order placed</h1>
        <p className="mt-3 max-w-sm text-paper/60">
          We&apos;re getting {styleLabel ? `${styleLabel.toLowerCase()} ` : ""}
          {variantTitle} to you{order.etaMinutes ? ` in about ${order.etaMinutes} minutes` : " shortly"}.
        </p>
        <div className="receipt mt-7 w-full px-5 py-4 text-left">
          <Row k="Order" v={order.id} mono />
          <Row k="Delivering to" v={address} />
          <Row k="Total" v={inr(eff.totalInr)} />
        </div>
        <button type="button" onClick={onStartOver} className="btn mt-8">
          Cook something else
        </button>
      </section>
    );
  }

  // ready | placing
  const { status } = cart;
  const placing = cart.phase === "placing";
  const editable = cart.phase === "ready";
  const eff = effectiveCart(status, edits);
  const empty = eff.lines.length === 0;

  return (
    <section className="mx-auto mt-6 w-full max-w-xl">
      <div className="text-center">
        <p className="label animate-rise text-herb">{status.status === "partial" ? "Cart mostly ready" : "Your cart is ready"}</p>
        <h1 className="display animate-rise mt-3 text-[clamp(2rem,5.5vw,3.2rem)] [animation-delay:60ms]">
          <span className="dots text-herb">{eff.packs}</span> items · <span className="dots">{inr(eff.totalInr)}</span>
        </h1>
        <p className="animate-rise mt-3 text-paper/55 [animation-delay:120ms]">
          {styleLabel ? `${styleLabel} · ` : ""}
          {variantTitle}
          {status.etaMinutes ? ` · arrives in about ${status.etaMinutes} min` : ""}
        </p>
      </div>

      <div className="panel animate-rise mt-8 overflow-hidden [animation-delay:180ms]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <span className="label">Your Zepto cart</span>
          <span className="font-mono text-[11px] text-paper/35">{editable ? "tap − + to adjust · ✕ to remove" : `${eff.lines.length} items`}</span>
        </div>

        {empty ? (
          <p className="px-5 py-8 text-center text-[14px] text-paper/50">Cart is empty. Use “Edit list” to add items back.</p>
        ) : (
          <ul className="divide-y divide-line">
            {eff.lines.map((line) => {
              const key = lineKey(line);
              return (
                <li key={key} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Thumb src={line.imageUrl} name={line.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] leading-tight">{line.name}</p>
                      <p className="mt-0.5 font-mono text-[11.5px] text-paper/45">{line.packSize}</p>
                    </div>
                    {editable ? (
                      <div className="flex items-center rounded-[9px] border border-line">
                        <button
                          type="button"
                          aria-label={`Fewer ${line.name}`}
                          disabled={line.quantity <= 1}
                          onClick={() => onQty(key, -1)}
                          className="grid size-7 place-items-center text-paper/60 transition hover:text-paper disabled:opacity-25"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="dots w-5 text-center text-[13px] leading-none">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={`More ${line.name}`}
                          disabled={line.quantity >= 99}
                          onClick={() => onQty(key, 1)}
                          className="grid size-7 place-items-center text-paper/60 transition hover:text-paper disabled:opacity-25"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      line.quantity > 1 && <span className="font-mono text-[11.5px] text-paper/45">×{line.quantity}</span>
                    )}
                    <div className="w-[62px] shrink-0 text-right">
                      <p className="font-mono text-[13.5px] tabular-nums text-paper/90">{inr(line.priceInr)}</p>
                      {line.mrpInr && line.mrpInr > line.priceInr && (
                        <p className="font-mono text-[11px] tabular-nums text-paper/30 line-through">{inr(line.mrpInr)}</p>
                      )}
                    </div>
                    {editable && (
                      <button
                        type="button"
                        aria-label={`Remove ${line.name}`}
                        onClick={() => onRemove(key)}
                        className="grid size-7 shrink-0 place-items-center rounded-full text-paper/30 transition hover:bg-chili/10 hover:text-chili"
                      >
                        <Close size={15} />
                      </button>
                    )}
                  </div>
                  {line.reason && (
                    <details className="mt-1 pl-[3.6rem]">
                      <summary className="cursor-pointer list-none text-[11px] text-paper/40 transition hover:text-paper/70 [&::-webkit-details-marker]:hidden">
                        Why this pick
                      </summary>
                      <p className="mt-1 text-[12px] leading-relaxed text-paper/55">{line.reason}</p>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {(() => {
          // Hide items the user already added back — they now live in the cart list above.
          const stillSkipped = (status.skipped ?? []).filter((s) => !(s.line && edits.added.has(lineKey(s.line))));
          if (stillSkipped.length === 0) return null;
          const savedFromKitchen = Math.round(stillSkipped.reduce((sum, s) => sum + (s.line?.priceInr ?? 0), 0));
          return (
            <div className="border-t border-line bg-herb/[0.04] px-5 py-4">
              <p className="label mb-1 flex items-center justify-between gap-2 text-herb">
                <span>Already in your kitchen</span>
                {savedFromKitchen > 0 && <span className="normal-case tracking-normal">saved you ~{inr(savedFromKitchen)}</span>}
              </p>
              <p className="mb-3 text-[12.5px] leading-relaxed text-paper/55">
                We checked your recent Zepto orders — you likely still have these, so we left them out so you don&apos;t re-buy. Need one anyway? Add it.
              </p>
              <ul className="space-y-1">
                {stillSkipped.map((s) => (
                  <li key={s.ingredientId} className="flex items-center justify-between gap-3 py-0.5">
                    <span className="min-w-0 flex-1 truncate text-[14px] text-paper/85">{s.name}</span>
                    <span className="shrink-0 font-mono text-[11px] text-paper/40">{haveLine(s)}</span>
                    {editable && s.line && (
                      <button
                        type="button"
                        onClick={() => onAddBack(lineKey(s.line!))}
                        className="shrink-0 rounded-full border border-herb/40 px-2.5 py-1 text-[11.5px] text-herb transition hover:bg-herb/10"
                      >
                        + Add
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {status.unavailable.length > 0 && (
          <div className="border-t border-line px-5 py-3">
            <p className="label mb-2 text-chili">Not available right now</p>
            <div className="flex flex-wrap gap-1.5">
              {status.unavailable.map((u) => (
                <span key={u.ingredientId} className="tag" title={u.reason}>
                  {u.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <dl className="space-y-1.5 border-t border-line px-5 pb-4 pt-3.5 font-mono text-[12.5px]">
          <div className="flex justify-between text-paper/45">
            <dt>Items</dt>
            <dd>{inr(eff.itemsInr)}</dd>
          </div>
          <div className="flex justify-between text-paper/45">
            <dt>Delivery</dt>
            <dd>{eff.deliveryInr ? inr(eff.deliveryInr) : "Free"}</dd>
          </div>
          {(() => {
            const mrpSaved = Math.round(eff.lines.reduce((s, l) => s + Math.max(0, (l.mrpInr ?? l.priceInr) - l.priceInr), 0));
            return mrpSaved > 0 ? (
              <div className="flex justify-between text-herb">
                <dt>You save (off MRP)</dt>
                <dd>−{inr(mrpSaved)}</dd>
              </div>
            ) : null;
          })()}
          <div className="flex items-baseline justify-between pt-1 text-paper">
            <dt className="uppercase tracking-[0.12em]">Total</dt>
            <dd className="dots text-[22px]">{inr(eff.totalInr)}</dd>
          </div>
        </dl>
      </div>

      {/* Store choice: Zepto today, others coming soon — intent clear, nothing dumped. */}
      <div className="mt-7 text-center">
        <p className="label mb-2 text-paper/40">Delivering via</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="tag border-herb/30 text-herb">
            <span className="size-1.5 rounded-full bg-herb" /> Zepto
          </span>
          {["Blinkit", "Swiggy Instamart", "BigBasket"].map((name) => (
            <span key={name} className="tag opacity-45" title="Coming soon">
              {name} · soon
            </span>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] text-paper/35">On our Zepto for now · connect your own account — coming soon</p>
      </div>

      {/* Primary action: we place it and deliver to the user's address. */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={placing || empty}
          className="btn-accent h-14 w-full max-w-sm text-[16px]"
        >
          {placing ? "Placing your order…" : "Place order"}
          {!placing && <ArrowRight size={18} />}
        </button>
        <button type="button" onClick={onBack} className="btn-ghost" disabled={placing}>
          <ArrowLeft size={17} /> Edit list
        </button>
      </div>
    </section>
  );
}

/** Plain-English "why we skipped it" line from the inventory facts. */
function haveLine(s: { boughtDaysAgo?: number; shelfLifeDays?: number; reason: string }): string {
  if (s.boughtDaysAgo == null) return s.reason;
  const when = s.boughtDaysAgo === 0 ? "ordered today" : s.boughtDaysAgo === 1 ? "ordered yesterday" : `ordered ${s.boughtDaysAgo} days ago`;
  return s.shelfLifeDays ? `${when} · keeps ~${s.shelfLifeDays}d` : when;
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="label shrink-0 text-paper/45">{k}</span>
      <span className={`min-w-0 text-right text-[13.5px] ${mono ? "font-mono text-paper/70" : "text-paper/85"}`}>{v}</span>
    </div>
  );
}

function Thumb({ src, name }: { src?: string; name: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote Zepto product image
      <img src={src} alt="" loading="lazy" className="size-11 shrink-0 rounded-[10px] border border-line object-cover" />
    );
  }
  return (
    <span className="dots grid size-11 shrink-0 place-items-center rounded-[10px] border border-line text-[15px] text-paper/40">
      {name[0]?.toUpperCase() ?? "·"}
    </span>
  );
}
