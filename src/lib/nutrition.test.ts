import { test } from "node:test";
import assert from "node:assert/strict";
import { proteinTargetG, mealProteinShareG, PROTEIN_G_PER_KG } from "./nutrition.ts";

test("scales with weight by age band", () => {
  assert.equal(proteinTargetG("adult", 70), 60); // 70 * 0.85
  assert.equal(proteinTargetG("under20", 70), 70); // 70 * 1.0
  assert.equal(proteinTargetG("senior", 70), 77); // 70 * 1.1
});

test("returns null when either input is missing", () => {
  assert.equal(proteinTargetG(null, 70), null);
  assert.equal(proteinTargetG("adult", null), null);
  assert.equal(proteinTargetG(null, null), null);
});

// Review Focus 1
test("never returns NaN or an absurd target for out-of-range weight", () => {
  assert.equal(proteinTargetG("adult", 0), null);
  assert.equal(proteinTargetG("adult", -5), null);
  assert.equal(proteinTargetG("adult", Number.NaN), null);
  assert.equal(proteinTargetG("adult", 900), proteinTargetG("adult", 250)); // clamped to max
  assert.equal(proteinTargetG("adult", 10), proteinTargetG("adult", 25)); // clamped to min
});

test("senior factor exceeds adult, reflecting age-related muscle loss", () => {
  assert.ok(PROTEIN_G_PER_KG.senior > PROTEIN_G_PER_KG.adult);
  assert.ok(PROTEIN_G_PER_KG.under20 > PROTEIN_G_PER_KG.adult);
});

test("meal share is a third of the daily target", () => {
  assert.equal(mealProteinShareG(60), 20);
});
