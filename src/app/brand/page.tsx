import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND, LogoMark, Wordmark, markDots } from "@/components/brand";
import { ArrowLeft } from "@/components/icons";
import { Orb } from "@/components/orb";

const DESCRIPTION = "The Mise brand: a halftone dot mark, warm ink and paper with one saffron accent, Archivo and a dot-matrix face, and a voice like a good shopping list.";

export const metadata: Metadata = {
  title: "Brand",
  description: DESCRIPTION,
  alternates: { canonical: "/brand" },
  openGraph: { type: "website", siteName: "Mise", locale: "en_IN", url: "/brand", title: "Mise brand guidelines", description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: "Mise brand guidelines", description: DESCRIPTION },
};

const COLORS: { name: string; hex: string; use: string; dark?: boolean }[] = [
  { name: "Ink", hex: BRAND.ink, use: "Background. Warm black, never pure #000." },
  { name: "Paper", hex: BRAND.paper, use: "Text and dots. Warm off-white.", dark: true },
  { name: "Saffron", hex: BRAND.saffron, use: "The one accent: primary actions, focus, the highlight dot.", dark: true },
  { name: "Turmeric", hex: BRAND.turmeric, use: "Notices and sample-data flags only.", dark: true },
  { name: "Herb", hex: BRAND.herb, use: "Success: cart ready, connected.", dark: true },
  { name: "Chili", hex: BRAND.chili, use: "Errors and things that went wrong.", dark: true },
];

const VOICE: [string, string][] = [
  ["200 ml fresh cream", "A splash of creamy goodness"],
  ["Mise can't place orders.", "Your security is our top priority!"],
  ["Gemini is measuring everything out", "✨ AI magic is happening…"],
  ["Untick what you have", "Customize your perfect cart experience"],
];

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-14">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <p className="flex items-baseline gap-3">
          <span className="dots text-[20px] leading-none text-saffron">{String(n).padStart(2, "0")}</span>
          <span className="label">{title}</span>
        </p>
        <div>{children}</div>
      </div>
    </section>
  );
}

