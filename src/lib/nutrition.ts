/**
 * Rough protein targets for the profile form. General-population figures, not medical advice:
 * they exist to tune Gemini's suggestions, not to prescribe anyone's intake.
 */

export type AgeBand = "under20" | "adult" | "senior";

export const AGE_BANDS = ["under20", "adult", "senior"] as const;

/** Daily protein per kg of body weight. Higher while growing, and again later in life. */
export const PROTEIN_G_PER_KG: Record<AgeBand, number> = { under20: 1.0, adult: 0.85, senior: 1.1 };

/** Plausible human ranges. Anything outside is a typo, not an answer. */
export const WEIGHT_KG = { min: 25, max: 250 } as const;
export const HEIGHT_CM = { min: 90, max: 230 } as const;

/**
 * Daily protein target in grams, or null when we weren't told enough to say.
 * Protein scales with weight, not height, so height is deliberately not an input.
 */
export function proteinTargetG(ageBand: AgeBand | null, weightKg: number | null): number | null {
  if (!ageBand) return null;
  if (typeof weightKg !== "number" || !Number.isFinite(weightKg) || weightKg <= 0) return null;
  const kg = Math.min(WEIGHT_KG.max, Math.max(WEIGHT_KG.min, weightKg));
  return Math.round(kg * PROTEIN_G_PER_KG[ageBand]);
}

/** One meal's share of the daily target, for comparing against a dish's per-serving protein. */
export const mealProteinShareG = (target: number) => Math.round(target / 3);
