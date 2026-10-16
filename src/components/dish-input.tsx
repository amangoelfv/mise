"use client";

import { useEffect, useState } from "react";
import { POPULAR_DISHES } from "@/lib/feed-names";
import { ArrowRight } from "./icons";

// Placeholder + suggestions come from the built-in menu, so they work even when Gemini doesn't.
const IDEAS = POPULAR_DISHES.map((dish) => dish.toLowerCase());

/** One big ruled line, like writing on an order pad. */
export function DishInput({
  value,
  onChange,
  onSubmit,
  busy = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  busy?: boolean;
  autoFocus?: boolean;
}) {
  const [idea, setIdea] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdea((i) => (i + 1) % IDEAS.length), 2800);
    return () => clearInterval(id);
  }, []);

  const canSubmit = value.trim().length >= 2 && !busy;

  return (
    <form
      className="group flex w-full items-end gap-4 border-b border-paper/20 pb-3 transition-colors focus-within:border-saffron"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit(value.trim());
      }}
    >
      <label htmlFor="dish" className="sr-only">
        What do you want to eat today?
      </label>
      <span aria-hidden className="pb-1.5 font-mono text-[15px] text-saffron">
        &gt;
      </span>
      <input
        id="dish"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        maxLength={80}
        placeholder={IDEAS[idea]}
        className="min-w-0 flex-1 bg-transparent text-[clamp(1.4rem,3.4vw,2rem)] font-medium tracking-[-0.02em] text-paper outline-none placeholder:text-paper/22"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        aria-label="Find recipes"
        className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-saffron text-ink transition disabled:bg-ink-3 disabled:text-paper/30"
      >
        <ArrowRight size={20} />
      </button>
    </form>
  );
}

export function DishIdeas({
  onPick,
  count = 5,
  dishes = IDEAS,
  label = "Try",
}: {
  onPick: (dish: string) => void;
  count?: number;
  dishes?: string[];
  label?: string;
}) {
  const shown = dishes.slice(0, count).map((d) => d.toLowerCase());
  return (
    <p className="flex flex-wrap items-baseline gap-x-1 gap-y-1 font-mono text-[12.5px] leading-relaxed text-paper/40">
      <span className="mr-1 uppercase tracking-[0.12em]">{label}</span>
      {shown.map((dish, i) => (
        <span key={dish}>
          <button type="button" onClick={() => onPick(dish)} className="text-paper/65 underline-offset-4 transition hover:text-saffron hover:underline">
            {dish}
          </button>
          {i < shown.length - 1 && <span className="ml-1 text-paper/20">/</span>}
        </span>
      ))}
    </p>
  );
}
