"use client";

import { DISH_STYLES } from "@/lib/styles";
import type { DishVariant, VariantsOk } from "@/lib/types";
import { ArrowLeft, ArrowUpRight, Refresh } from "../icons";

export function SampleBadge() {
  return (
    <span className="tag border-turmeric/30 text-turmeric/90">
      <span className="size-1.5 rounded-full bg-turmeric" />
      Sample data · set GEMINI_API_KEY for any dish
    </span>
  );
}

export function StylePicker({
  query,
  variants,
  error,
  onPick,
  onRetry,
  onEdit,
}: {
  query: string;
  variants: VariantsOk | null;
  error: string | null;
  onPick: (variant: DishVariant) => void;
  onRetry: () => void;
  onEdit: () => void;
}) {
  if (error) {
    return (
      <section className="animate-rise mx-auto mt-8 flex max-w-md flex-col items-center text-center">
        <h2 className="display text-3xl">Let&apos;s try that again.</h2>
        <p className="mt-3 text-paper/55">{error}</p>
        <div className="mt-8 flex gap-3">
          <button type="button" onClick={onEdit} className="btn-ghost">
            <ArrowLeft size={17} /> Change dish
          </button>
          <button type="button" onClick={onRetry} className="btn">
            <Refresh size={17} /> Retry
          </button>
        </div>
      </section>
    );
  }

  const byStyle = new Map(variants?.variants.map((v) => [v.style, v]));

  return (
    <section className="mx-auto mt-6 w-full max-w-4xl">
      <div className="flex flex-col items-center text-center">
        <button type="button" onClick={onEdit} className="label inline-flex items-center gap-1.5 transition hover:text-saffron">
          <ArrowLeft size={13} /> {variants?.cuisine || "Change dish"}
        </button>
        <h1 className="display animate-rise mt-4 text-[clamp(2rem,5vw,3.25rem)]">{variants?.dish ?? query}</h1>
        <p className="mt-3 max-w-lg text-paper/55">
          {variants ? (
            <span className="animate-fade">{variants.summary || "How do you want it?"}</span>
          ) : (
            <span className="printing font-mono text-[13px] text-paper/45">Gemini is working out four ways to cook it</span>
          )}
        </p>
        {variants?.source === "sample" && (
          <div className="mt-4">
            <SampleBadge />
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
        {DISH_STYLES.map((style, index) => {
          const variant = byStyle.get(style.id);
          return (
            <button
              key={style.id}
              type="button"
              disabled={!variant}
              onClick={() => variant && onPick(variant)}
              className="option animate-rise group"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className="option-num dots text-[34px] leading-none text-paper/30 transition-colors">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <ArrowUpRight size={18} className="text-saffron opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
              </div>
              <p className="label mt-5">{style.label}</p>
              {variant ? (
                <>
                  <h3 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.02em] [font-stretch:108%]">{variant.title}</h3>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-paper/55">{variant.tagline}</p>
                  {variant.highlights.length > 0 && (
                    <p className="mt-3 text-[13.5px] text-paper/40">{variant.highlights.join(", ")}</p>
                  )}
                  <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-dotted border-paper/15 pt-4 font-mono text-[11.5px] uppercase tracking-[0.08em] text-paper/50">
                    <span>{variant.timeMinutes} min</span>
                    {variant.kcalPerServing > 0 && <span>{variant.kcalPerServing} kcal</span>}
                    {variant.proteinGrams > 0 && <span>{variant.proteinGrams} g protein</span>}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-[14.5px] text-paper/35">{style.blurb}</p>
                  <div className="mt-5 space-y-2.5">
                    <div className="skeleton h-5 w-3/5" />
                    <div className="skeleton h-3.5 w-4/5" />
                  </div>
                  <div className="mt-5 border-t border-dotted border-paper/15 pt-4">
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-5 text-center font-mono text-[11.5px] text-paper/30">Estimates per serving. Pick one to get the exact list.</p>
    </section>
  );
}
