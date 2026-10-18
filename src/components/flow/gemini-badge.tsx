"use client";

import { useState } from "react";
import { Dialog } from "../dialog";

/** Small circled "i" so the badge reads as tappable, not just decorative. */
function InfoGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden className="ml-0.5 opacity-70">
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7.3v3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="5.1" r="0.55" fill="currentColor" />
    </svg>
  );
}

/**
 * A clickable "what Gemini did" badge. Reuses the existing green `tag` pill, but as a
 * button that opens a short, plain-English explanation so the AI work is visible and
 * trustworthy, not a mystery label.
 */
function GeminiBadge({ label, title, intro, points, footer }: { label: string; title: string; intro: string; points: string[]; footer?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="tag border-herb/30 text-herb/90 transition hover:border-herb/60 hover:bg-herb/10"
      >
        <span className="size-1.5 rounded-full bg-herb" />
        {label}
        <InfoGlyph />
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={title} focusFirstField={false}>
        <p className="-mt-2 text-[14px] leading-relaxed text-paper/70">{intro}</p>
        <ul className="mt-4 space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex gap-2.5 text-[14px] leading-relaxed text-paper/85">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-herb" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
        {footer && <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-paper/55">{footer}</p>}
      </Dialog>
    </>
  );
}

/** On the recipe and ingredient screens: Gemini shaped the dish to the cook's profile. */
export function RecipeGeminiBadge() {
  return (
    <GeminiBadge
      label="Personalised by Gemini"
      title="Personalised by Gemini"
      intro="These recipes are built around your profile, not a generic result."
      points={[
        "Styles and flavours matched to your diet and budget",
        "Portions scaled to how many people you cook for",
        "A protein target set from your age and weight",
      ]}
      footer="You can update your profile anytime in Settings."
    />
  );
}

/** On the cart: Gemini chose the actual Zepto product for each ingredient. */
export function CartGeminiBadge() {
  return (
    <GeminiBadge
      label="Products picked by Gemini"
      title="Products picked by Gemini"
      intro="For each ingredient, Gemini picks the Zepto product that fits you best."
      points={[
        "Weighs price, pack size and ratings together",
        "Follows your diet and your best-rated or best-price choice",
        "Leaves out items you likely still have from recent Zepto orders",
      ]}
      footer="Open ‘why this pick’ on any item to see the reason."
    />
  );
}
