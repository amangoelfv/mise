/**
 * Prompt construction, kept apart from the Gemini client so the exact wording is unit-testable
 * without an API key — including the instruction that stops a budget preference from collapsing
 * the four style cards into one another.
 */
import type { BudgetPreference, Diet } from "./contract";
import { mealProteinShareG } from "./nutrition";
import { DISH_STYLES, styleById } from "./styles";
import type { IngredientsInput, VariantsInput } from "./types";

const DIET_RULES: Record<Diet, string> = {
  any: "No dietary restriction.",
  vegetarian: "Strictly vegetarian (Indian sense): no meat, fish, seafood or eggs. Dairy is fine.",
  eggetarian: "Vegetarian plus eggs. No meat, fish or seafood.",
  vegan: "Strictly vegan: no meat, fish, eggs, dairy, ghee or honey.",
  jain: "Jain: vegetarian, no eggs, and no onion, garlic, potato, carrot, beetroot or other root vegetables.",
};

/**
 * A tier modifier *within* a style, never a replacement for it: "basic" is already the
 * budget-friendly take, so a blunt "make it cheap" would pull all four cards toward it.
 */
const BUDGET_RULES: Record<BudgetPreference, string> = {
  best_rated:
    "Shopping preference: quality first. Prefer well-regarded ingredients and brands " +
    "where they genuinely improve the dish.",
  best_price:
    "Shopping preference: value first. Prefer affordable, widely available ingredients " +
    "and common pack sizes; avoid premium imports where a local equivalent works.",
};

export function variantsPrompt({ query, diet, avoid, budget, proteinTargetG }: VariantsInput): string {
  return [
    `Someone typed: "${query}"`,
    `Diet: ${DIET_RULES[diet]}`,
    avoid.length ? `Must avoid: ${avoid.join(", ")}.` : "",
    BUDGET_RULES[budget],
    proteinTargetG
      ? `This person's daily protein target is about ${proteinTargetG} g, so roughly ${mealProteinShareG(proteinTargetG)} g per serving. Keep proteinGrams realistic for each take rather than inflating it.`
      : "",
    "Return the dish, then exactly four takes on it, one per style, in this order:",
    ...DISH_STYLES.map((s) => `- ${s.id} (${s.label}): ${s.guidance}`),
    "Every take must honour the diet and avoid list, and still be recognisably this dish.",
    "Keep the four takes clearly distinct from one another. The shopping preference changes the tier of ingredients within a take, never which take is which.",
    "Numbers are per serving and realistic. Keep language short and appetising; no emoji.",
    "If the input is not a dish or food, set isDish to false, explain kindly in message, and return an empty variants array.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function ingredientsPrompt(input: IngredientsInput): string {
  const style = styleById(input.style);
  return [
    `Write the complete grocery list to cook "${input.variant.title}", a ${style.label.toLowerCase()} take on ${input.dish}${input.cuisine ? ` (${input.cuisine})` : ""}, for ${input.servings} servings.`,
    `This take: ${input.variant.tagline}. Signature ingredients: ${input.variant.highlights.join(", ") || "chef's choice"}.`,
    `Style guidance: ${style.guidance}`,
    `Diet: ${DIET_RULES[input.diet]}`,
    input.avoid.length ? `Must avoid (allergies/dislikes): ${input.avoid.join(", ")}.` : null,
    BUDGET_RULES[input.budget],
    "",
    "Rules:",
    "- Include everything needed, including oil, salt and spices. Typically 6–16 items.",
    "- quantity/unit = the amount the recipe uses. Prefer g, ml or pcs; tsp/tbsp only for small amounts of spices, sauces or oil.",
    "- searchQuery = the generic product a shopper would type into Zepto (e.g. 'penne pasta', 'fresh cream', 'parmesan cheese'). No brands unless the product is only sold by brand.",
    "- pantryStaple = true only for things most Indian kitchens already have: salt, sugar, cooking oil, turmeric, red chilli powder, cumin, black pepper, atta, maida, water.",
    "- optional = true for garnishes and add-ons the dish works without.",
    "- substitutes: up to 2 acceptable alternatives, best first.",
    "- estimatedPriceInr: approximate price in India of the smallest pack you would buy on Zepto (whole pack, not just the portion used).",
    "- notes: only when useful (e.g. 'about 4 cloves', 'ripe'), otherwise omit.",
  ]
    .filter((line) => line !== null)
    .join("\n");
}