export default function BrandPage() {
  const dots = markDots();
  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-24 sm:px-10">
      <header className="flex items-center justify-between py-7">
        <Link href="/" className="label inline-flex items-center gap-2 transition hover:text-saffron">
          <ArrowLeft size={14} /> Back to the deck
        </Link>
        <span className="label">Brand guidelines · v1</span>
      </header>

      <div className="dot-grid grid items-center gap-10 rounded-2xl border border-line px-8 py-16 md:grid-cols-[1fr_auto] md:px-14">
        <div>
          <div className="flex items-center gap-5 text-paper">
            <LogoMark size={88} />
            <Wordmark className="text-[96px]" />
          </div>
          <p className="mt-8 max-w-lg text-[17px] leading-relaxed text-paper/60">
            From <em className="text-paper">mise en place</em>: everything in its place. Before a cook starts, every
            ingredient is measured and laid out. Mise does that for your grocery list.
          </p>
        </div>
        <div className="mx-auto size-56">
          <Orb energy={0.3} />
        </div>
      </div>

      <Section n={1} title="Logo">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="panel flex aspect-[4/3] items-center justify-center gap-3 text-paper">
            <LogoMark size={40} />
            <Wordmark className="text-[34px]" />
          </div>
          <div className="flex aspect-[4/3] items-center justify-center gap-3 rounded-2xl bg-paper text-ink">
            <LogoMark size={40} />
            <Wordmark className="text-[34px]" />
          </div>
          <div className="panel flex aspect-[4/3] items-center justify-center">
            <LogoMark size={96} className="text-paper" />
          </div>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-[260px_1fr] md:items-center">
          <svg viewBox="-0.5 -0.5 8 8" className="w-full max-w-[260px]" aria-label="Logo construction grid">
            {Array.from({ length: 49 }, (_, k) => (
              <circle key={k} cx={(k % 7) + 0.5} cy={Math.floor(k / 7) + 0.5} r={0.04} fill="rgb(239 235 227 / 0.3)" />
            ))}
            <circle cx={3.5} cy={3.5} r={3.45} fill="none" stroke="rgb(239 235 227 / 0.15)" strokeWidth={0.02} strokeDasharray="0.08 0.08" />
            {dots.map((d) => (
              <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.accent ? 0.46 : d.r} fill={d.accent ? BRAND.saffron : BRAND.paper} />
            ))}
          </svg>
          <div className="space-y-4 text-[15px] leading-relaxed text-paper/65">
            <p>
              <span className="text-paper">The mark is a halftone sphere on a 7×7 grid.</span> The grid is mise en place;
              the shading is the orb; dot size follows a light from the top left. The brightest dot is saffron: the one
              thing you came for.
            </p>
            <p>
              The wordmark is Archivo at 125% width, bold, tracked tight, always lowercase. Keep clear space of one dot
              cell around the lockup. Minimum mark size 16 px.
            </p>
            <p className="font-mono text-[12.5px] text-paper/45">
              Don&apos;t recolour the dots, add gradients, outline the wordmark, or set it in capitals.
            </p>
          </div>
        </div>
      </Section>

      <Section n={2} title="Colour">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {COLORS.map((c) => (
            <div key={c.name} className="bg-ink">
              <div className="h-24" style={{ background: c.hex }} />
              <div className="p-5">
                <p className="flex items-baseline justify-between">
                  <span className="font-semibold">{c.name}</span>
                  <span className="font-mono text-[12px] uppercase text-paper/50">{c.hex}</span>
                </p>
                <p className="mt-1.5 text-[13.5px] text-paper/55">{c.use}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[14.5px] text-paper/55">
          Mise is dark only. Saffron is the single accent; if two things on a screen are orange, one of them is wrong.
        </p>
      </Section>

      <Section n={3} title="Type">
        <div className="divide-y divide-line rounded-2xl border border-line">
          <div className="p-6">
            <p className="label">Display · Archivo 118% width, 620</p>
            <p className="display mt-3 text-[52px]">What do you want to eat today?</p>
          </div>
          <div className="p-6">
            <p className="label">Text · Archivo 100%, 400</p>
            <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-paper/75">
              Recipes count in cups and pinches, usually for four. Grocery apps sell packs, one search at a time.
            </p>
          </div>
          <div className="p-6">
            <p className="label">Data · JetBrains Mono</p>
            <p className="mt-3 flex items-baseline gap-2 font-mono text-[15px]">
              Fresh cream <span className="leader" /> 200 ml
            </p>
          </div>
          <div className="p-6">
            <p className="label">Numerals · Doto</p>
            <p className="dots mt-3 text-[56px] leading-none">
              04 <span className="text-saffron">₹686</span>
            </p>
          </div>
        </div>
      </Section>

      <Section n={4} title="Motifs">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="panel p-6">
            <div className="mx-auto size-32">
              <Orb energy={0.6} />
            </div>
            <p className="mt-4 font-semibold">The orb</p>
            <p className="mt-1 text-[13.5px] text-paper/55">Thousands of dots on a sphere. Calm when idle, quicker when Gemini is working.</p>
          </div>
          <div className="panel p-6">
            <div className="receipt px-4 py-3 font-mono text-[12px]">
              {[
                ["Penne", "250 g"],
                ["Cream", "200 ml"],
                ["Parmesan", "40 g"],
              ].map(([a, b]) => (
                <p key={a} className="flex items-baseline gap-2 py-1">
                  {a} <span className="leader" /> {b}
                </p>
              ))}
            </div>
            <p className="mt-4 font-semibold">The receipt</p>
            <p className="mt-1 text-[13.5px] text-paper/55">Lists print like a kitchen ticket: dotted leaders, mono quantities, a torn edge.</p>
          </div>
          <div className="panel p-6">
            <div className="flex items-end gap-3 border-b border-saffron pb-2 pt-10">
              <span className="font-mono text-saffron">&gt;</span>
              <span className="text-[20px] font-medium">rajma chawal</span>
              <span className="caret" />
            </div>
            <p className="mt-4 font-semibold">The ruled line</p>
            <p className="mt-1 text-[13.5px] text-paper/55">Inputs are one line on an order pad, not a glowing pill.</p>
          </div>
        </div>
      </Section>

      <Section n={5} title="Voice">
        <p className="max-w-xl text-[15px] leading-relaxed text-paper/65">
          Talk like a good cook writing a shopping list: specific, warm, short. Say quantities. Say what happens next. No
          hype words, no sparkles, no exclamation marks.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-2 border-b border-line bg-ink-2">
            <p className="label px-5 py-3 text-herb">Write</p>
            <p className="label px-5 py-3 text-chili">Not</p>
          </div>
          {VOICE.map(([good, bad]) => (
            <div key={good} className="grid grid-cols-2 border-b border-line last:border-0">
              <p className="px-5 py-3.5 text-[14.5px]">{good}</p>
              <p className="px-5 py-3.5 text-[14.5px] text-paper/40 line-through decoration-paper/20">{bad}</p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
