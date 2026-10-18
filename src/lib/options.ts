/**
 * Labelled choices for the profile questions, shared by the first-run dialog and Settings
 * so the two never drift. Ids are the stored values; labels are what a person reads.
 */
import type { BudgetPreference, Diet } from "./contract";
import type { AgeBand } from "./nutrition";

export const DIET_OPTIONS: { id: Diet; label: string }[] = [
  { id: "any", label: "Anything" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "eggetarian", label: "Eggetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "jain", label: "Jain" },
];

/** Numeric labels rather than "middle-aged" / "old": unambiguous, and kinder to read. */
export const AGE_BAND_OPTIONS: { id: AgeBand; label: string }[] = [
  { id: "under20", label: "Under 20" },
  { id: "adult", label: "20–50" },
  { id: "senior", label: "50+" },
];

export const BUDGET_OPTIONS: { id: BudgetPreference; label: string; hint: string }[] = [
  { id: "best_rated", label: "Best rated", hint: "Pick the better-reviewed product." },
  { id: "best_price", label: "Best price", hint: "Pick the cheapest that fits." },
];
