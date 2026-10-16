"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "../icons";

const DEMOS = [
  {
    dish: "white sauce pasta",
    style: "Restaurant style",
    lines: [
      ["Penne pasta", "250 g"],
      ["Fresh cream", "200 ml"],
      ["Parmesan cheese", "40 g"],
      ["Button mushrooms", "200 g"],
      ["Garlic", "6 cloves"],
    ],
    more: 8,
  },
  {
    dish: "paneer butter masala",
    style: "Protein rich",
    lines: [
      ["Paneer", "400 g"],
      ["Tomatoes", "500 g"],
      ["Greek yogurt", "150 g"],
      ["Cashews", "30 g"],
      ["Kasuri methi", "1 tbsp"],
    ],
    more: 7,
  },
  {
    dish: "shakshuka",
    style: "Healthy",
    lines: [
      ["Eggs", "4 pcs"],
      ["Tomatoes", "500 g"],
      ["Red bell pepper", "1 pc"],
      ["Onion", "1 pc"],
      ["Feta cheese", "50 g"],
    ],
    more: 5,
  },
] as const;

type Phase = "typing" | "thinking" | "printing";

/** Illustrative loop for the deck: type a dish, then the list prints line by line. */
export function TypingDemo() {
  const [demo, setDemo] = useState(0);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const current = DEMOS[demo];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = setTimeout(() => {
        setTyped(current.dish.length);
        setPhase("printing");
      }, 0);
      return () => clearTimeout(id);
    }
    let id: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      id =
        typed < current.dish.length
          ? setTimeout(() => setTyped((t) => t + 1), 50 + Math.random() * 70)
          : setTimeout(() => setPhase("thinking"), 400);
    } else if (phase === "thinking") {
      id = setTimeout(() => setPhase("printing"), 1000);
    } else {
      id = setTimeout(() => {
        setDemo((d) => (d + 1) % DEMOS.length);
        setTyped(0);
        setPhase("typing");
      }, 4200);
    }
    return () => clearTimeout(id);
  }, [phase, typed, current.dish.length]);

  return (
    <div className="w-full max-w-md">
      <div className={`flex items-end gap-3 border-b pb-3 transition-colors ${phase === "typing" ? "border-saffron" : "border-paper/20"}`}>
        <span className="pb-1 font-mono text-[14px] text-saffron">&gt;</span>
        <span className="min-h-[1.3em] flex-1 text-[22px] font-medium tracking-[-0.02em]">
          {current.dish.slice(0, typed)}
          {phase === "typing" && <span className="caret" />}
        </span>
        <span className={`grid size-10 place-items-center rounded-[11px] transition ${phase === "typing" ? "bg-ink-3 text-paper/30" : "bg-saffron text-ink"}`}>
          <ArrowRight size={18} />
        </span>
      </div>

      <div className="relative mt-6 h-[300px]">
        {phase === "thinking" && <p className="printing animate-fade font-mono text-[12.5px] text-paper/50">Gemini is writing the list</p>}
        {phase === "printing" && (
          <div key={demo} className="receipt animate-fade px-5 py-4">
            <div className="flex items-center justify-between border-b border-dashed border-paper/15 pb-3">
              <span className="label">{current.style}</span>
              <span className="label">2 servings</span>
            </div>
            <ul className="pt-2">
              {current.lines.map(([name, qty], i) => (
                <li
                  key={name}
                  className="animate-fade flex items-baseline gap-2 py-1.5 text-[14.5px]"
                  style={{ animationDelay: `${i * 220}ms` }}
                >
                  <span className="check" data-on="true" aria-hidden>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <span className="ml-1.5">{name}</span>
                  <span className="leader" />
                  <span className="font-mono text-[12.5px] text-paper/70">{qty}</span>
                </li>
              ))}
            </ul>
            <p
              className="animate-fade mt-2 border-t border-dashed border-paper/15 pt-3 font-mono text-[11.5px] uppercase tracking-[0.1em] text-paper/40"
              style={{ animationDelay: `${current.lines.length * 220}ms` }}
            >
              + {current.more} more · sending to Zepto
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
