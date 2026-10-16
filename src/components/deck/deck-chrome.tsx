"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "../brand";
import { ArrowRight } from "../icons";

/**
 * Fixed deck UI over the scroll-snapped slides: progress, slide counter, dot nav
 * and keyboard control (↑ ↓ ← → space, Home/End). Marks slides `data-seen` to trigger reveals.
 */
export function DeckChrome({ titles }: { titles: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const deck = document.getElementById("deck");
    if (!deck) return;
    const slides = Array.from(deck.querySelectorAll<HTMLElement>("[data-slide]"));

    // Measure by visible height, not ratio: on phones a slide can be two screens tall.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const visible = entry.intersectionRect.height / deck.clientHeight;
          if (!entry.isIntersecting || visible < 0.35) continue;
          const el = entry.target as HTMLElement;
          el.dataset.seen = "true";
          if (visible >= 0.5) setActive(slides.indexOf(el));
        }
      },
      { root: deck, threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
    );
    slides.forEach((slide) => observer.observe(slide));

    const go = (index: number) => slides[Math.max(0, Math.min(slides.length - 1, index))]?.scrollIntoView({ behavior: "smooth" });
    const current = () => {
      const top = deck.scrollTop + deck.clientHeight / 2;
      const index = slides.findIndex((s) => s.offsetTop <= top && s.offsetTop + s.offsetHeight > top);
      return index < 0 ? 0 : index;
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, PageDown: 1, " ": 1, ArrowUp: -1, ArrowLeft: -1, PageUp: -1 };
      if (e.key in keys) {
        e.preventDefault();
        go(current() + (e.shiftKey && e.key === " " ? -1 : keys[e.key]));
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        go(e.key === "Home" ? 0 : slides.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      observer.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const jump = (index: number) =>
    document.querySelectorAll<HTMLElement>("#deck [data-slide]")[index]?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[2px] bg-line">
        <div
          className="h-full bg-saffron transition-[width] duration-700 ease-out-expo"
          style={{ width: `${((active + 1) / titles.length) * 100}%` }}
        />
      </div>

      <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 sm:px-10 sm:py-7">
        <button type="button" onClick={() => jump(0)} className="pointer-events-auto" aria-label="Back to cover">
          <Logo />
        </button>
        <Link href="/app" className="btn pointer-events-auto h-10 px-4 text-[14px]">
          Open mise <ArrowRight size={16} />
        </Link>
      </header>

      <div className="pointer-events-none fixed bottom-6 left-5 z-30 hidden items-baseline gap-3 sm:left-10 sm:flex">
        <span className="dots text-[22px] leading-none">
          {String(active + 1).padStart(2, "0")}
          <span className="text-paper/25">/{String(titles.length).padStart(2, "0")}</span>
        </span>
        <span key={active} className="label animate-fade">
          {titles[active]}
        </span>
      </div>

      <nav aria-label="Slides" className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1 md:flex lg:right-8">
        {titles.map((title, i) => (
          <button
            key={title}
            type="button"
            onClick={() => jump(i)}
            aria-label={`Slide ${i + 1}: ${title}`}
            aria-current={i === active}
            className="group grid size-6 place-items-center"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${i === active ? "size-2 bg-saffron" : "size-1.5 bg-paper/25 group-hover:bg-paper/60"}`}
            />
          </button>
        ))}
      </nav>
    </>
  );
}
