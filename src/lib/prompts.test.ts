import { test } from "node:test";
import assert from "node:assert/strict";
import { ingredientsPrompt, variantsPrompt } from "./prompts.ts";

const base = { query: "paneer tikka", diet: "any" as const, avoid: [], budget: "best_rated" as const, proteinTargetG: null };

test("names every style so all four takes are requested", () => {
  const p = variantsPrompt(base);
  for (const style of ["restaurant", "basic", "healthy", "protein"]) assert.match(p, new RegExp(style));
});

// Review Focus 5 — best_price must not collapse the four cards toward "basic"
test("tells Gemini to keep the four takes distinct whatever the budget", () => {
  for (const budget of ["best_rated", "best_price"] as const) {
    const p = variantsPrompt({ ...base, budget });
    assert.match(p, /clearly distinct from one another/i);
    assert.match(p, /never which take is which/i);
  }
});

test("value and quality preferences produce different prompts", () => {
  const rated = variantsPrompt({ ...base, budget: "best_rated" });
  const price = variantsPrompt({ ...base, budget: "best_price" });
  assert.notEqual(rated, price);
  assert.match(rated, /quality first/i);
  assert.match(price, /value first/i);
});

test("omits the protein line when no target is known", () => {
  assert.doesNotMatch(variantsPrompt(base), /protein target/i);
});

test("states the daily target and a per-serving share when known", () => {
  const p = variantsPrompt({ ...base, proteinTargetG: 60 });
  assert.match(p, /about 60 g/);
  assert.match(p, /20 g per serving/);
});

test("spells out the diet rule rather than the bare value", () => {
  const p = variantsPrompt({ ...base, diet: "jain" });
  assert.match(p, /no onion, garlic, potato/i);
});

test("lists the avoid items when present", () => {
  assert.match(variantsPrompt({ ...base, avoid: ["peanuts", "mushrooms"] }), /peanuts, mushrooms/);
});

const ing = {
  dish: "Paneer Tikka",
  cuisine: "Indian",
  style: "healthy" as const,
  variant: { title: "Charred Yogurt Paneer", tagline: "Lighter marinade", highlights: ["paneer", "yogurt", "chaat masala"] },
  servings: 2,
  diet: "any" as const,
  avoid: [],
  budget: "best_rated" as const,
};

test("ingredients prompt carries the budget preference too", () => {
  assert.match(ingredientsPrompt({ ...ing, budget: "best_price" }), /value first/i);
  assert.match(ingredientsPrompt({ ...ing, budget: "best_rated" }), /quality first/i);
});

test("ingredients prompt names the dish, servings and style guidance", () => {
  const p = ingredientsPrompt(ing);
  assert.match(p, /Paneer Tikka/);
  assert.match(p, /2 servings/);
  assert.match(p, /whole grains/i); // the healthy style's guidance
});
