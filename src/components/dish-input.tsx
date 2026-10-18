"use client";

import { useEffect, useId, useState } from "react";
import { searchCatalog, type CatalogDish } from "@/lib/catalog";
import { POPULAR_DISHES } from "@/lib/feed-names";
import { VegMark } from "./dish-menu";
import { ArrowRight } from "./icons";

// Placeholder + suggestions come from the built-in menu, so they work even when Gemini doesn't.
const IDEAS = POPULAR_DISHES.map((dish) => dish.toLowerCase());

/**
 * One big ruled line, like writing on an order pad, with menu autocomplete (ARIA combobox).
 * The last option always sends exactly what was typed, so anything off-menu still works.
 */
export function DishInput({
  value,
  onChange,
  onSubmit,
  busy = false,
  autoFocus = false,
  catalog = [],
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  busy?: boolean;
  autoFocus?: boolean;
  catalog?: CatalogDish[];
}) {
  const [idea, setIdea] = useState(0);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();

  useEffect(() => {
    const id = setInterval(() => setIdea((i) => (i + 1) % IDEAS.length), 2800);
    return () => clearInterval(id);
  }, []);

  const typed = value.trim();
  const canSubmit = typed.length >= 2 && !busy;
  const matches = searchCatalog(catalog, typed);
  const exact = matches.some((m) => m.name.toLowerCase() === typed.toLowerCase());
  // Options: menu matches, then "ask for what I typed" unless it's already an exact match.
  const options: { key: string; label: string; dish?: CatalogDish }[] = [
    ...matches.map((dish) => ({ key: dish.id, label: dish.name, dish })),
    ...(typed.length >= 2 && !exact ? [{ key: "__typed", label: typed }] : []),
  ];
  const showList = open && !busy && options.length > 0;

  function pick(label: string) {
    setOpen(false);
    setActive(-1);
    onChange(label);
    if (label.trim().length >= 2) onSubmit(label.trim());
  }

  return (
    <div className="relative w-full">
      <form
        className="group flex w-full items-end gap-4 border-b border-paper/20 pb-3 transition-colors focus-within:border-saffron"
        onSubmit={(e) => {
          e.preventDefault();
          if (showList && active >= 0) pick(options[active].label);
          else if (canSubmit) pick(typed);
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
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              if (!options.length) return;
              e.preventDefault();
              setOpen(true);
              setActive((i) => {
                const n = options.length;
                return e.key === "ArrowDown" ? (i + 1) % n : i <= 0 ? n - 1 : i - 1;
              });
            } else if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
          }}
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

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Dishes on the menu"
          className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-ink-2 py-1.5 text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]"
        >
          {options.map((option, i) => (
            <li
              key={option.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: keeps focus in the input so blur doesn't close the list first
              onMouseDown={(e) => {
                e.preventDefault();
                pick(option.label);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline gap-3 px-4 py-2.5 ${i === active ? "bg-ink-3" : ""}`}
            >
              {option.dish ? (
                <>
                  <span className="translate-y-[1px]">
                    <VegMark veg={option.dish.veg} />
                  </span>
                  <span className={`text-[15px] ${i === active ? "text-saffron" : "text-paper"}`}>{option.label}</span>
                  <span className="truncate text-[12.5px] text-paper/40">{option.dish.cuisine}</span>
                  <span className="ml-auto shrink-0 font-mono text-[12.5px] text-paper/35">from {option.dish.minutes} min</span>
                </>
              ) : (
                <span className="font-mono text-[12.5px] text-paper/55">
                  Ask Gemini for <span className={i === active ? "text-saffron" : "text-paper"}>&ldquo;{option.label}&rdquo;</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
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
