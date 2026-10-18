"use client";

import { Dialog } from "../dialog";
import { ArrowRight } from "../icons";
import { StoreMark } from "../zepto-connect";

const COMING_SOON = ["Blinkit", "Swiggy Instamart", "BigBasket"];

/**
 * Choose which quick-commerce store to build the cart on. Zepto is live; the rest are
 * clearly "coming soon" (disabled) — so the multi-store vision is visible, but only the
 * working path is clickable.
 */
export function StorePicker({ open, onClose, onContinue }: { open: boolean; onClose: () => void; onContinue: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Where should we shop?">
      <p className="-mt-2 mb-5 text-[14px] leading-relaxed text-paper/60">
        Mise builds your cart on a live quick-commerce store and delivers to your door. More stores are on the way.
      </p>

      <div className="space-y-2.5">
        <button
          type="button"
          onClick={onContinue}
          className="flex w-full items-center gap-3.5 rounded-[14px] border border-saffron/50 bg-saffron/10 px-4 py-3.5 text-left transition hover:bg-saffron/[0.16]"
        >
          <StoreMark name="Zepto" size={40} live />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Zepto</p>
            <p className="font-mono text-[12px] text-herb">Live · groceries in ~10 min</p>
          </div>
          <span className="btn-accent h-10 shrink-0 px-4 text-[14px]">
            Continue <ArrowRight size={16} />
          </span>
        </button>

        {COMING_SOON.map((name) => (
          <div
            key={name}
            aria-disabled="true"
            className="flex w-full items-center gap-3.5 rounded-[14px] border border-line px-4 py-3.5 opacity-55"
          >
            <StoreMark name={name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-paper/70">{name}</p>
              <p className="font-mono text-[12px] text-paper/40">Coming soon</p>
            </div>
            <span className="tag shrink-0">Soon</span>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
