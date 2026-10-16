"use client";

import { CATEGORY_LABELS, formatQuantity, inr } from "@/lib/client";
import type { CartItem } from "@/lib/contract";
import { styleById } from "@/lib/styles";
import type { DishVariant, IngredientsOk, ZeptoState } from "@/lib/types";
import { ArrowRight, Check, Code, Minus, Plus, Refresh } from "../icons";
import { SampleBadge } from "./style-picker";

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

export function IngredientList({
  dish,
  variant,
  list,
  error,
  items,
  excluded,
  servings,
  zepto,
  onToggle,
  onServings,
  onRetry,
  onBuild,
  onShowPayload,
}: {
  dish: string;
  variant: DishVariant;
  list: IngredientsOk | null;
  error: string | null;
  items: CartItem[];
  excluded: Set<string>;
  servings: number;
  zepto: ZeptoState;
  onToggle: (id: string) => void;
  onServings: (n: number) => void;
  onRetry: () => void;
  onBuild: () => void;
  onShowPayload: () => void;
}) {
  const style = styleById(variant.style);
  const chosen = items.filter((i) => !excluded.has(i.id));
  const estimate = chosen.reduce((sum, i) => sum + (i.estimatedPriceInr ?? 0), 0);

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((i) => i.category === category),
  })).filter((g) => g.items.length);

  return (
    <section className="mx-auto mt-6 w-full max-w-2xl">
      <div className="flex flex-col items-center text-center">
        <p className="label">{style.label}</p>
        <h1 className="display animate-rise mt-3 text-[clamp(1.9rem,4.6vw,3rem)]">{variant.title}</h1>
        <p className="mt-2 text-paper/50">
          {list ? (
            `${dish} · ${items.length} ingredients`
          ) : (
            <span className="printing font-mono text-[13px]">Gemini is measuring everything out</span>
          )}
        </p>
        {list && list.source !== "gemini" && (
          <div className="mt-4">
            <SampleBadge source={list.source} />
          </div>
        )}
      </div>

      {error && (
        <div className="animate-rise mt-10 flex flex-col items-center text-center">
          <p className="text-paper/60">{error}</p>
          <button type="button" onClick={onRetry} className="btn mt-6">
            <Refresh size={17} /> Try again
          </button>
        </div>
      )}

      {!list && !error && (
        <div className="receipt mt-10 space-y-4 px-6 py-6" aria-busy>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex items-center gap-4" style={{ opacity: 1 - i * 0.1 }}>
              <div className="skeleton size-[18px]" />
              <div className="skeleton h-4" style={{ width: `${30 + ((i * 17) % 30)}%` }} />
              <div className="flex-1" />
              <div className="skeleton h-4 w-14" />
            </div>
          ))}
        </div>
      )}

      {list && (
        <>
          <div className="receipt animate-rise mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-paper/15 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="label">Servings</span>
                <div className="flex items-center rounded-[10px] border border-line">
                  <button
                    type="button"
                    aria-label="Fewer servings"
                    disabled={servings <= 1}
                    onClick={() => onServings(servings - 1)}
                    className="grid size-8 place-items-center text-paper/60 transition hover:text-paper disabled:opacity-30"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="dots w-7 text-center text-[18px] leading-none">{servings}</span>
                  <button
                    type="button"
                    aria-label="More servings"
                    disabled={servings >= 12}
                    onClick={() => onServings(servings + 1)}
                    className="grid size-8 place-items-center text-paper/60 transition hover:text-paper disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <p className="font-mono text-[11.5px] text-paper/40">
                {chosen.length}/{items.length} selected · untick what you have
              </p>
            </div>

            {list.tip && (
              <p className="border-b border-dashed border-paper/15 px-6 py-4 text-[14px] leading-relaxed text-paper/65">
                <span className="label mr-2 text-saffron">Chef&apos;s note</span>
                {list.tip}
              </p>
            )}

            <div className="space-y-6 px-6 pb-4 pt-5">
              {groups.map((group) => (
                <div key={group.category}>
                  <h2 className="label mb-1">{CATEGORY_LABELS[group.category]}</h2>
                  <ul>
                    {group.items.map((item) => {
                      const on = !excluded.has(item.id);
                      const sub = [item.notes, item.substitutes[0] && `or ${item.substitutes[0]}`].filter(Boolean).join(" · ");
                      return (
                        <li key={item.id}>
                          <label className="group flex cursor-pointer items-start gap-3.5 py-2.5">
                            <input type="checkbox" checked={on} onChange={() => onToggle(item.id)} className="peer sr-only" />
                            <span className="check mt-[3px] peer-focus-visible:outline-2 peer-focus-visible:outline-saffron" data-on={on}>
                              <Check size={13} strokeWidth={2.6} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline gap-2">
                                <span className={`shrink-0 text-[15px] transition ${on ? "text-paper" : "text-paper/30 line-through decoration-paper/25"}`}>
                                  {item.name}
                                </span>
                                {item.pantryStaple && <span className="tag shrink-0">pantry</span>}
                                {item.optional && <span className="tag shrink-0">optional</span>}
                                <span className="leader" />
                                <span className={`shrink-0 font-mono text-[13px] tabular-nums ${on ? "text-paper/85" : "text-paper/25"}`}>
                                  {formatQuantity(item.quantity, item.unit)}
                                </span>
                              </span>
                              {sub && <span className="mt-0.5 block truncate text-[12.5px] text-paper/35">{sub}</span>}
                            </span>
                            <span className="hidden w-14 shrink-0 pt-[2px] text-right font-mono text-[12px] tabular-nums text-paper/35 sm:block">
                              {item.estimatedPriceInr ? `~${inr(item.estimatedPriceInr)}` : ""}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex items-baseline justify-between border-t border-dashed border-paper/15 px-6 py-4 font-mono text-[13px]">
              <span className="uppercase tracking-[0.12em] text-paper/45">Est. total</span>
              <span className="dots text-[22px] text-paper">{inr(estimate)}</span>
            </div>
          </div>

          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink via-ink/90 to-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-10">
            <div className="animate-rise pointer-events-auto mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-line bg-ink-2 p-2 pl-4 max-sm:mx-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">
                  {chosen.length} items <span className="font-normal text-paper/45">· est. {inr(estimate)}</span>
                </p>
                <p className="truncate font-mono text-[11px] text-paper/40">
                  {zepto.connected ? (zepto.via === "simulated" ? "Zepto · simulated" : "Zepto · connected") : "Zepto not connected yet"}
                </p>
              </div>
              <button type="button" onClick={onShowPayload} className="btn-ghost h-11 px-3.5" aria-label="View cart JSON">
                <Code size={17} />
                <span className="hidden sm:inline">JSON</span>
              </button>
              <button type="button" onClick={onBuild} disabled={!chosen.length} className="btn-accent h-11">
                <span className="sm:hidden">Build cart</span>
                <span className="hidden sm:inline">Build cart on Zepto</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
