"use client";

import { inr } from "@/lib/client";
import type { CartStatus } from "@/lib/contract";
import { ArrowLeft, ArrowUpRight, Refresh } from "../icons";

export type CartPhase =
  | { phase: "building" }
  | { phase: "ready"; status: CartStatus }
  | { phase: "failed"; message: string };

const BUILD_LOG = ["Sending list to Zepto", "Matching products", "Picking pack sizes", "Checking stock nearby", "Assembling cart"];

export function CartView({
  cart,
  variantTitle,
  itemCount,
  simulated,
  onRetry,
  onBack,
  onStartOver,
}: {
  cart: CartPhase;
  variantTitle: string;
  itemCount: number;
  simulated: boolean;
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

  const { status } = cart;
  const total = status.totals?.totalInr ?? status.lines.reduce((sum, l) => sum + l.priceInr, 0);
  const packs = status.lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <section className="mx-auto mt-6 w-full max-w-xl text-center">
      <p className="label animate-rise text-herb">{status.status === "partial" ? "Cart mostly ready" : "Cart ready"}</p>
      <h1 className="display animate-rise mt-3 text-[clamp(2.2rem,6vw,3.6rem)] [animation-delay:60ms]">
        <span className="dots text-herb">{packs}</span> items, <span className="dots">{inr(total)}</span>
      </h1>
      <p className="animate-rise mt-4 text-paper/55 [animation-delay:120ms]">
        {variantTitle}
        {status.etaMinutes ? ` · arrives in about ${status.etaMinutes} min` : ""}
      </p>

      <div className="animate-rise mt-9 flex flex-col items-center gap-3 [animation-delay:180ms]">
        {status.cartUrl ? (
          <a href={status.cartUrl} target="_blank" rel="noopener noreferrer" className="btn-accent h-14 px-8 text-[16px]">
            Open cart in Zepto <ArrowUpRight size={18} />
          </a>
        ) : (
          <p className="text-paper/55">Open the Zepto app; your cart is waiting.</p>
        )}
        {(simulated || status.message) && (
          <p className="max-w-sm font-mono text-[11.5px] text-paper/35">
            {status.message ?? "Simulated cart: connect the cart API to curate a real one."}
          </p>
        )}
      </div>

      <div className="receipt animate-rise mt-10 text-left [animation-delay:240ms]">
        <div className="flex items-center justify-between border-b border-dashed border-paper/15 px-6 py-3.5">
          <span className="label">Zepto cart</span>
          <span className="font-mono text-[11px] text-paper/35">{status.cartId.slice(0, 18)}</span>
        </div>
        <ul className="max-h-[340px] overflow-y-auto px-6 py-3">
          {status.lines.map((line) => (
            <li key={`${line.ingredientId}-${line.productId}`} className="flex items-baseline gap-2 py-1.5">
              <span className="shrink-0 text-[14px]">{line.brand ? `${line.brand} ${line.name}` : line.name}</span>
              <span className="shrink-0 font-mono text-[11.5px] text-paper/35">
                {line.packSize}
                {line.quantity > 1 ? ` ×${line.quantity}` : ""}
              </span>
              <span className="leader" />
              <span className="shrink-0 font-mono text-[13px] tabular-nums text-paper/80">{inr(line.priceInr)}</span>
            </li>
          ))}
        </ul>
        {status.unavailable.length > 0 && (
          <div className="border-t border-dashed border-paper/15 px-6 py-3">
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
        {status.totals && (
          <dl className="space-y-1.5 border-t border-dashed border-paper/15 px-6 pb-3 pt-4 font-mono text-[12.5px]">
            <div className="flex justify-between text-paper/45">
              <dt>Items</dt>
              <dd>{inr(status.totals.itemsInr)}</dd>
            </div>
            {status.totals.deliveryInr !== undefined && (
              <div className="flex justify-between text-paper/45">
                <dt>Delivery</dt>
                <dd>{status.totals.deliveryInr ? inr(status.totals.deliveryInr) : "Free"}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-1 text-paper">
              <dt className="uppercase tracking-[0.12em]">Total</dt>
              <dd className="dots text-[22px]">{inr(status.totals.totalInr)}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <button type="button" onClick={onBack} className="btn-ghost">
          <ArrowLeft size={17} /> Edit list
        </button>
        <button type="button" onClick={onStartOver} className="btn-ghost">
          Cook something else
        </button>
      </div>
    </section>
  );
}
