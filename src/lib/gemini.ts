import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { CartItem, Diet, DishStyleId } from "./contract";
import { CATEGORIES, STYLES, UNITS, num, oneOf, str, strList } from "./http";
import { feedIngredients, feedVariants, findDish } from "./feed";
import { POPULAR_DISHES } from "./feed-names";
import { DISH_STYLES, styleById } from "./styles";
import type { IngredientsInput, IngredientsOk, VariantsInput, VariantsResult } from "./types";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FAST_MODEL = process.env.GEMINI_FAST_MODEL || "gemini-3.5-flash-lite";

const apiKey = process.env.GEMINI_API_KEY;
// On Google Cloud, GOOGLE_GENAI_USE_VERTEXAI=true + GOOGLE_CLOUD_PROJECT uses the service account instead of a key.
const useVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === "true";
const ai = apiKey || useVertex ? new GoogleGenAI(apiKey ? { apiKey } : {}) : null;
export const geminiConfigured = !!ai;

const DIET_RULES: Record<Diet, string> = {
  any: "No dietary restriction.",
  vegetarian: "Strictly vegetarian (Indian sense): no meat, fish, seafood or eggs. Dairy is fine.",
  eggetarian: "Vegetarian plus eggs. No meat, fish or seafood.",
  vegan: "Strictly vegan: no meat, fish, eggs, dairy, ghee or honey.",
  jain: "Jain: vegetarian, no eggs, and no onion, garlic, potato, carrot, beetroot or other root vegetables.",
};

const PERSONA =
  "You are Mise, a precise, warm culinary assistant for home cooks in India who buy groceries on quick-commerce apps like Zepto. " +
  "You know Indian kitchens, Indian grocery brands and pack sizes, and global dishes as they are cooked in Indian homes.";

const variantsSchema = {
  type: "object",
  properties: {
    isDish: { type: "boolean", description: "False if the input is not a food or drink someone could cook." },
    message: { type: "string", description: "Only when isDish is false: one short, friendly sentence." },
    dish: { type: "string", description: "Correctly spelled, title-cased dish name." },
    cuisine: { type: "string", description: "Short cuisine label, e.g. 'Italian · Indian home-style'." },
    summary: { type: "string", description: "One sentence describing the dish." },
    isVeg: { type: "boolean" },
    variants: {
      type: "array",
      items: {
        type: "object",
        properties: {
          style: { type: "string", enum: [...STYLES] },
          title: { type: "string", description: "A specific, appetising name for this take, max 4 words." },
          tagline: { type: "string", description: "Max 12 words: what makes this take different." },
          highlights: { type: "array", items: { type: "string" }, description: "Exactly 3 signature ingredients." },
          timeMinutes: { type: "integer" },
          kcalPerServing: { type: "integer" },
          proteinGrams: { type: "integer", description: "Protein per serving in grams." },
        },
        required: ["style", "title", "tagline", "highlights", "timeMinutes", "kcalPerServing", "proteinGrams"],
      },
    },
  },
  required: ["isDish", "dish", "cuisine", "summary", "isVeg", "variants"],
};

const ingredientsSchema = {
  type: "object",
  properties: {
    tip: { type: "string", description: "One practical chef tip for this exact version, max 20 words." },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          searchQuery: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string", enum: [...UNITS] },
          category: { type: "string", enum: [...CATEGORIES] },
          pantryStaple: { type: "boolean" },
          optional: { type: "boolean" },
          substitutes: { type: "array", items: { type: "string" } },
          notes: { type: "string" },
          estimatedPriceInr: { type: "integer" },
        },
        required: [
          "name",
          "searchQuery",
          "quantity",
          "unit",
          "category",
          "pantryStaple",
          "optional",
          "substitutes",
          "estimatedPriceInr",
        ],
      },
    },
  },
  required: ["tip", "items"],
};

async function generateWith(model: string, prompt: string, schema: object, temperature: number): Promise<unknown> {
  if (!ai) throw new Error("Gemini is not configured");
  const request = (withThinking: boolean) =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: PERSONA,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
        temperature,
        ...(withThinking ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      },
    });
  let response;
  try {
    response = await request(true);
  } catch (error) {
    // Some models reject thinking config; retry once without it.
    if (!/thinking/i.test(String(error))) throw error;
    response = await request(false);
  }
  const text = response.text?.trim() ?? "";
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    const finish = response.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(`${model} returned unparseable JSON (finishReason=${finish}, ${text.length} chars)`);
  }
}

