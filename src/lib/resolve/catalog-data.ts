import type { CatalogEntry } from "./catalog";

/**
 * Seed ingredient taxonomy.
 *
 * Covers the demo dishes (white sauce pasta, paneer tikka masala) plus common
 * Indian-kitchen staples. This is intentionally small and hand-curated; it is
 * the single place to extend ingredient coverage.
 *
 * Conventions:
 * - `canonicalName` is lower-case and generic (no brand).
 * - Conversions map a recipe unit to BASE UNITS: grams for solids, millilitres
 *   for liquids. Values are typical culinary approximations, good enough to pick
 *   a pack size. Only `measured` entries carry conversions.
 */
export const SEED_CATALOG: readonly CatalogEntry[] = [
  // ---- Staples (binary: have-it-or-not) ----
  {
    canonicalName: "salt",
    aliases: ["namak", "table salt", "sea salt"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 720,
  },
  {
    canonicalName: "sugar",
    aliases: ["cheeni", "white sugar"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 720,
  },
  {
    canonicalName: "cooking oil",
    aliases: ["oil", "refined oil", "vegetable oil", "sunflower oil", "olive oil"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 365,
  },
  {
    canonicalName: "ghee",
    aliases: ["clarified butter", "desi ghee"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 365,
  },
  {
    canonicalName: "black pepper",
    aliases: ["kali mirch", "pepper", "black pepper powder"],
    category: "spice",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 540,
  },

  // ---- Spices (binary) ----
  {
    canonicalName: "turmeric powder",
    aliases: ["haldi", "turmeric", "haldi powder"],
    category: "spice",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 540,
  },
  {
    canonicalName: "red chilli powder",
    aliases: ["lal mirch", "chilli powder", "red chili powder"],
    category: "spice",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 540,
  },
  {
    canonicalName: "garam masala",
    aliases: ["garam masala powder"],
    category: "spice",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 540,
  },
  {
    canonicalName: "cumin",
    aliases: ["jeera", "cumin seeds", "cumin powder"],
    category: "spice",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 540,
  },
  {
    canonicalName: "coriander powder",
    aliases: ["dhania powder", "ground coriander"],
    category: "spice",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 540,
  },
  {
    canonicalName: "oregano",
    aliases: ["mixed herbs", "italian herbs"],
    category: "spice",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 540,
  },
  {
    canonicalName: "chilli flakes",
    aliases: ["red chilli flakes", "chili flakes"],
    category: "spice",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 540,
  },

  // ---- Dairy (measured) ----
  {
    canonicalName: "milk",
    aliases: ["doodh", "toned milk", "full cream milk", "skimmed milk"],
    category: "dairy",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 4,
    conversions: { ml: 1, l: 1000, cup: 240, tbsp: 15, tsp: 5 },
  },
  {
    canonicalName: "butter",
    aliases: ["makkhan", "salted butter", "unsalted butter"],
    category: "dairy",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 60,
    conversions: { g: 1, kg: 1000, cup: 227, tbsp: 14, tsp: 5 },
    negativeKeywords: ["spread", "peanut"],
  },
  {
    canonicalName: "paneer",
    aliases: ["cottage cheese", "fresh paneer"],
    category: "dairy",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 7,
    conversions: { g: 1, kg: 1000, cup: 225 },
  },
  {
    canonicalName: "cheese",
    aliases: ["processed cheese", "cheese slices", "cheddar"],
    category: "dairy",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 30,
    conversions: { g: 1, kg: 1000, cup: 100, slice: 20 },
  },
  {
    canonicalName: "mozzarella",
    aliases: ["mozzarella cheese", "pizza cheese"],
    category: "dairy",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 20,
    conversions: { g: 1, kg: 1000, cup: 100 },
  },
  {
    canonicalName: "curd",
    aliases: ["dahi", "yogurt", "yoghurt"],
    category: "dairy",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 7,
    conversions: { g: 1, ml: 1, kg: 1000, cup: 240, tbsp: 15 },
  },
  {
    canonicalName: "fresh cream",
    aliases: ["cream", "malai", "heavy cream"],
    category: "dairy",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 20,
    conversions: { ml: 1, g: 1, cup: 240, tbsp: 15 },
    negativeKeywords: ["milk", "ice"],
  },

  // ---- Grains (measured) ----
  {
    canonicalName: "maida",
    aliases: ["refined flour", "all purpose flour", "plain flour"],
    category: "grain",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 180,
    conversions: { g: 1, kg: 1000, cup: 120, tbsp: 8 },
  },
  {
    canonicalName: "atta",
    aliases: ["whole wheat flour", "wheat flour", "gehu atta"],
    category: "grain",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 120,
    conversions: { g: 1, kg: 1000, cup: 120, tbsp: 8 },
  },
  {
    canonicalName: "rice",
    aliases: ["basmati rice", "chawal", "brown rice"],
    category: "grain",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 365,
    conversions: { g: 1, kg: 1000, cup: 185 },
  },
  {
    canonicalName: "pasta",
    aliases: [
      "penne",
      "penne pasta",
      "macaroni",
      "fusilli",
      "spaghetti",
      "whole wheat pasta",
      "protein pasta",
      "millet pasta",
    ],
    category: "grain",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 365,
    conversions: { g: 1, kg: 1000, cup: 100 },
  },
  {
    canonicalName: "millet",
    aliases: ["bajra", "ragi", "foxtail millet"],
    category: "grain",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 180,
    conversions: { g: 1, kg: 1000, cup: 200 },
  },
  {
    canonicalName: "oats",
    aliases: ["rolled oats", "oatmeal"],
    category: "grain",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 180,
    conversions: { g: 1, kg: 1000, cup: 90 },
  },
  {
    canonicalName: "bread",
    aliases: ["loaf", "sandwich bread", "white bread", "brown bread"],
    category: "grain",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 4,
  },

  // ---- Sauces (measured) ----
  {
    canonicalName: "pasta sauce",
    aliases: ["white sauce", "red sauce", "marinara"],
    category: "sauce",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 180,
    conversions: { g: 1, ml: 1, cup: 240, tbsp: 15 },
  },
  {
    canonicalName: "tomato ketchup",
    aliases: ["ketchup", "tomato sauce"],
    category: "sauce",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 270,
    conversions: { g: 1, ml: 1, tbsp: 15, tsp: 5 },
  },
  {
    canonicalName: "soy sauce",
    aliases: ["soya sauce"],
    category: "sauce",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 365,
    conversions: { ml: 1, tbsp: 15, tsp: 5 },
  },

  // ---- Fresh produce (count) ----
  {
    canonicalName: "onion",
    aliases: ["pyaz", "pyaaz"],
    category: "fresh",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 15,
    negativeKeywords: ["sliced", "sirka", "potato"],
    gramsPerPiece: 100,
  },
  {
    canonicalName: "tomato",
    aliases: ["tamatar", "tomatoes"],
    category: "fresh",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 7,
    negativeKeywords: ["paneer", "sauce", "ketchup", "puree", "sirka"],
    gramsPerPiece: 100,
  },
  {
    canonicalName: "garlic",
    aliases: ["lehsun", "lahsun", "garlic clove", "garlic cloves"],
    category: "fresh",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 30,
  },
  {
    canonicalName: "ginger",
    aliases: ["adrak"],
    category: "fresh",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 21,
  },
  {
    canonicalName: "green chilli",
    aliases: ["hari mirch", "green chili", "green chillies"],
    category: "fresh",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 10,
  },
  {
    canonicalName: "capsicum",
    aliases: ["bell pepper", "shimla mirch"],
    category: "fresh",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 10,
  },
  {
    canonicalName: "coriander leaves",
    aliases: ["hara dhania", "cilantro", "fresh coriander", "dhania patta"],
    category: "fresh",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 5,
  },
  {
    canonicalName: "lemon",
    aliases: ["nimbu", "lime"],
    category: "fresh",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 15,
  },

  // ---- Protein (measured / count) ----
  {
    canonicalName: "egg",
    aliases: ["eggs", "anda"],
    category: "protein",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 21,
  },
  {
    canonicalName: "chicken",
    aliases: ["chicken breast", "boneless chicken", "murga"],
    category: "protein",
    purchaseStrategy: "measured",
    defaultShelfLifeDays: 2,
    conversions: { g: 1, kg: 1000 },
  },

  // ---- Fresh produce (count) ----
  {
    canonicalName: "broccoli",
    aliases: [],
    category: "fresh",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 7,
  },
  {
    canonicalName: "spinach",
    aliases: ["palak"],
    category: "fresh",
    purchaseStrategy: "count",
    defaultShelfLifeDays: 4,
  },

  // ---- Sweeteners & dry goods (binary) ----
  {
    canonicalName: "jaggery",
    aliases: ["gur", "gud"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 365,
  },
  {
    canonicalName: "dates",
    aliases: ["khajoor", "date paste", "dates paste"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 180,
  },
  {
    canonicalName: "almonds",
    aliases: ["badam"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 270,
  },
  {
    canonicalName: "cashews",
    aliases: ["kaju"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 270,
  },
  {
    canonicalName: "pistachios",
    aliases: ["pista"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 270,
  },
  {
    canonicalName: "raisins",
    aliases: ["kishmish"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 270,
  },
  {
    canonicalName: "chia seeds",
    aliases: ["chia"],
    category: "staple",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 365,
  },

  // ---- Spices (binary) ----
  {
    canonicalName: "cardamom",
    aliases: ["elaichi", "elaichi pods", "green cardamom", "cardamom pods"],
    category: "spice",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 540,
  },
  {
    canonicalName: "saffron",
    aliases: ["kesar"],
    category: "spice",
    purchaseStrategy: "binary",
    defaultShelfLifeDays: 540,
  },
];
