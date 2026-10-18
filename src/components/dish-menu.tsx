"use client";

import { useState } from "react";
import { MENU_GROUPS, type CatalogDish, type MenuGroup } from "@/lib/catalog";

/** FSSAI-style mark: green square + dot for veg, red square + triangle for non-veg. */
export function VegMark({ veg, size = 12 }: { veg: boolean; size?: number }) {
  const color = veg ? "var(--color-herb)" : "var(--color-chili)";
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" className="shrink-0" role="img" aria-label={veg ? "Vegetarian" : "Non-vegetarian"}>
      <rect x="0.75" y="0.75" width="10.5" height="10.5" rx="1.5" fill="none" stroke={color} strokeWidth="1.5" />
      {veg ? <circle cx="6" cy="6" r="2.6" fill={color} /> : <path d="M6 3.2 8.9 8.4H3.1Z" fill={color} />}
    </svg>
  );
}

/** The built-in menu, laid out like an inviting card menu: grouped by section, each dish a tappable card. */
export function DishMenu({ catalog, onPick }: { catalog: CatalogDish[]; onPick: (dish: string) => void }) {
  const [group, setGroup] = useState<MenuGroup | "All">("All");
  const [vegOnly, setVegOnly] = useState(false);

  const visible = catalog.filter((d) => (group === "All" || d.group === group) && (!vegOnly || d.veg));
  const sections = MENU_GROUPS.map((g) => ({ group: g, dishes: visible.filter((d) => d.group === g) })).filter((s) => s.dishes.length);

  return (
    <section aria-label="Menu" className="w-full">
      <div className="flex flex-wrap items-center gap-2 border-b border-dashed border-paper/15 pb-4">
        <h2 className="label mr-2">Menu</h2>
        {(["All", ...MENU_GROUPS] as const).map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={group === g}
            onClick={() => setGroup(g)}
            className={`rounded-[9px] border px-2.5 py-1 font-mono text-[12px] transition ${group === g ? "border-paper bg-paper text-ink" : "border-line text-paper/55 hover:border-paper/30 hover:text-paper"}`}
          >
            {g}
          </button>
        ))}
        <button
          type="button"
          role="switch"
          aria-checked={vegOnly}
          onClick={() => setVegOnly((v) => !v)}
          className={`ml-auto inline-flex items-center gap-2 rounded-[9px] border px-2.5 py-1 font-mono text-[12px] transition ${vegOnly ? "border-herb/50 text-herb" : "border-line text-paper/55 hover:text-paper"}`}
        >
          <VegMark veg size={11} /> Veg only
        </button>
      </div>

      <div className="mt-7 space-y-8">
        {sections.map(({ group: g, dishes }) => (
          <div key={g}>
            {/* Section header: saffron label, a hairline rule, and a count so each category reads clearly. */}
            <div className="mb-3 flex items-center gap-3">
              <h3 className="label text-saffron">{g}</h3>
              <span aria-hidden className="flex-1 border-t border-dashed border-paper/10" />
              <span className="label text-paper/30">{dishes.length}</span>
            </div>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {dishes.map((dish) => (
                <li key={dish.id} className="flex">
                  <button
                    type="button"
                    onClick={() => onPick(dish.name)}
                    className="group flex h-full w-full flex-col gap-2 rounded-2xl border border-line bg-ink-2 p-4 text-left transition duration-200 hover:border-saffron/40 hover:bg-ink-3 focus-visible:border-saffron/40"
                  >
                    <span className="flex items-start gap-2.5">
                      <span className="mt-[3px]">
                        <VegMark veg={dish.veg} />
                      </span>
                      <span className="min-w-0 flex-1 text-[15.5px] font-medium leading-snug tracking-[-0.01em] transition group-hover:text-saffron">
                        {dish.name}
                      </span>
                    </span>
                    <span className="line-clamp-2 pl-[22px] text-[12.5px] leading-relaxed text-paper/45">{dish.summary}</span>
                    <span className="mt-auto flex items-baseline gap-2 pl-[22px] pt-0.5 font-mono text-[12.5px]">
                      <span className="min-w-0 flex-1 truncate text-paper/35">{dish.cuisine}</span>
                      <span className="shrink-0 text-paper/30">from {dish.minutes} min</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!sections.length && <p className="text-paper/45">Nothing here yet. Try another section.</p>}
      </div>
    </section>
  );
}
