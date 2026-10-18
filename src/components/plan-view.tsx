"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { styleById } from "@/lib/styles";
import {
  DAY_LABELS,
  MEALS,
  MEAL_LABELS,
  assignSlot,
  removeSaved,
  setWishlistUser,
  slotKey,
  usePlan,
} from "@/lib/wishlist";
import { ArrowRight, Calendar, Close, Plus } from "./icons";

export function PlanView({ userId, firstName }: { userId: string; firstName: string }) {
  // Before usePlan(), so the first snapshot is this account's record.
  setWishlistUser(userId);

  const plan = usePlan();
  const byId = new Map(plan.saved.map((s) => [s.id, s]));
  // Which empty slot has its dish picker open. Only one at a time.
  const [openSlot, setOpenSlot] = useState<string | null>(null);
  const noneSaved = plan.saved.length === 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-5 pb-24 pt-10 sm:px-8">
      <h1 className="display animate-rise text-[40px]">Your plan</h1>
      <p className="animate-rise mt-3 text-paper/50 [animation-delay:60ms]">
        Hi {firstName}. Your saved dishes and a week of meals, kept on this device for your account.
      </p>

      <div className="mt-10 space-y-12">
        <section className="animate-rise">
          <div className="mb-3 px-1">
            <h2 className="label">Saved dishes</h2>
          </div>
          {noneSaved ? (
            <div className="panel flex flex-col items-center px-5 py-10 text-center">
              <p className="text-paper/60">Nothing saved yet.</p>
              <p className="mt-1.5 text-[13.5px] text-paper/40">
                Open a dish, then tap “Save to plan” on the ingredients screen.
              </p>
              <Link href="/app" className="btn mt-6">
                Find a dish <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.saved.map((s) => (
                <div key={s.id} className="panel flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{s.dish}</p>
                    {s.variantTitle && <p className="mt-0.5 truncate text-[13px] text-paper/55">{s.variantTitle}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="tag">{styleById(s.style).label}</span>
                      {s.cuisine && <span className="tag">{s.cuisine}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      href={`/app?q=${encodeURIComponent(s.dish)}`}
                      className="btn-ghost h-9 px-3 text-[13px]"
                    >
                      Cook <ArrowRight size={15} />
                    </Link>
                    <button
                      type="button"
                      aria-label={`Remove ${s.dish}`}
                      onClick={() => removeSaved(s.id)}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-paper/30 transition hover:bg-chili/10 hover:text-chili"
                    >
                      <Close size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="animate-rise">
          <div className="mb-3 px-1">
            <h2 className="label">This week</h2>
            <p className="mt-1.5 text-[13px] text-paper/40">
              {noneSaved ? "Save a dish first, then assign it to a meal." : "Tap + to assign a saved dish to a meal."}
            </p>
          </div>
          <div className="panel overflow-x-auto p-3 sm:p-4">
            <div
              className="grid gap-2"
              style={{ minWidth: 680, gridTemplateColumns: "72px repeat(7, minmax(76px, 1fr))" }}
            >
              <div />
              {DAY_LABELS.map((day) => (
                <div key={day} className="label pb-1 text-center">
                  {day}
                </div>
              ))}

              {MEALS.map((meal) => (
                <Fragment key={meal}>
                  <div className="label flex items-center pr-1 text-[10px] leading-tight">{MEAL_LABELS[meal]}</div>
                  {DAY_LABELS.map((_, dayIndex) => {
                    const key = slotKey(dayIndex, meal);
                    const id = plan.slots[key] ?? null;
                    const dish = id ? byId.get(id) : undefined;
                    const label = `${MEAL_LABELS[meal]}, ${DAY_LABELS[dayIndex]}`;

                    if (dish) {
                      return (
                        <div key={key} className="relative min-h-[60px] rounded-[10px] border border-line bg-ink p-1.5">
                          <div className="flex h-full flex-col">
                            <span className="line-clamp-2 text-[12px] leading-tight text-paper/85">{dish.dish}</span>
                            <span className="mt-auto truncate pt-1 font-mono text-[12px] text-paper/35">
                              {styleById(dish.style).label}
                            </span>
                          </div>
                          <button
                            type="button"
                            aria-label={`Clear ${label}`}
                            onClick={() => assignSlot(key, null)}
                            className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-line bg-ink-3 text-paper/40 transition hover:text-chili"
                          >
                            <Close size={11} />
                          </button>
                        </div>
                      );
                    }

                    if (openSlot === key) {
                      return (
                        <div key={key} className="min-h-[60px] rounded-[10px] border border-line bg-ink p-1.5">
                          <select
                            aria-label={`Assign a dish to ${label}`}
                            value=""
                            onChange={(e) => {
                              if (e.target.value) assignSlot(key, e.target.value);
                              setOpenSlot(null);
                            }}
                            onBlur={() => setOpenSlot(null)}
                            className="h-full w-full rounded-[8px] border border-line bg-ink-2 px-1 text-[12px] text-paper outline-none focus:border-saffron"
                          >
                            <option value="">Add dish…</option>
                            {plan.saved.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.dish}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="min-h-[60px] rounded-[10px] border border-line bg-ink p-1.5">
                        <button
                          type="button"
                          disabled={noneSaved}
                          aria-label={`Add a dish to ${label}`}
                          title={noneSaved ? "Save a dish first" : undefined}
                          onClick={() => setOpenSlot(key)}
                          className="grid h-full min-h-[48px] w-full place-items-center rounded-[8px] text-paper/25 transition hover:text-saffron disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-paper/25"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 px-1 font-mono text-[12px] text-paper/30">
            <Calendar size={13} /> Mon to Sun · Breakfast, Lunch, Dinner
          </p>
        </section>
      </div>
    </main>
  );
}
