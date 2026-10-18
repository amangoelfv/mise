"use client";

import { useRef, useState } from "react";
import type { BudgetPreference, Diet } from "@/lib/contract";
import { HEIGHT_CM, WEIGHT_KG, mealProteinShareG, proteinTargetG, type AgeBand } from "@/lib/nutrition";
import { AGE_BAND_OPTIONS, BUDGET_OPTIONS, DIET_OPTIONS } from "@/lib/options";
import { getPrefs, updatePrefs } from "@/lib/prefs";
import { Dialog } from "../dialog";

const CHIP = "rounded-[10px] border px-3.5 py-1.5 text-[13.5px] transition";
const CHIP_ON = "border-saffron bg-saffron text-ink";
const CHIP_OFF = "border-line text-paper/60 hover:border-paper/30 hover:text-paper";
const FIELD =
  "h-11 w-full rounded-[12px] border border-line bg-ink px-4 text-[14px] outline-none placeholder:text-paper/25 focus:border-saffron";

/** Digits only, and only inside a plausible human range — otherwise we know nothing. */
function parseInRange(value: string, range: { min: number; max: number }): number | null {
  const n = Number(value);
  if (!value.trim() || !Number.isFinite(n)) return null;
  return n >= range.min && n <= range.max ? Math.round(n) : null;
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/**
 * The first-run profile questions. Owns its draft, persists both outcomes itself, and then
 * calls onDone — so every exit path (Continue, Skip, Esc, backdrop, X) looks the same to the
 * caller and none of them can leave the flow waiting.
 */
export function ProfileDialog({ open, onDone }: { open: boolean; onDone: () => void }) {
  const [start] = useState(getPrefs);
  const [ageBand, setAgeBand] = useState<AgeBand | null>(start.ageBand);
  const [weight, setWeight] = useState(start.weightKg === null ? "" : String(start.weightKg));
  const [height, setHeight] = useState(start.heightCm === null ? "" : String(start.heightCm));
  const [diet, setDiet] = useState<Diet>(start.diet);
  const [skipStaples, setSkipStaples] = useState(start.skipStaples);
  const [budget, setBudget] = useState<BudgetPreference>(start.budget);

  const weightKg = parseInRange(weight, WEIGHT_KG);
  const target = proteinTargetG(ageBand, weightKg);

  /**
   * Closing a native <dialog> programmatically also fires its close event, so onDone's own
   * state change echoes back here as a second call. First outcome wins; the echo is dropped.
   * Without this, Continue would be overwritten by "skipped" and the flow would fetch twice.
   */
  const resolved = useRef(false);
  function finish(patch: Parameters<typeof updatePrefs>[0]) {
    if (resolved.current) return;
    resolved.current = true;
    updatePrefs(patch);
    onDone();
  }

  const save = () =>
    finish({
      ageBand,
      weightKg,
      heightCm: parseInRange(height, HEIGHT_CM),
      diet,
      skipStaples,
      budget,
      profileStatus: "saved",
    });

  const skip = () => finish({ profileStatus: "skipped" });

  return (
    <Dialog open={open} onClose={skip} title="Cook it your way" focusFirstField={false}>
      <p className="-mt-2 mb-6 text-[14px] leading-relaxed text-paper/55">
        Five quick answers and Mise tailors every suggestion to you. Skip and we&apos;ll use sensible defaults — you
        can fill this in under Settings whenever.
      </p>

      <div className="space-y-6">
        <Group label="Age">
          {AGE_BAND_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={ageBand === option.id}
              onClick={() => setAgeBand(ageBand === option.id ? null : option.id)}
              className={`${CHIP} ${ageBand === option.id ? CHIP_ON : CHIP_OFF}`}
            >
              {option.label}
            </button>
          ))}
        </Group>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="profile-weight" className="label">
              Weight (kg)
            </label>
            <input
              id="profile-weight"
              inputMode="numeric"
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="70"
              className={`mt-2.5 ${FIELD}`}
            />
          </div>
          <div>
            <label htmlFor="profile-height" className="label">
              Height (cm)
            </label>
            <input
              id="profile-height"
              inputMode="numeric"
              value={height}
              onChange={(e) => setHeight(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="170"
              className={`mt-2.5 ${FIELD}`}
            />
          </div>
        </div>

        <p className="font-mono text-[11.5px] leading-relaxed text-paper/40">
          {target
            ? `About ${target} g protein a day, roughly ${mealProteinShareG(target)} g a meal. A general guide, not nutritional advice.`
            : "Optional. With your age and weight we can aim each dish at a sensible protein target."}
        </p>

        <Group label="Diet">
          {DIET_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={diet === option.id}
              onClick={() => setDiet(option.id)}
              className={`${CHIP} ${diet === option.id ? CHIP_ON : CHIP_OFF}`}
            >
              {option.label}
            </button>
          ))}
        </Group>

        <Group label="Shopping">
          {BUDGET_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={budget === option.id}
              onClick={() => setBudget(option.id)}
              title={option.hint}
              className={`${CHIP} ${budget === option.id ? CHIP_ON : CHIP_OFF}`}
            >
              {option.label}
            </button>
          ))}
        </Group>

        <div className="flex items-center justify-between gap-6 border-t border-line pt-5">
          <div className="min-w-0">
            <p className="text-[15px]">Skip pantry staples</p>
            <p className="mt-0.5 text-[13px] text-paper/45">Leave salt, oil and basic spices unticked.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={skipStaples}
            aria-label="Skip pantry staples"
            onClick={() => setSkipStaples(!skipStaples)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${skipStaples ? "bg-saffron" : "bg-ink-3"}`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full transition-all duration-300 ${skipStaples ? "left-6 bg-ink" : "left-1 bg-paper/60"}`}
            />
          </button>
        </div>
      </div>

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={skip} className="btn-ghost">
          Skip, use defaults
        </button>
        <button type="button" onClick={save} className="btn-accent">
          Continue
        </button>
      </div>
    </Dialog>
  );
}