/** Tries each model in order, so one unavailable or overloaded model doesn't fail the request. */
async function generateJson(models: string[], prompt: string, schema: object, temperature: number): Promise<unknown> {
  let lastError: unknown;
  for (const model of [...new Set(models)]) {
    // Overload (503) and rate limits (429) are often momentary: one quick retry before moving on.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await generateWith(model, prompt, schema, temperature);
      } catch (error) {
        lastError = error;
        const status = (error as { status?: number }).status;
        console.error(`[gemini] ${model} attempt ${attempt + 1} failed (${status ?? "no status"}):`, error instanceof Error ? error.message : error);
        if (status !== 503 && status !== 429) break;
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 700));
      }
    }
  }
  throw lastError;
}

const record = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

/** Thrown when Gemini is down and the built-in menu has nothing sensible to serve instead. */
export class GeminiUnavailableError extends Error {}

type Offline = "sample" | "fallback";

/** Built-in menu instead of Gemini: the matching dish, or suggestions (never a different dish's data). */
function offlineVariants(query: string, source: Offline): VariantsResult {
  const dish = findDish(query);
  if (dish) return feedVariants(dish, source);
  return {
    ok: false,
    message:
      source === "sample"
        ? "Without a Gemini key, Mise cooks from its built-in menu. Pick one of these:"
        : "Gemini is busy right now and that dish isn't on the built-in menu. Try again in a minute, or pick one of these:",
    suggestions: POPULAR_DISHES.slice(0, 10),
  };
}

function offlineIngredients(input: IngredientsInput, source: Offline): IngredientsOk {
  const dish = findDish(input.dish) ?? findDish(input.variant.title);
  if (!dish) throw new GeminiUnavailableError("Gemini is busy right now. Try again in a minute, or pick a dish from the built-in menu.");
  return feedIngredients(dish, input.style, input.servings, source);
}

export async function getVariants({ query, diet, avoid }: VariantsInput): Promise<VariantsResult> {
  if (!ai) return offlineVariants(query, "sample");

  const prompt = [
    `Someone typed: "${query}"`,
    `Diet: ${DIET_RULES[diet]}`,
    avoid.length ? `Must avoid: ${avoid.join(", ")}.` : "",
    "Return the dish, then exactly four takes on it, one per style, in this order:",
    ...DISH_STYLES.map((s) => `- ${s.id} (${s.label}): ${s.guidance}`),
    "Every take must honour the diet and avoid list, and still be recognisably this dish.",
    "Numbers are per serving and realistic. Keep language short and appetising; no emoji.",
    "If the input is not a dish or food, set isDish to false, explain kindly in message, and return an empty variants array.",
  ]
    .filter(Boolean)
    .join("\n");

  let raw: Record<string, unknown>;
  try {
    raw = record(await generateJson([FAST_MODEL, MODEL], prompt, variantsSchema, 0.8));
  } catch (error) {
    console.error("[gemini] variants failed on every model; using the built-in menu:", error instanceof Error ? error.message : error);
    return offlineVariants(query, "fallback");
  }
  if (raw.isDish === false) {
    return { ok: false, message: str(raw.message, "That doesn't sound like a dish. Try “paneer butter masala”.") };
  }

  const byStyle = new Map(
    (Array.isArray(raw.variants) ? raw.variants : []).map((v) => [record(v).style, record(v)] as const),
  );
  return {
    ok: true,
    source: "gemini",
    dish: str(raw.dish, query, 60),
    cuisine: str(raw.cuisine, "", 60),
    summary: str(raw.summary, "", 200),
    isVeg: raw.isVeg !== false,
    variants: DISH_STYLES.map((s) => {
      const v = byStyle.get(s.id) ?? {};
      return {
        style: s.id,
        title: str(v.title, s.label, 48),
        tagline: str(v.tagline, s.blurb, 120),
        highlights: strList(v.highlights, 3, 32),
        timeMinutes: Math.round(num(v.timeMinutes, 30, 5, 600)),
        kcalPerServing: Math.round(num(v.kcalPerServing, 0, 0, 3000)),
        proteinGrams: Math.round(num(v.proteinGrams, 0, 0, 300)),
      };
    }),
  };
}

