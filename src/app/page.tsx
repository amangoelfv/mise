import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ClosingAsk } from "@/components/deck/closing-ask";
import { DeckChrome } from "@/components/deck/deck-chrome";
import { TypingDemo } from "@/components/deck/typing-demo";
import { ArrowDown, ArrowRight } from "@/components/icons";
import { JsonCode } from "@/components/json-code";
import { Orb } from "@/components/orb";
import { StoreMark } from "@/components/zepto-connect";
import { CATALOG, dishById, feedVariants } from "@/lib/feed";
import { DISH_STYLES } from "@/lib/styles";
import { SITE } from "@/lib/site";
import type { DishVariant } from "@/lib/types";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  description: SITE.description,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  inLanguage: "en-IN",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
};

const TITLES = ["Mise", "Problem", "Product", "How it works", "Four ways", "Under the hood", "Stores", "Try it"];

const reveal = (step: number) => ({ "--d": step }) as CSSProperties;

function Slide({ children, id, className = "" }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} data-slide className={`relative flex min-h-dvh snap-start items-center px-6 pb-20 pt-24 sm:px-12 lg:px-20 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  );
}

function Kicker({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="reveal flex items-baseline gap-3" style={reveal(0)}>
      <span className="dots text-[20px] leading-none text-saffron">{String(n).padStart(2, "0")}</span>
      <span className="label">{children}</span>
    </p>
  );
}

function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`display reveal mt-6 text-[clamp(2.3rem,5vw,4.4rem)] ${className}`} style={reveal(1)}>
      {children}
    </h2>
  );
}

const FRICTION = [
  ["7:40", "Search “white sauce pasta recipe”"],
  ["7:43", "Scroll past the story to the ingredients"],
  ["7:45", "Halve it for two, convert cups to grams"],
  ["7:48", "Copy the list into notes"],
  ["7:49", "Open the grocery app"],
  ["7:50", "Search, add, repeat. Twelve times"],
  ["8:05", "Remember the cream after checkout"],
];

const STEPS = [
  ["Dish", "You", "Type anything: “rajma chawal”, “that creamy pasta”."],
  ["Style", "You", "Restaurant, basic, healthy or protein-rich, tuned to your age, diet and protein target."],
  ["List", "Gemini", "Exact quantities for your servings; pantry staples and items already in your Zepto history are skipped. Untick anything else you have."],
  ["Cart", "Gemini + Mise", "Gemini picks the best Zepto product per ingredient for your style and budget, with a short why-this-pick. Mise builds the cart live on Zepto."],
  ["Door", "Mise", "You review and edit, then Mise orders on its own Zepto account and delivers to your address."],
];

const PIPELINE = [
  ["You", "“white sauce pasta”"],
  ["Gemini 3.5 Flash-Lite", "Four takes on the dish"],
  ["Gemini 3.8 Flash", "Ingredient list against a JSON schema"],
  ["Mise engine", "Searches live Zepto; Gemini picks the best product per item"],
  ["Cart", "Built in-process, your kitchen staples already skipped"],
  ["Zepto", "Order placed and delivered to your door"],
];

const STORES: [string, string, string][] = [
  ["Zepto", "Live", "Phone + OTP"],
  ["Blinkit", "Planned", "Phone + OTP"],
  ["Swiggy Instamart", "Planned", "Phone + OTP"],
  ["BigBasket", "Planned", "Account"],
  ["Amazon Fresh", "Planned", "Account"],
];

const FIGURES: [string, (v: DishVariant, items: number) => string][] = [
  ["Items to buy", (_, items) => String(items)],
  ["Calories", (v) => String(v.kcalPerServing)],
  ["Protein", (v) => `${v.proteinGrams} g`],
  ["Time", (v) => `${v.timeMinutes} min`],
];

const SNIPPET = JSON.stringify(
  {
    version: "1.0",
    dish: { name: "White Sauce Pasta", style: "restaurant", servings: 2 },
    connector: { provider: "zepto", connectionId: "conn_••••" },
    items: [
      {
        id: "ing_02",
        name: "Fresh cream",
        searchQuery: "fresh cream",
        quantity: 200,
        unit: "ml",
        category: "dairy",
        pantryStaple: false,
      },
    ],
  },
  null,
  2,
);

export default function Landing() {
  const pasta = dishById("white-sauce-pasta");
  const variants = new Map(feedVariants(pasta, "sample").variants.map((v) => [v.style, v]));
  const itemCounts = new Map(DISH_STYLES.map((s) => [s.id, pasta.styles[s.id].items.length]));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c") }}
      />
      <DeckChrome titles={TITLES} />
      <main id="deck" className="deck h-dvh overflow-y-auto overscroll-none">
        {/* 01 · Cover */}
        <Slide className="dot-grid">
          <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr] md:gap-6">
            <div className="order-2 md:order-1">
              <p className="label reveal" style={reveal(0)}>
                Mise · from <em className="not-italic text-paper/70">mise en place</em>, everything in its place
              </p>
              <h1 className="display reveal mt-6 text-[clamp(2.8rem,5.6vw,5.2rem)]" style={reveal(1)}>
                What do you want to eat today?
              </h1>
              <p className="reveal mt-7 max-w-md text-[17px] leading-relaxed text-paper/60" style={reveal(2)}>
                Type a dish. Mise tailors it to your profile and protein target, writes the exact grocery list with
                Gemini, then builds the cart on live Zepto and delivers it to your door.
              </p>
              <div className="reveal mt-9 flex flex-wrap gap-3" style={reveal(3)}>
                <Link href="/app" className="btn-accent h-12 px-6">
                  Open mise <ArrowRight size={18} />
                </Link>
                <a href="#problem" className="btn-ghost h-12 px-6">
                  How it works <ArrowDown size={17} />
                </a>
              </div>
            </div>
            <div className="reveal order-1 mx-auto aspect-square w-[min(70vw,40vh)] md:order-2 md:w-full md:max-w-[580px]" style={reveal(1)}>
              <Orb energy={0.25} />
            </div>
          </div>
          <dl className="reveal mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3" style={reveal(4)}>
            {[
              ["Styles", "Restaurant · Basic · Healthy · Protein"],
              ["Model", "Gemini 3.8 Flash, structured output"],
              ["Store", "Zepto, more planned"],
            ].map(([k, v]) => (
              <div key={k} className="bg-ink px-5 py-4">
                <dt className="label">{k}</dt>
                <dd className="mt-1.5 text-[14.5px] text-paper/80">{v}</dd>
              </div>
            ))}
          </dl>
        </Slide>

        {/* 02 · Problem */}
        <Slide id="problem">
          <div className="grid gap-12 md:grid-cols-[1fr_0.9fr] md:items-center md:gap-16">
            <div>
              <Kicker n={1}>Problem</Kicker>
              <H2>A recipe is not a shopping list.</H2>
              <p className="reveal mt-6 max-w-md text-[17px] leading-relaxed text-paper/55" style={reveal(2)}>
                Recipes count in cups and pinches, usually for four. Grocery apps sell packs, one search at a time.
                Someone has to translate between the two, and tonight that someone is you.
              </p>
            </div>
            <div className="reveal receipt px-6 py-5" style={reveal(2)}>
              <div className="flex items-center justify-between border-b border-dashed border-paper/15 pb-3">
                <span className="label">Tuesday</span>
                <span className="label">Dinner for two</span>
              </div>
              <ol className="pt-2">
                {FRICTION.map(([time, step], i) => {
                  const last = i === FRICTION.length - 1;
                  return (
                    <li key={time} className="flex items-baseline gap-4 py-2">
                      <span className="w-10 shrink-0 font-mono text-[12px] text-paper/35">{time}</span>
                      <span className={`text-[15px] ${last ? "text-chili" : "text-paper/75"}`}>{step}</span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-2 flex items-baseline justify-between border-t border-dashed border-paper/15 pt-3 font-mono text-[12px] uppercase tracking-[0.1em] text-paper/45">
                <span>Time before cooking</span>
                <span className="dots text-[20px] text-paper">25 min</span>
              </p>
            </div>
          </div>
        </Slide>

        {/* 03 · Product */}
        <Slide>
          <div className="grid gap-12 md:grid-cols-[1fr_0.9fr] md:items-center md:gap-16">
            <div>
              <Kicker n={2}>Product</Kicker>
              <H2>Mise does the translating.</H2>
              <p className="reveal mt-6 max-w-md text-[17px] leading-relaxed text-paper/55" style={reveal(2)}>
                Pick the version you&apos;re in the mood for. Gemini sizes it to your profile and protein target, skips
                what&apos;s already in your kitchen from your Zepto history, chooses the best product for each ingredient
                with a reason, and delivers it to your door.
              </p>
            </div>
            <div className="reveal flex justify-center md:justify-end" style={reveal(2)}>
              <TypingDemo />
            </div>
          </div>
        </Slide>

        {/* 04 · How it works */}
        <Slide>
          <Kicker n={3}>How it works</Kicker>
          <H2 className="max-w-3xl">What happens after you press enter.</H2>
          <div className="reveal mt-12 overflow-hidden rounded-2xl border border-line" style={reveal(2)}>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-ink-2">
                  {["", "Step", "Who", "What happens"].map((h) => (
                    <th key={h} className="label px-5 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STEPS.map(([step, who, what], i) => (
                  <tr key={step} className="border-b border-line last:border-0">
                    <td className="dots w-16 px-5 py-5 align-top text-[26px] leading-none text-saffron">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-5 py-5 align-top text-[17px] font-semibold [font-stretch:110%]">{step}</td>
                    <td className="px-5 py-5 align-top font-mono text-[12.5px] uppercase tracking-[0.08em] text-paper/55">{who}</td>
                    <td className="px-5 py-5 align-top text-[15px] leading-relaxed text-paper/65 max-sm:hidden">{what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Slide>

        {/* 05 · Four ways */}
        <Slide>
          <Kicker n={4}>Four ways</Kicker>
          <H2 className="max-w-3xl">Same dish, four shopping lists.</H2>
          <p className="reveal mt-5 text-paper/50" style={reveal(2)}>
            White Sauce Pasta for two, as Gemini plans it.
          </p>
          <div className="reveal mt-10 overflow-x-auto rounded-2xl border border-line" style={reveal(3)}>
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-ink-2">
                  <th className="w-36 px-5 py-3" />
                  {DISH_STYLES.map((s) => (
                    <th key={s.id} className="label px-5 py-3 font-medium">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[14.5px]">
                <tr className="border-b border-line">
                  <th className="label px-5 py-4 align-top font-medium">The take</th>
                  {DISH_STYLES.map((s) => (
                    <td key={s.id} className="px-5 py-4 align-top text-[16px] font-semibold leading-snug [font-stretch:108%]">
                      {variants.get(s.id)?.title}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-line">
                  <th className="label px-5 py-4 align-top font-medium">Signature</th>
                  {DISH_STYLES.map((s) => (
                    <td key={s.id} className="px-5 py-4 align-top text-paper/60">
                      {variants.get(s.id)?.highlights.join(", ")}
                    </td>
                  ))}
                </tr>
                {FIGURES.map(([label, value]) => (
                  <tr key={label} className="border-b border-line last:border-0">
                    <th className="label px-5 py-3.5 font-medium">{label}</th>
                    {DISH_STYLES.map((s) => (
                      <td key={s.id} className="dots px-5 py-3.5 text-[19px] text-paper/90">
                        {value(variants.get(s.id)!, itemCounts.get(s.id) ?? 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Slide>

        {/* 06 · Under the hood */}
        <Slide>
          <div className="grid gap-12 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <Kicker n={5}>Under the hood</Kicker>
              <H2>Gemini answers in JSON, not prose.</H2>
              <p className="reveal mt-6 max-w-md text-[16.5px] leading-relaxed text-paper/55" style={reveal(2)}>
                Both Gemini calls use structured output against a JSON schema, so every answer is machine-readable. Mise
                turns the list into a versioned cart contract that any store integration can implement.
              </p>
              <ol className="reveal mt-9" style={reveal(3)}>
                {PIPELINE.map(([name, detail], i) => (
                  <li key={name} className="flex gap-4">
                    <div className="flex w-3 flex-col items-center">
                      <span className={`mt-[7px] size-2 shrink-0 rounded-full ${i === 1 || i === 2 ? "bg-saffron" : "bg-paper/40"}`} />
                      {i < PIPELINE.length - 1 && <span className="my-1 flex-1 border-l border-dotted border-paper/25" />}
                    </div>
                    <p className="pb-4 text-[15px]">
                      <span className="font-semibold">{name}</span> <span className="text-paper/50">· {detail}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="reveal receipt" style={reveal(3)}>
              <div className="flex items-center justify-between border-b border-dashed border-paper/15 px-5 py-3.5 font-mono text-[12px]">
                <span>
                  <span className="text-saffron">POST</span> /v1/carts
                </span>
                <span className="text-paper/40">CONTRACT.md</span>
              </div>
              <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-relaxed">
                <JsonCode json={SNIPPET} />
              </pre>
            </div>
          </div>
        </Slide>

        {/* 07 · Stores */}
        <Slide>
          <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:items-center md:gap-16">
            <div>
              <Kicker n={6}>Stores</Kicker>
              <H2>Zepto today. Other stores are adapters.</H2>
              <p className="reveal mt-6 max-w-md text-[16.5px] leading-relaxed text-paper/55" style={reveal(2)}>
                Connecting takes a phone number and an OTP. Mise keeps an opaque connection handle, never a password or a
                card. The cart contract doesn&apos;t mention Zepto anywhere it doesn&apos;t have to.
              </p>
              <p className="reveal mt-8 font-mono text-[12.5px] leading-loose text-paper/45" style={reveal(3)}>
                <span className="text-paper/70">Next:</span> weekly plans / split across stores / more quick-commerce stores
              </p>
            </div>
            <div className="reveal panel divide-y divide-line" style={reveal(2)}>
              {STORES.map(([name, status, login]) => (
                <div key={name} className="flex items-center gap-4 px-5 py-3.5">
                  <StoreMark name={name} size={40} live={status === "Live"} />
                  <p className={`flex-1 text-[15px] ${status === "Live" ? "font-semibold" : "text-paper/55"}`}>{name}</p>
                  <span className="hidden font-mono text-[11.5px] text-paper/40 sm:inline">{login}</span>
                  <span className={`tag ${status === "Live" ? "border-herb/30 text-herb" : ""}`}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* 08 · Close */}
        <Slide className="dot-grid">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="reveal size-[min(56vw,30vh)]" style={reveal(0)}>
              <Orb energy={0.35} />
            </div>
            <h2 className="display reveal mt-8 text-[clamp(2.4rem,6vw,4.6rem)]" style={reveal(1)}>
              So, what are we cooking?
            </h2>
            <div className="reveal relative z-20 mt-12 w-full text-left" style={reveal(2)}>
              <ClosingAsk catalog={CATALOG} />
            </div>
            <p className="reveal label mt-16 flex gap-4" style={reveal(3)}>
              <span>Mise · made for the Gemini hackathon</span>
              <Link href="/brand" className="text-paper/70 underline-offset-4 hover:text-saffron hover:underline">
                Brand
              </Link>
            </p>
          </div>
        </Slide>
      </main>
    </>
  );
}
