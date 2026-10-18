import type { DishStyleId } from "./contract";
import { type AgeBand, proteinTargetG } from "./nutrition";

/**
 * Which of the four styles to highlight as "recommended for you", from the profile.
 * Deterministic and transparent — it exists to make the age/protein personalization
 * visible on the style cards. Returns null when no profile is set (nothing to base it on).
 */
export function recommendedStyle(ageBand: AgeBand | null, weightKg: number | null): { style: DishStyleId; reason: string } | null {
  if (!ageBand) return null;
  if (ageBand === "senior") return { style: "healthy", reason: "lighter — matched to your age" };
  if (ageBand === "under20") return { style: "protein", reason: "protein-forward — for your age" };
  const protein = proteinTargetG(ageBand, weightKg);
  if (protein && protein >= 60) return { style: "protein", reason: `~${protein}g protein/day goal` };
  return { style: "healthy", reason: "balanced — matched to your profile" };
}