export async function getIngredients(input: IngredientsInput): Promise<IngredientsOk> {
  if (!ai) return offlineIngredients(input, "sample");

  const style = styleById(input.style);
  const prompt = [
    `Write the complete grocery list to cook "${input.variant.title}", a ${style.label.toLowerCase()} take on ${input.dish}${input.cuisine ? ` (${input.cuisine})` : ""}, for ${input.servings} servings.`,
    `This take: ${input.variant.tagline}. Signature ingredients: ${input.variant.highlights.join(", ") || "chef's choice"}.`,
    `Style guidance: ${style.guidance}`,
    `Diet: ${DIET_RULES[input.diet]}`,
    input.avoid.length ? `Must avoid (allergies/dislikes): ${input.avoid.join(", ")}.` : null,
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

  const fallback = (reason: unknown) => {
    console.error("[gemini] ingredients failed on every model; using the built-in menu:", reason instanceof Error ? reason.message : reason);
    return offlineIngredients(input, "fallback");
  };
  let raw: Record<string, unknown>;
  try {
    raw = record(await generateJson([MODEL, FAST_MODEL], prompt, ingredientsSchema, 0.4));
  } catch (error) {
    return fallback(error);
  }
  const items: CartItem[] = (Array.isArray(raw.items) ? raw.items : [])
    .map(record)
    .filter((i) => str(i.name))
    .slice(0, 30)
    .map((i, index) => {
      const notes = str(i.notes, "", 80);
      return {
        id: `ing_${String(index + 1).padStart(2, "0")}`,
        name: str(i.name, "", 60),
        searchQuery: str(i.searchQuery, str(i.name), 80),
        quantity: num(i.quantity, 1, 0, 100000),
        unit: oneOf(i.unit, UNITS, "pcs"),
        category: oneOf(i.category, CATEGORIES, "other"),
        optional: i.optional === true,
        pantryStaple: i.pantryStaple === true,
        substitutes: strList(i.substitutes, 2, 40),
        ...(notes ? { notes } : {}),
        estimatedPriceInr: Math.round(num(i.estimatedPriceInr, 0, 0, 20000)),
      };
    });

  if (!items.length) return fallback("empty ingredient list");
  return {
    ok: true,
    source: "gemini",
    dish: input.dish,
    style: input.style,
    servings: input.servings,
    tip: str(raw.tip, "", 200),
    items,
  };
}

// ── Product selection ────────────────────────────────────────────────────────
// Picks the best real Zepto product per ingredient, matched to the dish style and
// diet. One batched call; minimal payload. Pure fallback: if Gemini isn't set or
// fails, this returns an empty map and the deterministic scorer decides.

/** One candidate product, trimmed to only what the model needs to judge. */
export interface AiSelectOption {
  pid: string;
  name: string;
  pack: string;
  price: number; // INR
  rating?: number | null;
}
export interface AiSelectItem {
  id: string;
  ingredient: string;
  options: AiSelectOption[];
}
export interface AiSelectPick {
  pid: string;
  reason: string;
}
export type AiProductSelector = (
  items: AiSelectItem[],
  context: { style: DishStyleId; diet: Diet },
) => Promise<Map<string, AiSelectPick>>;

const selectSchema = {
  type: "object",
  properties: {
    picks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "The ingredient id from the input." },
          pid: { type: "string", description: "The chosen option's pid (must be one of the given options)." },
          reason: { type: "string", description: "<= 8 words, why this product fits the style/diet." },
        },
        required: ["id", "pid", "reason"],
      },
    },
  },
  required: ["picks"],
};

/** Gemini-backed {@link AiProductSelector}. Reuses the shared client + model fallback. */
export const selectProducts: AiProductSelector = async (items, context) => {
  const out = new Map<string, AiSelectPick>();
  if (!ai || items.length === 0) return out;

  const style = styleById(context.style);
  const prompt = [
    `Pick the single best Zepto product for each ingredient for a "${style.label}" take on the dish.`,
    `What "${style.label}" means: ${style.guidance}`,
    `Diet: ${DIET_RULES[context.diet]}`,
    "Favour products that truly match the style (healthy → low-fat / whole-grain / no additives; high-protein → more protein per pack; restaurant → rich, authentic), a sensible pack size, a good rating and fair price.",
    "Choose strictly from each ingredient's given options, by its pid. Keep each reason to at most 8 words.",
    "Data (prices in INR):",
    JSON.stringify(items),
  ].join("\n");

  try {
    const raw = record(await generateJson([FAST_MODEL, MODEL], prompt, selectSchema, 0.3));
    const picks = Array.isArray(raw.picks) ? raw.picks : [];
    for (const p of picks) {
      const r = record(p);
      const id = str(r.id, "", 24);
      const pid = str(r.pid, "", 64);
      if (id && pid) out.set(id, { pid, reason: str(r.reason, "best fit for this dish", 60) });
    }
    console.info(`[gemini] product selection: chose ${out.size}/${items.length} items`);
  } catch (error) {
    console.error("[gemini] product selection failed; using algo picks:", error instanceof Error ? error.message : error);
  }
  return out;
};
