import type { CartItem, DishStyleId, IngredientCategory, Unit } from "./contract";
import { POPULAR_DISHES } from "./feed-names";
import type { DishVariant, IngredientsOk, Source, VariantsOk } from "./types";

/**
 * Built-in menu of dishes popular in Indian homes, four styles each.
 * Served when Gemini isn't configured or fails on every model, so the app never dead-ends.
 * Quantities are for 2 servings. Prices are rough Zepto pack prices in INR (hints only).
 *
 * Item rows: name | amount | category | price | flags | note | substitutes
 *   flags: s = pantry staple, o = optional. Substitutes are comma-separated.
 */

interface StyleData {
  title: string;
  tagline: string;
  highlights: string[];
  minutes: number;
  kcal: number;
  protein: number;
  tip: string;
  items: string;
}

interface DishData {
  id: string;
  name: string;
  aliases: string[];
  cuisine: string;
  summary: string;
  veg: boolean;
  styles: Record<DishStyleId, StyleData>;
}

const DATA: DishData[] = [
  {
    id: "white-sauce-pasta",
    name: "White Sauce Pasta",
    aliases: ["white sauce pasta", "alfredo", "alfredo pasta", "creamy pasta", "bechamel pasta", "pasta"],
    cuisine: "Italian · Indian home-style",
    summary: "Pasta folded through a creamy, garlicky béchamel.",
    veg: true,
    styles: {
      restaurant: {
        title: "Parmesan Alfredo Penne",
        tagline: "Silky cream sauce, aged Parmesan, garlic butter and basil.",
        highlights: ["Parmesan", "Fresh cream", "Mushrooms"],
        minutes: 35, kcal: 640, protein: 19,
        tip: "Take the pan off the heat before adding Parmesan so the sauce stays glossy, not grainy.",
        items: `
          Penne pasta | 250 g | pantry | 99 | | | Fusilli
          Fresh cream | 200 ml | dairy | 70
          Parmesan cheese | 40 g | dairy | 299 | | | Processed cheese
          Unsalted butter | 40 g | dairy | 62
          Full cream milk | 250 ml | dairy | 34
          Button mushrooms | 200 g | produce | 59
          Garlic | 1 pcs | produce | 35 | | about 6 cloves
          Fresh basil | 1 bunch | produce | 45 | o
          Extra virgin olive oil | 2 tbsp | pantry | 349
          Red chilli flakes | 1 tsp | spices | 45 | o
          Maida | 1.5 tbsp | pantry | 40 | s
          Black pepper powder | 1 tsp | spices | 65 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Classic White Sauce Pasta",
        tagline: "The weeknight version: milk, butter, flour, done.",
        highlights: ["Milk", "Butter", "Oregano"],
        minutes: 25, kcal: 480, protein: 14,
        tip: "Whisk cold milk into the hot butter-flour roux a splash at a time to avoid lumps.",
        items: `
          Penne pasta | 200 g | pantry | 99 | | | Macaroni
          Toned milk | 400 ml | dairy | 28
          Butter | 30 g | dairy | 62
          Garlic | 1 pcs | produce | 35 | | about 4 cloves
          Oregano | 1 tsp | spices | 55
          Maida | 2 tbsp | pantry | 40 | s
          Black pepper powder | 0.5 tsp | spices | 65 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Whole-Wheat Veggie Penne",
        tagline: "Lighter toned-milk sauce, loaded with broccoli and spinach.",
        highlights: ["Whole-wheat penne", "Broccoli", "Spinach"],
        minutes: 30, kcal: 390, protein: 16,
        tip: "Blanch the broccoli in the pasta water for the last two minutes: one pot, no extra mess.",
        items: `
          Whole wheat penne | 180 g | pantry | 129
          Toned milk | 350 ml | dairy | 28
          Broccoli | 200 g | produce | 65
          Spinach | 1 bunch | produce | 30
          Red bell pepper | 1 pcs | produce | 45
          Garlic | 1 pcs | produce | 35 | | about 4 cloves
          Olive oil | 1 tbsp | pantry | 299
          Oregano | 1 tsp | spices | 55
          Atta | 1.5 tbsp | pantry | 65 | s
          Black pepper powder | 0.5 tsp | spices | 65 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Paneer Protein Alfredo",
        tagline: "Chickpea pasta, seared paneer and a Greek-yogurt finish.",
        highlights: ["Chickpea pasta", "Paneer", "Greek yogurt"],
        minutes: 30, kcal: 540, protein: 38,
        tip: "Stir the Greek yogurt in off the heat; boiling it will split the sauce.",
        items: `
          Chickpea pasta | 200 g | pantry | 199 | | | Whole wheat penne
          Paneer | 200 g | dairy | 95 | | | Firm tofu
          Greek yogurt | 100 g | dairy | 60
          Toned milk | 250 ml | dairy | 28
          Broccoli | 150 g | produce | 65
          Mozzarella cheese | 50 g | dairy | 120 | o
          Butter | 15 g | dairy | 62
          Garlic | 1 pcs | produce | 35 | | about 5 cloves
          Red chilli flakes | 1 tsp | spices | 45
          Oregano | 1 tsp | spices | 55
          Black pepper powder | 0.5 tsp | spices | 65 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "paneer-butter-masala",
    name: "Paneer Butter Masala",
    aliases: ["paneer butter masala", "paneer makhani", "butter paneer", "paneer masala"],
    cuisine: "North Indian · Punjabi",
    summary: "Soft paneer in a buttery tomato-cashew gravy.",
    veg: true,
    styles: {
      restaurant: {
        title: "Paneer Makhani",
        tagline: "Silky tomato-cashew gravy finished with cream and kasuri methi.",
        highlights: ["Paneer", "Cashews", "Fresh cream"],
        minutes: 45, kcal: 560, protein: 21,
        tip: "Blend the gravy and strain it once; that's the restaurant-smooth texture.",
        items: `
          Paneer | 250 g | dairy | 110
          Tomatoes | 500 g | produce | 40
          Onion | 1 pcs | produce | 45 | | medium
          Cashews | 30 g | pantry | 120
          Butter | 40 g | dairy | 62
          Fresh cream | 100 ml | dairy | 70
          Ginger garlic paste | 1 tbsp | pantry | 45
          Kashmiri red chilli powder | 1 tsp | spices | 65
          Kasuri methi | 1 tsp | spices | 35 | o
          Garam masala | 0.5 tsp | spices | 60 | s
          Sugar | 1 tsp | pantry | 50 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Everyday Paneer Masala",
        tagline: "Paneer in a quick onion-tomato gravy, no cream needed.",
        highlights: ["Paneer", "Tomatoes", "Butter"],
        minutes: 30, kcal: 430, protein: 18,
        tip: "Cook the masala until oil separates at the edges before adding paneer.",
        items: `
          Paneer | 200 g | dairy | 95
          Tomatoes | 400 g | produce | 40
          Onion | 1 pcs | produce | 45
          Butter | 25 g | dairy | 62
          Ginger garlic paste | 1 tsp | pantry | 45
          Red chilli powder | 1 tsp | spices | 50 | s
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Light Paneer Tikka Masala",
        tagline: "Low-fat paneer, hung-curd gravy, extra capsicum.",
        highlights: ["Low-fat paneer", "Capsicum", "Curd"],
        minutes: 35, kcal: 340, protein: 24,
        tip: "Whisk the curd with a spoon of the hot gravy first so it doesn't curdle.",
        items: `
          Low fat paneer | 200 g | dairy | 120 | | | Paneer
          Tomatoes | 500 g | produce | 40
          Onion | 1 pcs | produce | 45
          Capsicum | 1 pcs | produce | 30
          Curd | 100 g | dairy | 45 | | hung for 30 minutes
          Ginger garlic paste | 1 tsp | pantry | 45
          Kasuri methi | 1 tsp | spices | 35 | o
          Cooking oil | 2 tsp | pantry | 180 | s
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Double Paneer Makhani",
        tagline: "Twice the paneer and a Greek-yogurt gravy.",
        highlights: ["Paneer", "Greek yogurt", "Cashews"],
        minutes: 40, kcal: 610, protein: 36,
        tip: "Sear the paneer cubes first so they hold their shape in the extra gravy.",
        items: `
          Paneer | 400 g | dairy | 190
          Greek yogurt | 150 g | dairy | 70
          Tomatoes | 500 g | produce | 40
          Onion | 1 pcs | produce | 45
          Cashews | 20 g | pantry | 120
          Butter | 20 g | dairy | 62
          Ginger garlic paste | 1 tbsp | pantry | 45
          Kashmiri red chilli powder | 1 tsp | spices | 65
          Kasuri methi | 1 tsp | spices | 35 | o
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "butter-chicken",
    name: "Butter Chicken",
    aliases: ["butter chicken", "murgh makhani", "chicken makhani", "makhani chicken"],
    cuisine: "North Indian · Punjabi",
    summary: "Tandoori-style chicken in a velvety tomato-butter sauce.",
    veg: false,
    styles: {
      restaurant: {
        title: "Old Delhi Butter Chicken",
        tagline: "Charred marinated chicken, butter-tomato makhani, cream finish.",
        highlights: ["Boneless chicken", "Butter", "Fresh cream"],
        minutes: 60, kcal: 640, protein: 38,
        tip: "Marinate at least an hour and char the chicken under a hot grill before it meets the sauce.",
        items: `
          Boneless chicken | 500 g | meat | 260 | | thigh pieces
          Curd | 100 g | dairy | 45
          Tomatoes | 500 g | produce | 40
          Butter | 50 g | dairy | 62
          Fresh cream | 100 ml | dairy | 70
          Cashews | 25 g | pantry | 120
          Ginger garlic paste | 1 tbsp | pantry | 45
          Kashmiri red chilli powder | 2 tsp | spices | 65
          Kasuri methi | 1 tsp | spices | 35
          Lemon | 1 pcs | produce | 10
          Honey | 1 tsp | pantry | 99 | o | | Sugar
          Garam masala | 1 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Home-style Butter Chicken",
        tagline: "Chicken simmered in tomato, butter and pantry spices.",
        highlights: ["Chicken", "Tomatoes", "Butter"],
        minutes: 40, kcal: 520, protein: 34,
        tip: "Brown the chicken in the butter first, then build the gravy in the same pan.",
        items: `
          Chicken curry cut | 500 g | meat | 180
          Tomatoes | 400 g | produce | 40
          Onion | 1 pcs | produce | 45
          Butter | 30 g | dairy | 62
          Ginger garlic paste | 1 tbsp | pantry | 45
          Red chilli powder | 1 tsp | spices | 50 | s
          Garam masala | 1 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Lighter Butter Chicken",
        tagline: "Grilled breast, yogurt marinade, a spoon of butter instead of a slab.",
        highlights: ["Chicken breast", "Curd", "Tomatoes"],
        minutes: 45, kcal: 390, protein: 42,
        tip: "Don't overcook breast meat; add it back to the sauce for the last five minutes only.",
        items: `
          Chicken breast | 400 g | meat | 240
          Curd | 150 g | dairy | 45
          Tomatoes | 500 g | produce | 40
          Onion | 1 pcs | produce | 45
          Butter | 10 g | dairy | 62
          Ginger garlic paste | 1 tbsp | pantry | 45
          Kashmiri red chilli powder | 1 tsp | spices | 65
          Kasuri methi | 1 tsp | spices | 35 | o
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Protein Butter Chicken",
        tagline: "Extra chicken in a Greek-yogurt makhani.",
        highlights: ["Chicken breast", "Greek yogurt", "Cashews"],
        minutes: 45, kcal: 560, protein: 55,
        tip: "Blend the yogurt with the cashews so the sauce stays creamy without cream.",
        items: `
          Chicken breast | 600 g | meat | 350
          Greek yogurt | 200 g | dairy | 90
          Tomatoes | 500 g | produce | 40
          Butter | 15 g | dairy | 62
          Cashews | 15 g | pantry | 120
          Ginger garlic paste | 1 tbsp | pantry | 45
          Kashmiri red chilli powder | 1 tsp | spices | 65
          Garam masala | 1 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "dal-makhani",
    name: "Dal Makhani",
    aliases: ["dal makhani", "daal makhani", "maa ki dal", "kaali dal"],
    cuisine: "North Indian · Punjabi",
    summary: "Black urad and rajma, slow-cooked with butter and cream.",
    veg: true,
    styles: {
      restaurant: {
        title: "Dhaba Dal Makhani",
        tagline: "Overnight-soaked urad, slow-simmered, butter and cream to finish.",
        highlights: ["Whole urad dal", "Butter", "Fresh cream"],
        minutes: 90, kcal: 480, protein: 17,
        tip: "The longer it simmers the better: give it an hour on low after pressure cooking.",
        items: `
          Whole urad dal | 150 g | pantry | 85 | | soak overnight
          Rajma | 30 g | pantry | 70 | | soak overnight
          Butter | 40 g | dairy | 62
          Fresh cream | 100 ml | dairy | 70
          Tomatoes | 300 g | produce | 40
          Ginger garlic paste | 1 tbsp | pantry | 45
          Kashmiri red chilli powder | 1 tsp | spices | 65
          Kasuri methi | 1 tsp | spices | 35 | o
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Dal Makhani",
        tagline: "Pressure-cooker version with butter, no cream.",
        highlights: ["Whole urad dal", "Tomatoes", "Butter"],
        minutes: 50, kcal: 380, protein: 15,
        tip: "Mash a ladle of dal against the side of the pot to thicken it naturally.",
        items: `
          Whole urad dal | 150 g | pantry | 85 | | soak overnight
          Tomatoes | 250 g | produce | 40
          Onion | 1 pcs | produce | 45
          Butter | 20 g | dairy | 62
          Ginger garlic paste | 1 tsp | pantry | 45
          Red chilli powder | 1 tsp | spices | 50 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Light Dal Makhani",
        tagline: "Toned milk for creaminess, a teaspoon of ghee, lots of fibre.",
        highlights: ["Whole urad dal", "Toned milk", "Ghee"],
        minutes: 60, kcal: 310, protein: 16,
        tip: "Stir in the milk at the end and don't let it boil hard.",
        items: `
          Whole urad dal | 150 g | pantry | 85 | | soak overnight
          Rajma | 30 g | pantry | 70 | | soak overnight
          Tomatoes | 300 g | produce | 40
          Toned milk | 100 ml | dairy | 28
          Ghee | 1 tsp | dairy | 150
          Ginger garlic paste | 1 tsp | pantry | 45
          Kasuri methi | 1 tsp | spices | 35 | o
          Red chilli powder | 1 tsp | spices | 50 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Protein Dal Makhani",
        tagline: "Dal plus paneer cubes and a Greek-yogurt swirl.",
        highlights: ["Whole urad dal", "Paneer", "Greek yogurt"],
        minutes: 60, kcal: 520, protein: 32,
        tip: "Add the paneer in the last five minutes so it stays soft.",
        items: `
          Whole urad dal | 150 g | pantry | 85 | | soak overnight
          Rajma | 50 g | pantry | 70 | | soak overnight
          Paneer | 150 g | dairy | 80
          Greek yogurt | 100 g | dairy | 60
          Tomatoes | 300 g | produce | 40
          Butter | 15 g | dairy | 62
          Ginger garlic paste | 1 tsp | pantry | 45
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "rajma-chawal",
    name: "Rajma Chawal",
    aliases: ["rajma chawal", "rajma", "rajma rice", "kidney bean curry"],
    cuisine: "North Indian home-style",
    summary: "Kidney beans in an onion-tomato gravy with steamed rice.",
    veg: true,
    styles: {
      restaurant: {
        title: "Jammu Rajma Chawal",
        tagline: "Small red rajma, ghee tadka, jeera rice on the side.",
        highlights: ["Rajma", "Ghee", "Basmati rice"],
        minutes: 70, kcal: 560, protein: 20,
        tip: "Simmer the cooked rajma in the masala for 20 minutes; that's where the flavour comes from.",
        items: `
          Rajma | 150 g | pantry | 90 | | soak overnight
          Basmati rice | 150 g | pantry | 140
          Onion | 2 pcs | produce | 45
          Tomatoes | 300 g | produce | 40
          Ghee | 2 tbsp | dairy | 150
          Ginger garlic paste | 1 tbsp | pantry | 45
          Kashmiri red chilli powder | 1 tsp | spices | 65
          Coriander leaves | 1 bunch | produce | 15 | o
          Garam masala | 1 tsp | spices | 60 | s
          Cumin seeds | 1 tsp | spices | 55 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Classic Rajma Chawal",
        tagline: "Sunday-lunch rajma in the pressure cooker, plain rice.",
        highlights: ["Rajma", "Rice", "Onion"],
        minutes: 50, kcal: 480, protein: 17,
        tip: "Pressure-cook soaked rajma for 5 to 6 whistles until it mashes easily.",
        items: `
          Rajma | 150 g | pantry | 90 | | soak overnight
          Rice | 150 g | pantry | 70
          Onion | 1 pcs | produce | 45
          Tomatoes | 250 g | produce | 40
          Ginger garlic paste | 1 tsp | pantry | 45
          Cooking oil | 2 tbsp | pantry | 180 | s
          Red chilli powder | 1 tsp | spices | 50 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Rajma Brown Rice Bowl",
        tagline: "Less oil, brown rice, cucumber-onion salad on top.",
        highlights: ["Rajma", "Brown rice", "Cucumber"],
        minutes: 55, kcal: 430, protein: 19,
        tip: "Soak the brown rice for 30 minutes so it cooks as fast as white.",
        items: `
          Rajma | 150 g | pantry | 90 | | soak overnight
          Brown rice | 150 g | pantry | 120
          Onion | 1 pcs | produce | 45
          Tomatoes | 250 g | produce | 40
          Cucumber | 1 pcs | produce | 20
          Lemon | 1 pcs | produce | 10
          Coriander leaves | 1 bunch | produce | 15
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "High-Protein Rajma Bowl",
        tagline: "Extra rajma, paneer tikka cubes and curd.",
        highlights: ["Rajma", "Paneer", "Curd"],
        minutes: 55, kcal: 620, protein: 38,
        tip: "Pan-sear the paneer with a pinch of chilli for a tikka edge.",
        items: `
          Rajma | 200 g | pantry | 90 | | soak overnight
          Paneer | 200 g | dairy | 95
          Basmati rice | 100 g | pantry | 140
          Curd | 200 g | dairy | 45
          Onion | 1 pcs | produce | 45
          Tomatoes | 250 g | produce | 40
          Ginger garlic paste | 1 tsp | pantry | 45
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "chole",
    name: "Chole",
    aliases: ["chole", "chana masala", "channa masala", "chole masala", "chickpea curry", "pindi chole", "chole bhature"],
    cuisine: "North Indian · Punjabi",
    summary: "Spiced chickpeas in a dark, tangy gravy.",
    veg: true,
    styles: {
      restaurant: {
        title: "Pindi Chole",
        tagline: "Tea-darkened chickpeas, anardana tang, ghee and ginger.",
        highlights: ["Kabuli chana", "Chole masala", "Anardana"],
        minutes: 70, kcal: 520, protein: 19,
        tip: "Boil the chana with a tea bag for the deep brown colour, then discard the bag.",
        items: `
          Kabuli chana | 200 g | pantry | 80 | | soak overnight
          Onion | 2 pcs | produce | 45
          Tomatoes | 300 g | produce | 40
          Chole masala | 2 tbsp | spices | 60
          Anardana powder | 1 tsp | spices | 70 | o | | Amchur
          Tea leaves | 1 tsp | beverages | 120 | | for colour
          Ghee | 2 tbsp | dairy | 150
          Ginger | 50 g | produce | 20
          Green chillies | 4 pcs | produce | 15
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Chana Masala",
        tagline: "Chickpeas, onion, tomato and a spoon of chole masala.",
        highlights: ["Kabuli chana", "Onion", "Chole masala"],
        minutes: 45, kcal: 420, protein: 16,
        tip: "Mash a few chickpeas into the gravy to give it body.",
        items: `
          Kabuli chana | 200 g | pantry | 80 | | soak overnight
          Onion | 1 pcs | produce | 45
          Tomatoes | 250 g | produce | 40
          Chole masala | 1 tbsp | spices | 60
          Ginger garlic paste | 1 tsp | pantry | 45
          Cooking oil | 2 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Chana Masala Salad Bowl",
        tagline: "Less oil, more tomato, onion and cucumber, lemon to finish.",
        highlights: ["Kabuli chana", "Cucumber", "Lemon"],
        minutes: 40, kcal: 360, protein: 18,
        tip: "Toss the warm chana with the raw veg so the masala soaks in.",
        items: `
          Kabuli chana | 200 g | pantry | 80 | | soak overnight
          Tomatoes | 300 g | produce | 40
          Onion | 1 pcs | produce | 45
          Cucumber | 1 pcs | produce | 20
          Lemon | 1 pcs | produce | 10
          Coriander leaves | 1 bunch | produce | 15
          Chole masala | 1 tbsp | spices | 60
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Chana Paneer Masala",
        tagline: "Chickpeas plus paneer in one pot.",
        highlights: ["Kabuli chana", "Paneer", "Curd"],
        minutes: 50, kcal: 590, protein: 35,
        tip: "Whisk the curd smooth and add it off the boil.",
        items: `
          Kabuli chana | 250 g | pantry | 80 | | soak overnight
          Paneer | 200 g | dairy | 95
          Curd | 100 g | dairy | 45
          Onion | 1 pcs | produce | 45
          Tomatoes | 300 g | produce | 40
          Chole masala | 1 tbsp | spices | 60
          Ginger garlic paste | 1 tsp | pantry | 45
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "palak-paneer",
    name: "Palak Paneer",
    aliases: ["palak paneer", "saag paneer", "spinach paneer"],
    cuisine: "North Indian",
    summary: "Paneer in a garlicky spinach purée.",
    veg: true,
    styles: {
      restaurant: {
        title: "Lasooni Palak Paneer",
        tagline: "Bright spinach purée, burnt-garlic tadka, cream swirl.",
        highlights: ["Spinach", "Paneer", "Garlic"],
        minutes: 40, kcal: 460, protein: 22,
        tip: "Blanch spinach for one minute, then ice water: that keeps it bright green.",
        items: `
          Spinach | 2 bunch | produce | 30
          Paneer | 250 g | dairy | 110
          Garlic | 1 pcs | produce | 35 | | about 8 cloves
          Onion | 1 pcs | produce | 45
          Tomatoes | 100 g | produce | 40
          Fresh cream | 50 ml | dairy | 70
          Butter | 20 g | dairy | 62
          Green chillies | 2 pcs | produce | 15
          Kasuri methi | 1 tsp | spices | 35 | o
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Home Palak Paneer",
        tagline: "Blanched spinach, paneer, onion and a little garlic.",
        highlights: ["Spinach", "Paneer", "Onion"],
        minutes: 30, kcal: 380, protein: 19,
        tip: "Don't over-blend; a slightly coarse purée tastes fresher.",
        items: `
          Spinach | 2 bunch | produce | 30
          Paneer | 200 g | dairy | 95
          Onion | 1 pcs | produce | 45
          Garlic | 1 pcs | produce | 35 | | about 4 cloves
          Green chillies | 2 pcs | produce | 15
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Light Palak Paneer",
        tagline: "Low-fat paneer, no cream, extra greens.",
        highlights: ["Spinach", "Low-fat paneer", "Lemon"],
        minutes: 30, kcal: 290, protein: 24,
        tip: "A squeeze of lemon at the end lifts the spinach without any cream.",
        items: `
          Spinach | 3 bunch | produce | 30
          Low fat paneer | 200 g | dairy | 120 | | | Paneer
          Onion | 1 pcs | produce | 45
          Tomatoes | 100 g | produce | 40
          Garlic | 1 pcs | produce | 35
          Green chillies | 2 pcs | produce | 15
          Lemon | 1 pcs | produce | 10 | o
          Cooking oil | 2 tsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Palak Paneer & Tofu",
        tagline: "Paneer and firm tofu in spinach.",
        highlights: ["Paneer", "Firm tofu", "Spinach"],
        minutes: 35, kcal: 480, protein: 38,
        tip: "Press the tofu for 10 minutes so it soaks up the spinach.",
        items: `
          Spinach | 2 bunch | produce | 30
          Paneer | 200 g | dairy | 95
          Firm tofu | 200 g | dairy | 90
          Greek yogurt | 100 g | dairy | 60
          Onion | 1 pcs | produce | 45
          Garlic | 1 pcs | produce | 35
          Green chillies | 2 pcs | produce | 15
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "chicken-biryani",
    name: "Chicken Biryani",
    aliases: ["chicken biryani", "biryani", "biriyani", "briyani", "hyderabadi biryani", "dum biryani", "chicken biriyani"],
    cuisine: "Hyderabadi · Mughlai",
    summary: "Layered basmati and spiced chicken, cooked dum.",
    veg: false,
    styles: {
      restaurant: {
        title: "Hyderabadi Dum Biryani",
        tagline: "Kacchi marinade, saffron milk, fried onions, sealed and slow-cooked.",
        highlights: ["Basmati rice", "Saffron", "Fried onions"],
        minutes: 90, kcal: 720, protein: 36,
        tip: "Cook the rice to 70% before layering; it finishes in the steam.",
        items: `
          Chicken curry cut | 750 g | meat | 270
          Basmati rice | 300 g | pantry | 140
          Curd | 200 g | dairy | 45
          Fried onions | 100 g | pantry | 80
          Biryani masala | 2 tbsp | spices | 75
          Saffron | 1 pack | spices | 250 | o
          Ghee | 3 tbsp | dairy | 150
          Mint leaves | 1 bunch | produce | 15
          Coriander leaves | 1 bunch | produce | 15
          Ginger garlic paste | 2 tbsp | pantry | 45
          Lemon | 1 pcs | produce | 10
          Green chillies | 4 pcs | produce | 15
          Whole garam masala | 1 pack | spices | 90 | | bay leaf, cardamom, cloves, cinnamon
          Salt | 2 tsp | spices | 28 | s`,
      },
      basic: {
        title: "One-Pot Chicken Biryani",
        tagline: "Pressure-cooker biryani with ready biryani masala.",
        highlights: ["Chicken", "Basmati rice", "Biryani masala"],
        minutes: 45, kcal: 600, protein: 32,
        tip: "Use 1.5 cups water per cup of soaked basmati and stop at one whistle.",
        items: `
          Chicken curry cut | 500 g | meat | 180
          Basmati rice | 250 g | pantry | 140
          Onion | 2 pcs | produce | 45
          Tomatoes | 150 g | produce | 40
          Curd | 100 g | dairy | 45
          Biryani masala | 1 tbsp | spices | 75
          Ginger garlic paste | 1 tbsp | pantry | 45
          Cooking oil | 3 tbsp | pantry | 180 | s
          Salt | 2 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Brown Rice Chicken Biryani",
        tagline: "Breast meat, brown basmati, more veg, a teaspoon of ghee.",
        highlights: ["Chicken breast", "Brown basmati rice", "Mint"],
        minutes: 60, kcal: 470, protein: 40,
        tip: "Brown basmati needs a 30-minute soak and a little more water.",
        items: `
          Chicken breast | 400 g | meat | 240
          Brown basmati rice | 200 g | pantry | 160
          Curd | 100 g | dairy | 45
          Onion | 1 pcs | produce | 45
          Carrots | 200 g | produce | 30
          Green peas | 100 g | frozen | 50
          Mint leaves | 1 bunch | produce | 15
          Biryani masala | 1 tbsp | spices | 75
          Ghee | 1 tsp | dairy | 150
          Salt | 2 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Chicken & Egg Biryani",
        tagline: "Extra chicken plus boiled eggs in every layer.",
        highlights: ["Chicken", "Eggs", "Curd"],
        minutes: 60, kcal: 760, protein: 55,
        tip: "Halve the boiled eggs and fry them in the masala so they pick up colour.",
        items: `
          Chicken curry cut | 750 g | meat | 270
          Eggs | 4 pcs | dairy | 54
          Basmati rice | 250 g | pantry | 140
          Curd | 200 g | dairy | 45
          Onion | 2 pcs | produce | 45
          Biryani masala | 2 tbsp | spices | 75
          Mint leaves | 1 bunch | produce | 15
          Ginger garlic paste | 1 tbsp | pantry | 45
          Ghee | 2 tbsp | dairy | 150
          Salt | 2 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "veg-pulao",
    name: "Veg Pulao",
    aliases: ["veg pulao", "pulao", "vegetable pulao", "pulav", "veg pulav", "veg biryani", "vegetable biryani"],
    cuisine: "North Indian",
    summary: "Fragrant basmati with mixed vegetables and whole spices.",
    veg: true,
    styles: {
      restaurant: {
        title: "Navratan Pulao",
        tagline: "Ghee-roasted basmati, paneer, vegetables, nuts and saffron.",
        highlights: ["Basmati rice", "Cashews", "Saffron"],
        minutes: 40, kcal: 520, protein: 11,
        tip: "Fry the whole spices in ghee until they crackle before the rice goes in.",
        items: `
          Basmati rice | 200 g | pantry | 140
          Mixed vegetables | 300 g | frozen | 90 | | carrot, beans, peas
          Paneer | 100 g | dairy | 60
          Cashews | 30 g | pantry | 120
          Raisins | 20 g | pantry | 60 | o
          Ghee | 2 tbsp | dairy | 150
          Whole garam masala | 1 pack | spices | 90
          Saffron | 1 pack | spices | 250 | o
          Onion | 1 pcs | produce | 45
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Veg Pulao",
        tagline: "Rice, peas, carrot and a few whole spices.",
        highlights: ["Rice", "Peas", "Carrots"],
        minutes: 25, kcal: 380, protein: 8,
        tip: "Rinse the rice until the water runs clear for separate grains.",
        items: `
          Basmati rice | 200 g | pantry | 140
          Green peas | 100 g | frozen | 50
          Carrots | 150 g | produce | 30
          Onion | 1 pcs | produce | 45
          Whole garam masala | 1 pack | spices | 90
          Cooking oil | 2 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Brown Rice Veg Pulao",
        tagline: "Brown basmati, double the vegetables, one spoon of oil.",
        highlights: ["Brown basmati rice", "Beans", "Capsicum"],
        minutes: 40, kcal: 330, protein: 9,
        tip: "Let it rest covered for 10 minutes off the heat before fluffing.",
        items: `
          Brown basmati rice | 180 g | pantry | 160
          Beans | 150 g | produce | 40
          Carrots | 150 g | produce | 30
          Green peas | 100 g | frozen | 50
          Capsicum | 1 pcs | produce | 30
          Onion | 1 pcs | produce | 45
          Cooking oil | 1 tbsp | pantry | 180 | s
          Cumin seeds | 1 tsp | spices | 55 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Soya Paneer Pulao",
        tagline: "Soya chunks and paneer stirred through.",
        highlights: ["Soya chunks", "Paneer", "Peas"],
        minutes: 35, kcal: 560, protein: 30,
        tip: "Soak soya chunks in hot water, then squeeze them dry so they don't taste raw.",
        items: `
          Basmati rice | 180 g | pantry | 140
          Soya chunks | 60 g | pantry | 55
          Paneer | 150 g | dairy | 80
          Green peas | 100 g | frozen | 50
          Onion | 1 pcs | produce | 45
          Curd | 100 g | dairy | 45
          Whole garam masala | 1 pack | spices | 90
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "aloo-paratha",
    name: "Aloo Paratha",
    aliases: ["aloo paratha", "alu paratha", "potato paratha", "paratha"],
    cuisine: "Punjabi breakfast",
    summary: "Whole-wheat flatbread stuffed with spiced potato.",
    veg: true,
    styles: {
      restaurant: {
        title: "Amritsari Aloo Paratha",
        tagline: "Flaky, butter-laden parathas with white butter and pickle.",
        highlights: ["Potatoes", "White butter", "Mango pickle"],
        minutes: 45, kcal: 560, protein: 12,
        tip: "Let the filling cool completely so the parathas don't tear when rolled.",
        items: `
          Potatoes | 400 g | produce | 40
          Atta | 250 g | pantry | 65 | s
          White butter | 50 g | dairy | 60
          Green chillies | 3 pcs | produce | 15
          Coriander leaves | 1 bunch | produce | 15
          Ginger | 30 g | produce | 20
          Ajwain | 1 tsp | spices | 45
          Amchur | 1 tsp | spices | 55
          Mango pickle | 1 pack | pantry | 120 | o
          Curd | 200 g | dairy | 45
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Everyday Aloo Paratha",
        tagline: "Potato, atta, green chilli, done.",
        highlights: ["Potatoes", "Atta", "Green chillies"],
        minutes: 35, kcal: 450, protein: 10,
        tip: "Grate the boiled potatoes instead of mashing for a lump-free filling.",
        items: `
          Potatoes | 400 g | produce | 40
          Atta | 250 g | pantry | 65 | s
          Green chillies | 2 pcs | produce | 15
          Coriander leaves | 1 bunch | produce | 15 | o
          Cooking oil | 2 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Multigrain Aloo Methi Paratha",
        tagline: "Multigrain atta, potato plus fenugreek, dry-roasted.",
        highlights: ["Multigrain atta", "Methi", "Potatoes"],
        minutes: 40, kcal: 360, protein: 12,
        tip: "Roast on a hot tawa and brush with ghee only at the end.",
        items: `
          Multigrain atta | 250 g | pantry | 75
          Potatoes | 300 g | produce | 40
          Methi leaves | 1 bunch | produce | 20
          Green chillies | 2 pcs | produce | 15
          Ajwain | 1 tsp | spices | 45
          Curd | 200 g | dairy | 45 | o | low fat
          Ghee | 1 tsp | dairy | 150
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Aloo Paneer Paratha",
        tagline: "Paneer folded into the potato filling, curd on the side.",
        highlights: ["Paneer", "Potatoes", "Curd"],
        minutes: 40, kcal: 590, protein: 30,
        tip: "Squeeze grated paneer dry before mixing so the filling doesn't leak.",
        items: `
          Paneer | 200 g | dairy | 95
          Potatoes | 250 g | produce | 40
          Atta | 250 g | pantry | 65 | s
          Curd | 300 g | dairy | 45
          Green chillies | 2 pcs | produce | 15
          Coriander leaves | 1 bunch | produce | 15
          Ghee | 1 tbsp | dairy | 150
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "masala-dosa",
    name: "Masala Dosa",
    aliases: ["masala dosa", "dosa", "mysore masala dosa", "plain dosa"],
    cuisine: "South Indian",
    summary: "Crisp rice-lentil crêpe with spiced potato filling.",
    veg: true,
    styles: {
      restaurant: {
        title: "Mysore Masala Dosa",
        tagline: "Red chutney-smeared ghee dosa, potato palya, coconut chutney.",
        highlights: ["Dosa batter", "Ghee", "Coconut"],
        minutes: 40, kcal: 520, protein: 11,
        tip: "Sprinkle water on the hot tawa and wipe it before each dosa for a crisp finish.",
        items: `
          Dosa batter | 1 pack | pantry | 90 | | 1 kg
          Potatoes | 400 g | produce | 40
          Onion | 1 pcs | produce | 45
          Ghee | 3 tbsp | dairy | 150
          Fresh coconut | 1 pcs | produce | 50 | | | Desiccated coconut
          Dry red chillies | 6 pcs | spices | 40
          Chana dal | 2 tbsp | pantry | 65
          Curry leaves | 1 bunch | produce | 10
          Green chillies | 2 pcs | produce | 15
          Mustard seeds | 1 tsp | spices | 35 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Home Masala Dosa",
        tagline: "Ready batter, simple potato masala, a spoon of oil.",
        highlights: ["Dosa batter", "Potatoes", "Onion"],
        minutes: 30, kcal: 420, protein: 9,
        tip: "Bring the batter to room temperature before spreading.",
        items: `
          Dosa batter | 1 pack | pantry | 90 | | 1 kg
          Potatoes | 400 g | produce | 40
          Onion | 1 pcs | produce | 45
          Green chillies | 2 pcs | produce | 15
          Curry leaves | 1 bunch | produce | 10
          Mustard seeds | 1 tsp | spices | 35 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Cooking oil | 2 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Ragi Masala Dosa",
        tagline: "Ragi batter, lighter potato and carrot filling.",
        highlights: ["Ragi dosa batter", "Potatoes", "Carrots"],
        minutes: 35, kcal: 340, protein: 10,
        tip: "Ragi dosas cook best a little thicker and on medium heat.",
        items: `
          Ragi dosa batter | 1 pack | pantry | 95
          Potatoes | 250 g | produce | 40
          Carrots | 150 g | produce | 30
          Onion | 1 pcs | produce | 45
          Curry leaves | 1 bunch | produce | 10
          Green chillies | 2 pcs | produce | 15
          Cooking oil | 2 tsp | pantry | 180 | s
          Mustard seeds | 1 tsp | spices | 35 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Paneer Masala Dosa",
        tagline: "Paneer bhurji tucked into the dosa, sambar on the side.",
        highlights: ["Dosa batter", "Paneer", "Toor dal"],
        minutes: 40, kcal: 590, protein: 30,
        tip: "Make the sambar first; it keeps warm while you make the dosas.",
        items: `
          Dosa batter | 1 pack | pantry | 90 | | 1 kg
          Paneer | 200 g | dairy | 95
          Potatoes | 200 g | produce | 40
          Onion | 1 pcs | produce | 45
          Toor dal | 100 g | pantry | 85 | | for sambar
          Sambar masala | 1 tbsp | spices | 55
          Curry leaves | 1 bunch | produce | 10
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "idli-sambar",
    name: "Idli Sambar",
    aliases: ["idli sambar", "idli", "idly", "sambar", "idli sambhar"],
    cuisine: "South Indian",
    summary: "Steamed rice cakes with lentil-vegetable sambar.",
    veg: true,
    styles: {
      restaurant: {
        title: "Ghee Podi Idli & Sambar",
        tagline: "Soft idlis tossed in ghee and gunpowder, drumstick sambar.",
        highlights: ["Idli batter", "Ghee", "Gunpowder podi"],
        minutes: 40, kcal: 460, protein: 15,
        tip: "Steam idlis for exactly 10 to 12 minutes and rest them 2 minutes before unmoulding.",
        items: `
          Idli batter | 1 pack | pantry | 90 | | 1 kg
          Toor dal | 100 g | pantry | 85
          Drumsticks | 2 pcs | produce | 30
          Shallots | 150 g | produce | 40
          Tamarind | 1 tbsp | pantry | 50
          Sambar masala | 1 tbsp | spices | 55
          Gunpowder podi | 2 tbsp | spices | 90
          Ghee | 2 tbsp | dairy | 150
          Curry leaves | 1 bunch | produce | 10
          Mustard seeds | 1 tsp | spices | 35 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Idli Sambar",
        tagline: "Ready-batter idlis with a quick toor dal sambar.",
        highlights: ["Idli batter", "Toor dal", "Tomatoes"],
        minutes: 35, kcal: 380, protein: 13,
        tip: "Grease the idli moulds lightly so the idlis release cleanly.",
        items: `
          Idli batter | 1 pack | pantry | 90 | | 1 kg
          Toor dal | 100 g | pantry | 85
          Tomatoes | 200 g | produce | 40
          Onion | 1 pcs | produce | 45
          Sambar masala | 1 tbsp | spices | 55
          Tamarind | 1 tsp | pantry | 50
          Mustard seeds | 1 tsp | spices | 35 | s
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Millet Idli & Veg Sambar",
        tagline: "Millet batter, extra vegetables in the sambar.",
        highlights: ["Millet idli batter", "Toor dal", "Drumsticks"],
        minutes: 40, kcal: 330, protein: 14,
        tip: "Cut the vegetables the same size so they cook evenly in the sambar.",
        items: `
          Millet idli batter | 1 pack | pantry | 110
          Toor dal | 100 g | pantry | 85
          Carrots | 100 g | produce | 30
          Beans | 100 g | produce | 40
          Drumsticks | 2 pcs | produce | 30
          Tamarind | 1 tsp | pantry | 50
          Sambar masala | 1 tbsp | spices | 55
          Mustard seeds | 1 tsp | spices | 35 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Idli & Double-Dal Sambar",
        tagline: "Toor and moong dal sambar, paneer cubes on the side.",
        highlights: ["Idli batter", "Moong dal", "Paneer"],
        minutes: 40, kcal: 520, protein: 28,
        tip: "Dust the paneer with gunpowder podi and pan-sear for a quick side.",
        items: `
          Idli batter | 1 pack | pantry | 90 | | 1 kg
          Toor dal | 100 g | pantry | 85
          Yellow moong dal | 100 g | pantry | 75
          Paneer | 150 g | dairy | 80
          Tomatoes | 200 g | produce | 40
          Sambar masala | 1 tbsp | spices | 55
          Gunpowder podi | 1 tbsp | spices | 90 | o
          Mustard seeds | 1 tsp | spices | 35 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "pav-bhaji",
    name: "Pav Bhaji",
    aliases: ["pav bhaji", "pao bhaji", "bhaji pav"],
    cuisine: "Mumbai street food",
    summary: "Buttery mashed vegetable curry with toasted pav.",
    veg: true,
    styles: {
      restaurant: {
        title: "Juhu Butter Pav Bhaji",
        tagline: "Butter-loaded bhaji, butter-toasted pav, onion and lemon.",
        highlights: ["Butter", "Pav", "Pav bhaji masala"],
        minutes: 40, kcal: 620, protein: 13,
        tip: "Mash the bhaji right in the pan with a potato masher while it cooks.",
        items: `
          Pav | 1 pack | bakery | 40 | | 8 pieces
          Butter | 100 g | dairy | 62
          Potatoes | 300 g | produce | 40
          Cauliflower | 1 pcs | produce | 40
          Capsicum | 1 pcs | produce | 30
          Green peas | 100 g | frozen | 50
          Tomatoes | 400 g | produce | 40
          Onion | 2 pcs | produce | 45
          Pav bhaji masala | 2 tbsp | spices | 65
          Lemon | 1 pcs | produce | 10
          Coriander leaves | 1 bunch | produce | 15
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Pav Bhaji",
        tagline: "Potato, peas and tomato bhaji, pav from the packet.",
        highlights: ["Potatoes", "Peas", "Pav"],
        minutes: 35, kcal: 520, protein: 11,
        tip: "Pressure-cook the potatoes and peas together to save time.",
        items: `
          Pav | 1 pack | bakery | 40 | | 8 pieces
          Potatoes | 300 g | produce | 40
          Green peas | 100 g | frozen | 50
          Tomatoes | 300 g | produce | 40
          Onion | 1 pcs | produce | 45
          Pav bhaji masala | 1 tbsp | spices | 65
          Butter | 30 g | dairy | 62
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Veggie-Loaded Pav Bhaji",
        tagline: "More cauliflower and capsicum, less potato, whole-wheat pav.",
        highlights: ["Whole-wheat pav", "Cauliflower", "Capsicum"],
        minutes: 40, kcal: 410, protein: 14,
        tip: "Roast the capsicum separately first; it adds smokiness without extra butter.",
        items: `
          Whole wheat pav | 1 pack | bakery | 50
          Cauliflower | 1 pcs | produce | 40
          Capsicum | 2 pcs | produce | 30
          Carrots | 150 g | produce | 30
          Potatoes | 150 g | produce | 40
          Tomatoes | 400 g | produce | 40
          Onion | 1 pcs | produce | 45
          Pav bhaji masala | 1 tbsp | spices | 65
          Butter | 10 g | dairy | 62
          Lemon | 1 pcs | produce | 10
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Paneer Pav Bhaji",
        tagline: "Grated paneer stirred through the bhaji.",
        highlights: ["Paneer", "Pav", "Peas"],
        minutes: 40, kcal: 640, protein: 28,
        tip: "Add grated paneer at the very end so it stays soft.",
        items: `
          Pav | 1 pack | bakery | 40 | | 8 pieces
          Paneer | 200 g | dairy | 95
          Potatoes | 200 g | produce | 40
          Green peas | 150 g | frozen | 50
          Tomatoes | 300 g | produce | 40
          Onion | 1 pcs | produce | 45
          Capsicum | 1 pcs | produce | 30
          Pav bhaji masala | 1 tbsp | spices | 65
          Butter | 25 g | dairy | 62
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "poha",
    name: "Poha",
    aliases: ["poha", "kanda poha", "indori poha", "aloo poha", "pohe"],
    cuisine: "Maharashtrian · Indori breakfast",
    summary: "Flattened rice tempered with mustard, curry leaves and peanuts.",
    veg: true,
    styles: {
      restaurant: {
        title: "Indori Poha",
        tagline: "Steamed poha, jeeravan, sev, pomegranate and lemon.",
        highlights: ["Poha", "Sev", "Pomegranate"],
        minutes: 20, kcal: 380, protein: 8,
        tip: "Rinse the poha in a sieve, don't soak it, then let it rest five minutes.",
        items: `
          Thick poha | 200 g | pantry | 45
          Onion | 1 pcs | produce | 45
          Peanuts | 40 g | pantry | 50
          Green chillies | 2 pcs | produce | 15
          Curry leaves | 1 bunch | produce | 10
          Sev | 1 pack | pantry | 40
          Pomegranate | 1 pcs | produce | 80 | o
          Lemon | 1 pcs | produce | 10
          Coriander leaves | 1 bunch | produce | 15
          Jeeravan masala | 1 tsp | spices | 60 | o
          Mustard seeds | 1 tsp | spices | 35 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Sugar | 1 tsp | pantry | 50 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Kanda Poha",
        tagline: "Poha, onion, peanuts, curry leaves. Ten minutes.",
        highlights: ["Poha", "Onion", "Peanuts"],
        minutes: 15, kcal: 320, protein: 7,
        tip: "Add turmeric and salt to the wet poha before it hits the pan for even colour.",
        items: `
          Thick poha | 200 g | pantry | 45
          Onion | 1 pcs | produce | 45
          Peanuts | 30 g | pantry | 50
          Green chillies | 2 pcs | produce | 15
          Curry leaves | 1 bunch | produce | 10
          Mustard seeds | 1 tsp | spices | 35 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Veggie Poha",
        tagline: "Half the oil, double the veg: peas, carrot, capsicum.",
        highlights: ["Poha", "Peas", "Carrots"],
        minutes: 20, kcal: 270, protein: 8,
        tip: "Sauté the vegetables first, then fold in the poha off high heat.",
        items: `
          Thick poha | 150 g | pantry | 45
          Green peas | 80 g | frozen | 50
          Carrots | 100 g | produce | 30
          Capsicum | 1 pcs | produce | 30
          Onion | 1 pcs | produce | 45
          Lemon | 1 pcs | produce | 10
          Curry leaves | 1 bunch | produce | 10
          Mustard seeds | 1 tsp | spices | 35 | s
          Cooking oil | 2 tsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Protein Poha",
        tagline: "Moong sprouts and paneer crumbles stirred in.",
        highlights: ["Poha", "Moong sprouts", "Paneer"],
        minutes: 20, kcal: 450, protein: 25,
        tip: "Steam the sprouts for three minutes first so they're tender but crunchy.",
        items: `
          Thick poha | 150 g | pantry | 45
          Moong sprouts | 200 g | produce | 40
          Paneer | 150 g | dairy | 80
          Peanuts | 30 g | pantry | 50
          Onion | 1 pcs | produce | 45
          Curry leaves | 1 bunch | produce | 10
          Lemon | 1 pcs | produce | 10
          Mustard seeds | 1 tsp | spices | 35 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "upma",
    name: "Upma",
    aliases: ["upma", "rava upma", "sooji upma", "uppittu"],
    cuisine: "South Indian breakfast",
    summary: "Roasted semolina cooked with a tempering and vegetables.",
    veg: true,
    styles: {
      restaurant: {
        title: "Ghee Rava Upma",
        tagline: "Ghee-roasted rava, cashews, ginger, curry leaves.",
        highlights: ["Rava", "Ghee", "Cashews"],
        minutes: 20, kcal: 420, protein: 9,
        tip: "Roast the rava until it smells nutty, and add it to boiling water while stirring.",
        items: `
          Rava | 150 g | pantry | 40 | | | Sooji
          Ghee | 2 tbsp | dairy | 150
          Cashews | 20 g | pantry | 120
          Onion | 1 pcs | produce | 45
          Ginger | 20 g | produce | 20
          Green chillies | 2 pcs | produce | 15
          Curry leaves | 1 bunch | produce | 10
          Urad dal | 1 tbsp | pantry | 70
          Mustard seeds | 1 tsp | spices | 35 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Rava Upma",
        tagline: "Rava, onion, chilli, mustard seeds.",
        highlights: ["Rava", "Onion", "Curry leaves"],
        minutes: 15, kcal: 330, protein: 7,
        tip: "Use 2.5 cups of water per cup of rava for soft upma.",
        items: `
          Rava | 150 g | pantry | 40
          Onion | 1 pcs | produce | 45
          Green chillies | 2 pcs | produce | 15
          Curry leaves | 1 bunch | produce | 10
          Mustard seeds | 1 tsp | spices | 35 | s
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Vegetable Oats Upma",
        tagline: "Oats and a little rava with carrots, beans and peas.",
        highlights: ["Rolled oats", "Carrots", "Peas"],
        minutes: 20, kcal: 290, protein: 10,
        tip: "Dry-roast the oats for two minutes so they stay separate.",
        items: `
          Rolled oats | 100 g | pantry | 99
          Rava | 50 g | pantry | 40
          Carrots | 100 g | produce | 30
          Beans | 80 g | produce | 40
          Green peas | 60 g | frozen | 50
          Onion | 1 pcs | produce | 45
          Curry leaves | 1 bunch | produce | 10
          Mustard seeds | 1 tsp | spices | 35 | s
          Cooking oil | 2 tsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Paneer Vegetable Upma",
        tagline: "Rava upma with paneer cubes and roasted peanuts.",
        highlights: ["Rava", "Paneer", "Peanuts"],
        minutes: 20, kcal: 480, protein: 24,
        tip: "Fold the paneer in at the end so it doesn't break up.",
        items: `
          Rava | 120 g | pantry | 40
          Paneer | 150 g | dairy | 80
          Peanuts | 30 g | pantry | 50
          Green peas | 80 g | frozen | 50
          Onion | 1 pcs | produce | 45
          Curry leaves | 1 bunch | produce | 10
          Green chillies | 2 pcs | produce | 15
          Mustard seeds | 1 tsp | spices | 35 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "khichdi",
    name: "Khichdi",
    aliases: ["khichdi", "khichri", "dal khichdi", "moong dal khichdi", "masala khichdi"],
    cuisine: "Pan-Indian comfort food",
    summary: "Rice and moong dal cooked soft with ghee and cumin.",
    veg: true,
    styles: {
      restaurant: {
        title: "Masala Khichdi, Ghee Tadka",
        tagline: "Rice, moong and veg with a double tadka of ghee, garlic and chilli.",
        highlights: ["Moong dal", "Ghee", "Garlic"],
        minutes: 35, kcal: 480, protein: 15,
        tip: "Pour the sizzling tadka over the khichdi right before serving.",
        items: `
          Rice | 100 g | pantry | 70
          Yellow moong dal | 100 g | pantry | 75
          Ghee | 3 tbsp | dairy | 150
          Garlic | 1 pcs | produce | 35
          Green peas | 80 g | frozen | 50
          Tomatoes | 100 g | produce | 40
          Onion | 1 pcs | produce | 45
          Dry red chillies | 2 pcs | spices | 40
          Cumin seeds | 1 tsp | spices | 55 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Hing | 1 pinch | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Dal Khichdi",
        tagline: "Rice, moong dal, turmeric, ghee. Comfort in a cooker.",
        highlights: ["Rice", "Moong dal", "Ghee"],
        minutes: 25, kcal: 380, protein: 13,
        tip: "Use 4 cups of water for 1 cup of rice and dal for a soft, spoonable khichdi.",
        items: `
          Rice | 100 g | pantry | 70
          Yellow moong dal | 100 g | pantry | 75
          Ghee | 1 tbsp | dairy | 150
          Cumin seeds | 1 tsp | spices | 55 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Millet Vegetable Khichdi",
        tagline: "Foxtail millet, moong and plenty of vegetables.",
        highlights: ["Foxtail millet", "Moong dal", "Spinach"],
        minutes: 35, kcal: 330, protein: 15,
        tip: "Rinse the millet well and soak it for 20 minutes.",
        items: `
          Foxtail millet | 100 g | pantry | 90
          Yellow moong dal | 100 g | pantry | 75
          Spinach | 1 bunch | produce | 30
          Carrots | 100 g | produce | 30
          Tomatoes | 100 g | produce | 40
          Ghee | 1 tsp | dairy | 150
          Cumin seeds | 1 tsp | spices | 55 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Protein Khichdi",
        tagline: "Extra moong and masoor, paneer on top.",
        highlights: ["Moong dal", "Masoor dal", "Paneer"],
        minutes: 35, kcal: 520, protein: 30,
        tip: "Masoor cooks faster than rice; add it with the rice, not before.",
        items: `
          Rice | 80 g | pantry | 70
          Yellow moong dal | 120 g | pantry | 75
          Masoor dal | 60 g | pantry | 70
          Paneer | 150 g | dairy | 80
          Spinach | 1 bunch | produce | 30
          Ghee | 1 tbsp | dairy | 150
          Cumin seeds | 1 tsp | spices | 55 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "dal-tadka",
    name: "Dal Tadka",
    aliases: ["dal tadka", "dal fry", "yellow dal", "dal chawal", "daal", "dal", "toor dal"],
    cuisine: "North Indian home-style",
    summary: "Yellow dal with a sizzling ghee, cumin and garlic tadka.",
    veg: true,
    styles: {
      restaurant: {
        title: "Dhaba Dal Tadka",
        tagline: "Toor and moong, double tadka with ghee, garlic and red chilli.",
        highlights: ["Toor dal", "Ghee", "Garlic"],
        minutes: 35, kcal: 380, protein: 15,
        tip: "Let the garlic turn golden, not brown, in the tadka.",
        items: `
          Toor dal | 120 g | pantry | 85
          Yellow moong dal | 30 g | pantry | 75
          Ghee | 2 tbsp | dairy | 150
          Garlic | 1 pcs | produce | 35
          Onion | 1 pcs | produce | 45
          Tomatoes | 150 g | produce | 40
          Dry red chillies | 2 pcs | spices | 40
          Coriander leaves | 1 bunch | produce | 15
          Kasuri methi | 1 tsp | spices | 35 | o
          Cumin seeds | 1 tsp | spices | 55 | s
          Hing | 1 pinch | spices | 60 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Everyday Dal Tadka",
        tagline: "Toor dal, jeera-hing tadka, rice on the side.",
        highlights: ["Toor dal", "Rice", "Cumin"],
        minutes: 30, kcal: 420, protein: 14,
        tip: "Whisk the cooked dal before the tadka for a smooth texture.",
        items: `
          Toor dal | 120 g | pantry | 85
          Rice | 150 g | pantry | 70
          Tomatoes | 100 g | produce | 40
          Green chillies | 1 pcs | produce | 15
          Ghee | 1 tbsp | dairy | 150
          Cumin seeds | 1 tsp | spices | 55 | s
          Hing | 1 pinch | spices | 60 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Palak Dal Tadka",
        tagline: "Dal with spinach, a teaspoon of ghee, brown rice.",
        highlights: ["Toor dal", "Spinach", "Brown rice"],
        minutes: 35, kcal: 340, protein: 16,
        tip: "Stir the chopped spinach in for the last two minutes only.",
        items: `
          Toor dal | 120 g | pantry | 85
          Spinach | 1 bunch | produce | 30
          Brown rice | 120 g | pantry | 120
          Tomatoes | 100 g | produce | 40
          Garlic | 1 pcs | produce | 35
          Ghee | 1 tsp | dairy | 150
          Cumin seeds | 1 tsp | spices | 55 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Three-Dal Tadka",
        tagline: "Toor, masoor and chana dal with paneer.",
        highlights: ["Toor dal", "Masoor dal", "Paneer"],
        minutes: 40, kcal: 520, protein: 32,
        tip: "Soak the chana dal for 30 minutes so all three cook together.",
        items: `
          Toor dal | 80 g | pantry | 85
          Masoor dal | 60 g | pantry | 70
          Chana dal | 60 g | pantry | 65
          Paneer | 150 g | dairy | 80
          Tomatoes | 150 g | produce | 40
          Garlic | 1 pcs | produce | 35
          Ghee | 1 tbsp | dairy | 150
          Cumin seeds | 1 tsp | spices | 55 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "egg-curry",
    name: "Egg Curry",
    aliases: ["egg curry", "anda curry", "egg masala", "dim curry", "egg gravy"],
    cuisine: "North Indian · Bengali",
    summary: "Boiled eggs in a spiced onion-tomato gravy.",
    veg: false,
    styles: {
      restaurant: {
        title: "Dhaba Anda Curry",
        tagline: "Fried boiled eggs, rich onion-tomato masala, mustard-oil tadka.",
        highlights: ["Eggs", "Mustard oil", "Kasuri methi"],
        minutes: 35, kcal: 480, protein: 20,
        tip: "Prick the boiled eggs and fry them with turmeric so the masala gets in.",
        items: `
          Eggs | 6 pcs | dairy | 54
          Onion | 2 pcs | produce | 45
          Tomatoes | 300 g | produce | 40
          Ginger garlic paste | 1 tbsp | pantry | 45
          Mustard oil | 2 tbsp | pantry | 100
          Kashmiri red chilli powder | 1 tsp | spices | 65
          Kasuri methi | 1 tsp | spices | 35 | o
          Coriander leaves | 1 bunch | produce | 15
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Egg Curry",
        tagline: "Eggs, onion, tomato, everyday masala.",
        highlights: ["Eggs", "Onion", "Tomatoes"],
        minutes: 25, kcal: 380, protein: 18,
        tip: "Ten minutes of boiling and an ice bath gives eggs that peel cleanly.",
        items: `
          Eggs | 4 pcs | dairy | 54
          Onion | 1 pcs | produce | 45
          Tomatoes | 250 g | produce | 40
          Ginger garlic paste | 1 tsp | pantry | 45
          Red chilli powder | 1 tsp | spices | 50 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Egg & Spinach Curry",
        tagline: "More whites, spinach in the gravy, little oil.",
        highlights: ["Eggs", "Spinach", "Tomatoes"],
        minutes: 30, kcal: 300, protein: 24,
        tip: "Use two whole eggs and the whites of four more.",
        items: `
          Eggs | 6 pcs | dairy | 54 | | 2 whole, 4 whites
          Spinach | 1 bunch | produce | 30
          Tomatoes | 300 g | produce | 40
          Onion | 1 pcs | produce | 45
          Ginger garlic paste | 1 tsp | pantry | 45
          Curd | 100 g | dairy | 45 | o
          Cooking oil | 2 tsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Double Egg Curry",
        tagline: "Eight eggs and a Greek-yogurt gravy.",
        highlights: ["Eggs", "Greek yogurt", "Onion"],
        minutes: 30, kcal: 520, protein: 40,
        tip: "Halve the eggs before they go in so the gravy coats the yolks.",
        items: `
          Eggs | 8 pcs | dairy | 54
          Greek yogurt | 150 g | dairy | 70
          Onion | 2 pcs | produce | 45
          Tomatoes | 250 g | produce | 40
          Ginger garlic paste | 1 tbsp | pantry | 45
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "chicken-curry",
    name: "Chicken Curry",
    aliases: ["chicken curry", "chicken masala", "murgh curry", "chicken gravy", "home style chicken"],
    cuisine: "North Indian home-style",
    summary: "Bone-in chicken simmered in onion-tomato masala.",
    veg: false,
    styles: {
      restaurant: {
        title: "Punjabi Chicken Curry",
        tagline: "Bhuna masala, whole spices, ghee and fresh coriander.",
        highlights: ["Chicken", "Ghee", "Whole spices"],
        minutes: 50, kcal: 560, protein: 38,
        tip: "Brown the onions deeply; that's the base of a dark, rich curry.",
        items: `
          Chicken curry cut | 750 g | meat | 270
          Onion | 3 pcs | produce | 45
          Tomatoes | 300 g | produce | 40
          Curd | 100 g | dairy | 45
          Ginger garlic paste | 2 tbsp | pantry | 45
          Whole garam masala | 1 pack | spices | 90
          Ghee | 2 tbsp | dairy | 150
          Kashmiri red chilli powder | 1 tsp | spices | 65
          Coriander leaves | 1 bunch | produce | 15
          Garam masala | 1 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Home Chicken Curry",
        tagline: "Chicken, onion, tomato, everyday masala.",
        highlights: ["Chicken", "Onion", "Tomatoes"],
        minutes: 40, kcal: 460, protein: 34,
        tip: "Cook covered on low after adding the chicken; it releases its own water.",
        items: `
          Chicken curry cut | 500 g | meat | 180
          Onion | 2 pcs | produce | 45
          Tomatoes | 250 g | produce | 40
          Ginger garlic paste | 1 tbsp | pantry | 45
          Red chilli powder | 1 tsp | spices | 50 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Garam masala | 1 tsp | spices | 60 | s
          Cooking oil | 2 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Lean Chicken Curry",
        tagline: "Skinless breast, curd gravy, a teaspoon of oil.",
        highlights: ["Chicken breast", "Curd", "Tomatoes"],
        minutes: 35, kcal: 340, protein: 42,
        tip: "Marinate the breast in curd for 20 minutes to keep it juicy.",
        items: `
          Chicken breast | 400 g | meat | 240
          Curd | 150 g | dairy | 45
          Tomatoes | 250 g | produce | 40
          Onion | 1 pcs | produce | 45
          Ginger garlic paste | 1 tbsp | pantry | 45
          Coriander leaves | 1 bunch | produce | 15
          Cooking oil | 1 tsp | pantry | 180 | s
          Garam masala | 0.5 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "High-Protein Chicken Curry",
        tagline: "More chicken in a Greek-yogurt gravy.",
        highlights: ["Chicken breast", "Greek yogurt", "Onion"],
        minutes: 40, kcal: 520, protein: 60,
        tip: "Temper the yogurt with hot gravy before stirring it in.",
        items: `
          Chicken breast | 700 g | meat | 400
          Greek yogurt | 200 g | dairy | 90
          Onion | 2 pcs | produce | 45
          Tomatoes | 250 g | produce | 40
          Ginger garlic paste | 1 tbsp | pantry | 45
          Garam masala | 1 tsp | spices | 60 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "fish-curry",
    name: "Fish Curry",
    aliases: ["fish curry", "goan fish curry", "machher jhol", "fish masala", "meen curry"],
    cuisine: "Coastal · Goan",
    summary: "Fish in a tangy, spiced gravy.",
    veg: false,
    styles: {
      restaurant: {
        title: "Goan Fish Curry",
        tagline: "Kingfish in coconut milk, kokum and Kashmiri chilli.",
        highlights: ["Kingfish", "Coconut milk", "Kokum"],
        minutes: 40, kcal: 480, protein: 32,
        tip: "Slide the fish in at the end and simmer gently; don't stir or it breaks.",
        items: `
          Kingfish | 500 g | meat | 550 | | surmai steaks
          Coconut milk | 200 ml | pantry | 90
          Kokum | 6 pcs | pantry | 60 | | | Tamarind
          Onion | 1 pcs | produce | 45
          Tomatoes | 150 g | produce | 40
          Kashmiri dry red chillies | 6 pcs | spices | 60
          Ginger garlic paste | 1 tbsp | pantry | 45
          Coconut oil | 2 tbsp | pantry | 120
          Curry leaves | 1 bunch | produce | 10 | o
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Fish Curry",
        tagline: "Rohu in a mustard-oil onion-tomato gravy.",
        highlights: ["Rohu", "Onion", "Tomatoes"],
        minutes: 30, kcal: 380, protein: 30,
        tip: "Rub the fish with salt and turmeric and fry lightly before it goes in the gravy.",
        items: `
          Rohu fish | 500 g | meat | 220
          Onion | 1 pcs | produce | 45
          Tomatoes | 250 g | produce | 40
          Ginger garlic paste | 1 tsp | pantry | 45
          Mustard oil | 2 tbsp | pantry | 100
          Red chilli powder | 1 tsp | spices | 50 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Light Tomato Fish Curry",
        tagline: "Basa in a tomato-tamarind gravy with very little oil.",
        highlights: ["Basa fillet", "Tamarind", "Tomatoes"],
        minutes: 25, kcal: 290, protein: 34,
        tip: "Basa cooks in four minutes; add it last.",
        items: `
          Basa fillet | 400 g | meat | 280
          Tomatoes | 250 g | produce | 40
          Onion | 1 pcs | produce | 45
          Tamarind | 1 tsp | pantry | 50
          Curry leaves | 1 bunch | produce | 10
          Cooking oil | 1 tsp | pantry | 180 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Fish & Prawn Curry",
        tagline: "Fish plus prawns in a coconut gravy.",
        highlights: ["Basa fillet", "Prawns", "Coconut milk"],
        minutes: 35, kcal: 460, protein: 50,
        tip: "Prawns are done the moment they curl into a C; pull the pan off.",
        items: `
          Basa fillet | 400 g | meat | 280
          Prawns | 250 g | meat | 320 | | cleaned
          Coconut milk | 150 ml | pantry | 90
          Onion | 1 pcs | produce | 45
          Tomatoes | 200 g | produce | 40
          Ginger garlic paste | 1 tbsp | pantry | 45
          Kashmiri red chilli powder | 1 tsp | spices | 65
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "hakka-noodles",
    name: "Hakka Noodles",
    aliases: ["hakka noodles", "veg noodles", "chowmein", "chow mein", "noodles", "veg hakka noodles"],
    cuisine: "Indo-Chinese",
    summary: "Wok-tossed noodles with crunchy vegetables and soy.",
    veg: true,
    styles: {
      restaurant: {
        title: "Street-Style Hakka Noodles",
        tagline: "High-heat wok noodles, garlic, spring onion, chilli sauce.",
        highlights: ["Hakka noodles", "Spring onion", "Chilli sauce"],
        minutes: 25, kcal: 480, protein: 11,
        tip: "Boil the noodles al dente, rinse in cold water and toss with a little oil.",
        items: `
          Hakka noodles | 1 pack | pantry | 45
          Cabbage | 250 g | produce | 30
          Capsicum | 1 pcs | produce | 30
          Carrots | 100 g | produce | 30
          Spring onion | 1 bunch | produce | 20
          Garlic | 1 pcs | produce | 35
          Soy sauce | 2 tbsp | pantry | 70
          Green chilli sauce | 1 tbsp | pantry | 70
          Vinegar | 1 tbsp | pantry | 40
          Cooking oil | 2 tbsp | pantry | 180 | s
          Black pepper powder | 0.5 tsp | spices | 65 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Veg Noodles",
        tagline: "Noodles, cabbage, carrot, soy sauce.",
        highlights: ["Hakka noodles", "Cabbage", "Soy sauce"],
        minutes: 20, kcal: 400, protein: 9,
        tip: "Keep the heat high and the vegetables moving so they stay crunchy.",
        items: `
          Hakka noodles | 1 pack | pantry | 45
          Cabbage | 200 g | produce | 30
          Carrots | 100 g | produce | 30
          Onion | 1 pcs | produce | 45
          Soy sauce | 1 tbsp | pantry | 70
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Whole Wheat Veg Noodles",
        tagline: "Whole-wheat noodles, double the veg, light on oil.",
        highlights: ["Whole wheat noodles", "Broccoli", "Capsicum"],
        minutes: 25, kcal: 340, protein: 12,
        tip: "Steam the broccoli for two minutes before it hits the wok.",
        items: `
          Whole wheat noodles | 1 pack | pantry | 75
          Broccoli | 200 g | produce | 65
          Capsicum | 1 pcs | produce | 30
          Carrots | 100 g | produce | 30
          Cabbage | 150 g | produce | 30
          Garlic | 1 pcs | produce | 35
          Soy sauce | 1 tbsp | pantry | 70
          Cooking oil | 2 tsp | pantry | 180 | s
          Black pepper powder | 0.5 tsp | spices | 65 | s`,
      },
      protein: {
        title: "Tofu Hakka Noodles",
        tagline: "Crispy tofu and soya chunks tossed through.",
        highlights: ["Firm tofu", "Soya chunks", "Spring onion"],
        minutes: 25, kcal: 520, protein: 30,
        tip: "Pat the tofu dry and sear it alone first for crisp edges.",
        items: `
          Hakka noodles | 1 pack | pantry | 45
          Firm tofu | 250 g | dairy | 110
          Soya chunks | 40 g | pantry | 55
          Cabbage | 150 g | produce | 30
          Capsicum | 1 pcs | produce | 30
          Spring onion | 1 bunch | produce | 20
          Soy sauce | 2 tbsp | pantry | 70
          Garlic | 1 pcs | produce | 35
          Cooking oil | 1 tbsp | pantry | 180 | s`,
      },
    },
  },
  {
    id: "veg-fried-rice",
    name: "Veg Fried Rice",
    aliases: ["veg fried rice", "fried rice", "vegetable fried rice", "schezwan fried rice"],
    cuisine: "Indo-Chinese",
    summary: "Day-old rice stir-fried with vegetables and soy.",
    veg: true,
    styles: {
      restaurant: {
        title: "Burnt Garlic Fried Rice",
        tagline: "Crisp burnt garlic, spring onion, white pepper.",
        highlights: ["Basmati rice", "Garlic", "Spring onion"],
        minutes: 25, kcal: 460, protein: 9,
        tip: "Use rice cooked a day ahead and chilled; fresh rice goes mushy.",
        items: `
          Basmati rice | 200 g | pantry | 140 | | cooked and cooled
          Garlic | 2 pcs | produce | 35
          Spring onion | 1 bunch | produce | 20
          Carrots | 100 g | produce | 30
          Beans | 100 g | produce | 40
          Capsicum | 1 pcs | produce | 30
          Soy sauce | 1 tbsp | pantry | 70
          White pepper powder | 1 tsp | spices | 60 | | | Black pepper
          Cooking oil | 2 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Veg Fried Rice",
        tagline: "Leftover rice, carrot, beans, soy sauce.",
        highlights: ["Rice", "Carrots", "Soy sauce"],
        minutes: 15, kcal: 380, protein: 7,
        tip: "Spread the rice out in the pan and let it sit a minute before tossing.",
        items: `
          Basmati rice | 200 g | pantry | 140 | | cooked and cooled
          Carrots | 100 g | produce | 30
          Beans | 80 g | produce | 40
          Onion | 1 pcs | produce | 45
          Soy sauce | 1 tbsp | pantry | 70
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Cauliflower Brown Rice Fried Rice",
        tagline: "Half brown rice, half riced cauliflower, loaded with veg.",
        highlights: ["Brown rice", "Cauliflower", "Broccoli"],
        minutes: 25, kcal: 280, protein: 10,
        tip: "Pulse the cauliflower to rice-sized bits and squeeze out the moisture.",
        items: `
          Brown rice | 120 g | pantry | 120
          Cauliflower | 1 pcs | produce | 40
          Broccoli | 150 g | produce | 65
          Carrots | 100 g | produce | 30
          Spring onion | 1 bunch | produce | 20
          Garlic | 1 pcs | produce | 35
          Soy sauce | 1 tbsp | pantry | 70
          Cooking oil | 2 tsp | pantry | 180 | s
          Black pepper powder | 0.5 tsp | spices | 65 | s`,
      },
      protein: {
        title: "Paneer Edamame Fried Rice",
        tagline: "Seared paneer and edamame through every bite.",
        highlights: ["Paneer", "Edamame", "Basmati rice"],
        minutes: 25, kcal: 560, protein: 30,
        tip: "Thaw the edamame in hot water for a minute before tossing.",
        items: `
          Basmati rice | 180 g | pantry | 140 | | cooked and cooled
          Paneer | 200 g | dairy | 95
          Edamame | 150 g | frozen | 150
          Carrots | 100 g | produce | 30
          Spring onion | 1 bunch | produce | 20
          Soy sauce | 1 tbsp | pantry | 70
          Garlic | 1 pcs | produce | 35
          Cooking oil | 1 tbsp | pantry | 180 | s`,
      },
    },
  },
  {
    id: "chilli-paneer",
    name: "Chilli Paneer",
    aliases: ["chilli paneer", "chili paneer", "paneer chilli", "chilli paneer dry", "chilli paneer gravy"],
    cuisine: "Indo-Chinese",
    summary: "Crisp paneer tossed in a spicy, glossy soy-chilli sauce.",
    veg: true,
    styles: {
      restaurant: {
        title: "Restaurant Chilli Paneer",
        tagline: "Batter-fried paneer, peppers, chilli-soy glaze.",
        highlights: ["Paneer", "Capsicum", "Chilli sauce"],
        minutes: 30, kcal: 520, protein: 22,
        tip: "Fry the paneer in hot oil for under a minute; any longer and it turns rubbery.",
        items: `
          Paneer | 250 g | dairy | 110
          Capsicum | 2 pcs | produce | 30
          Onion | 1 pcs | produce | 45
          Spring onion | 1 bunch | produce | 20
          Garlic | 1 pcs | produce | 35
          Cornflour | 2 tbsp | pantry | 40
          Maida | 1 tbsp | pantry | 40 | s
          Soy sauce | 1 tbsp | pantry | 70
          Red chilli sauce | 1 tbsp | pantry | 70
          Vinegar | 1 tsp | pantry | 40
          Cooking oil | 4 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Chilli Paneer",
        tagline: "Pan-seared paneer, onion, capsicum, soy and chilli sauce.",
        highlights: ["Paneer", "Capsicum", "Soy sauce"],
        minutes: 20, kcal: 430, protein: 20,
        tip: "Dust the paneer in cornflour before searing for a light crust.",
        items: `
          Paneer | 200 g | dairy | 95
          Capsicum | 1 pcs | produce | 30
          Onion | 1 pcs | produce | 45
          Soy sauce | 1 tbsp | pantry | 70
          Red chilli sauce | 1 tbsp | pantry | 70
          Cornflour | 1 tbsp | pantry | 40
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Air-Fried Chilli Paneer",
        tagline: "Low-fat paneer, no batter, more peppers.",
        highlights: ["Low-fat paneer", "Bell peppers", "Spring onion"],
        minutes: 25, kcal: 320, protein: 25,
        tip: "Air-fry the paneer at 200°C for 8 minutes, then toss in the sauce.",
        items: `
          Low fat paneer | 200 g | dairy | 120 | | | Paneer
          Red bell pepper | 1 pcs | produce | 45
          Capsicum | 1 pcs | produce | 30
          Onion | 1 pcs | produce | 45
          Spring onion | 1 bunch | produce | 20
          Garlic | 1 pcs | produce | 35
          Soy sauce | 1 tbsp | pantry | 70
          Vinegar | 1 tsp | pantry | 40
          Cooking oil | 1 tsp | pantry | 180 | s`,
      },
      protein: {
        title: "Chilli Paneer & Tofu",
        tagline: "Paneer and tofu together in the chilli glaze.",
        highlights: ["Paneer", "Firm tofu", "Capsicum"],
        minutes: 25, kcal: 560, protein: 40,
        tip: "Sear tofu and paneer separately; they brown at different speeds.",
        items: `
          Paneer | 250 g | dairy | 110
          Firm tofu | 200 g | dairy | 90
          Capsicum | 2 pcs | produce | 30
          Onion | 1 pcs | produce | 45
          Spring onion | 1 bunch | produce | 20
          Soy sauce | 1 tbsp | pantry | 70
          Red chilli sauce | 1 tbsp | pantry | 70
          Cornflour | 1 tbsp | pantry | 40
          Cooking oil | 1 tbsp | pantry | 180 | s`,
      },
    },
  },
  {
    id: "red-sauce-pasta",
    name: "Red Sauce Pasta",
    aliases: ["red sauce pasta", "arrabbiata", "penne arrabbiata", "tomato pasta", "marinara pasta"],
    cuisine: "Italian · Indian home-style",
    summary: "Penne in a garlicky tomato sauce with chilli and herbs.",
    veg: true,
    styles: {
      restaurant: {
        title: "Penne Arrabbiata",
        tagline: "Peeled tomatoes, olive oil, garlic, chilli and basil.",
        highlights: ["Peeled tomatoes", "Olive oil", "Basil"],
        minutes: 30, kcal: 520, protein: 15,
        tip: "Finish the pasta in the sauce with a splash of pasta water for a glossy coat.",
        items: `
          Penne pasta | 250 g | pantry | 99
          Peeled tomatoes | 1 pack | pantry | 180 | | 400 g tin | Tomatoes
          Extra virgin olive oil | 3 tbsp | pantry | 349
          Garlic | 1 pcs | produce | 35
          Red chilli flakes | 1 tsp | spices | 45
          Fresh basil | 1 bunch | produce | 45 | o
          Parmesan cheese | 30 g | dairy | 299 | o
          Black olives | 50 g | pantry | 150 | o
          Oregano | 1 tsp | spices | 55
          Sugar | 0.5 tsp | pantry | 50 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Classic Red Sauce Pasta",
        tagline: "Tomato, onion, garlic, oregano, ready in 20.",
        highlights: ["Penne pasta", "Tomatoes", "Oregano"],
        minutes: 20, kcal: 420, protein: 12,
        tip: "Grate the tomatoes instead of chopping for a smooth sauce without a blender.",
        items: `
          Penne pasta | 200 g | pantry | 99
          Tomatoes | 400 g | produce | 40
          Onion | 1 pcs | produce | 45
          Garlic | 1 pcs | produce | 35
          Oregano | 1 tsp | spices | 55
          Red chilli flakes | 1 tsp | spices | 45
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Whole-Wheat Veggie Arrabbiata",
        tagline: "Whole-wheat penne, zucchini, peppers and mushrooms.",
        highlights: ["Whole-wheat penne", "Zucchini", "Mushrooms"],
        minutes: 30, kcal: 380, protein: 15,
        tip: "Brown the mushrooms in a dry pan first so they don't go watery.",
        items: `
          Whole wheat penne | 180 g | pantry | 129
          Tomatoes | 400 g | produce | 40
          Zucchini | 1 pcs | produce | 50
          Red bell pepper | 1 pcs | produce | 45
          Button mushrooms | 200 g | produce | 59
          Garlic | 1 pcs | produce | 35
          Olive oil | 1 tbsp | pantry | 299
          Oregano | 1 tsp | spices | 55
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Chickpea Pasta Arrabbiata",
        tagline: "Chickpea penne and grilled paneer in spicy tomato.",
        highlights: ["Chickpea pasta", "Paneer", "Tomatoes"],
        minutes: 30, kcal: 560, protein: 38,
        tip: "Chickpea pasta overcooks fast; drain it a minute early.",
        items: `
          Chickpea pasta | 200 g | pantry | 199
          Paneer | 150 g | dairy | 80
          Tomatoes | 400 g | produce | 40
          Garlic | 1 pcs | produce | 35
          Red chilli flakes | 1 tsp | spices | 45
          Olive oil | 1 tbsp | pantry | 299
          Fresh basil | 1 bunch | produce | 45 | o
          Mozzarella cheese | 50 g | dairy | 120 | o
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "masala-omelette",
    name: "Masala Omelette",
    aliases: ["masala omelette", "omelette", "omelet", "egg omelette", "masala omelet", "anda omelette"],
    cuisine: "Indian breakfast",
    summary: "Fluffy eggs with onion, tomato, chilli and coriander.",
    veg: false,
    styles: {
      restaurant: {
        title: "Bombay Cheese Masala Omelette",
        tagline: "Butter-cooked, loaded with onion, chilli and cheese, with pav.",
        highlights: ["Eggs", "Cheese", "Pav"],
        minutes: 15, kcal: 520, protein: 26,
        tip: "Beat the eggs until frothy and cook on medium so the inside stays soft.",
        items: `
          Eggs | 4 pcs | dairy | 54
          Butter | 20 g | dairy | 62
          Cheese slices | 2 pcs | dairy | 120
          Onion | 1 pcs | produce | 45
          Tomatoes | 100 g | produce | 40
          Green chillies | 2 pcs | produce | 15
          Coriander leaves | 1 bunch | produce | 15
          Pav | 1 pack | bakery | 40 | o
          Black pepper powder | 0.5 tsp | spices | 65 | s
          Salt | 0.5 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Masala Omelette",
        tagline: "Eggs, onion, chilli, a pinch of turmeric.",
        highlights: ["Eggs", "Onion", "Green chillies"],
        minutes: 10, kcal: 300, protein: 18,
        tip: "Chop the onion fine so it cooks through in the time the eggs set.",
        items: `
          Eggs | 4 pcs | dairy | 54
          Onion | 1 pcs | produce | 45
          Green chillies | 2 pcs | produce | 15
          Coriander leaves | 1 bunch | produce | 15 | o
          Cooking oil | 1 tbsp | pantry | 180 | s
          Turmeric | 1 pinch | spices | 40 | s
          Salt | 0.5 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Spinach Egg-White Omelette",
        tagline: "Mostly whites, spinach and tomato, a teaspoon of oil.",
        highlights: ["Eggs", "Spinach", "Tomatoes"],
        minutes: 10, kcal: 210, protein: 24,
        tip: "Wilt the spinach in the pan first, then pour the eggs over it.",
        items: `
          Eggs | 6 pcs | dairy | 54 | | 4 whites, 2 whole
          Spinach | 1 bunch | produce | 30
          Tomatoes | 100 g | produce | 40
          Onion | 1 pcs | produce | 45
          Green chillies | 1 pcs | produce | 15
          Cooking oil | 1 tsp | pantry | 180 | s
          Black pepper powder | 0.5 tsp | spices | 65 | s
          Salt | 0.5 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Paneer Masala Omelette",
        tagline: "Six eggs plus paneer crumbles.",
        highlights: ["Eggs", "Paneer", "Onion"],
        minutes: 15, kcal: 480, protein: 38,
        tip: "Crumble the paneer straight into the beaten eggs.",
        items: `
          Eggs | 6 pcs | dairy | 54
          Paneer | 100 g | dairy | 60
          Onion | 1 pcs | produce | 45
          Tomatoes | 100 g | produce | 40
          Green chillies | 2 pcs | produce | 15
          Coriander leaves | 1 bunch | produce | 15
          Cooking oil | 1 tbsp | pantry | 180 | s
          Salt | 0.5 tsp | spices | 28 | s`,
      },
    },
  },
  {
    id: "aloo-gobi",
    name: "Aloo Gobi",
    aliases: ["aloo gobi", "alu gobi", "gobi aloo", "aloo gobhi", "potato cauliflower"],
    cuisine: "North Indian home-style",
    summary: "Dry-cooked potatoes and cauliflower with cumin and turmeric.",
    veg: true,
    styles: {
      restaurant: {
        title: "Dhaba Aloo Gobi",
        tagline: "Pan-roasted florets, ginger, kasuri methi, ghee finish.",
        highlights: ["Cauliflower", "Potatoes", "Ghee"],
        minutes: 35, kcal: 340, protein: 7,
        tip: "Cook uncovered on medium-high so the florets roast instead of steam.",
        items: `
          Cauliflower | 1 pcs | produce | 40
          Potatoes | 300 g | produce | 40
          Onion | 1 pcs | produce | 45
          Tomatoes | 150 g | produce | 40
          Ginger | 30 g | produce | 20
          Green chillies | 2 pcs | produce | 15
          Ghee | 2 tbsp | dairy | 150
          Kasuri methi | 1 tsp | spices | 35 | o
          Coriander leaves | 1 bunch | produce | 15
          Garam masala | 0.5 tsp | spices | 60 | s
          Cumin seeds | 1 tsp | spices | 55 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      basic: {
        title: "Simple Aloo Gobi",
        tagline: "Potato, cauliflower, cumin, turmeric.",
        highlights: ["Cauliflower", "Potatoes", "Cumin"],
        minutes: 25, kcal: 280, protein: 6,
        tip: "Cut potatoes smaller than the florets so they finish together.",
        items: `
          Cauliflower | 1 pcs | produce | 40
          Potatoes | 250 g | produce | 40
          Green chillies | 2 pcs | produce | 15
          Cooking oil | 2 tbsp | pantry | 180 | s
          Cumin seeds | 1 tsp | spices | 55 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      healthy: {
        title: "Roasted Gobi & Sweet Potato",
        tagline: "Oven-roasted cauliflower with sweet potato instead of aloo.",
        highlights: ["Cauliflower", "Sweet potato", "Lemon"],
        minutes: 35, kcal: 230, protein: 7,
        tip: "Roast at 220°C on a single layer; crowding makes it soggy.",
        items: `
          Cauliflower | 1 pcs | produce | 40
          Sweet potato | 250 g | produce | 50
          Onion | 1 pcs | produce | 45
          Lemon | 1 pcs | produce | 10
          Coriander leaves | 1 bunch | produce | 15
          Cooking oil | 2 tsp | pantry | 180 | s
          Cumin seeds | 1 tsp | spices | 55 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
      protein: {
        title: "Aloo Gobi Paneer",
        tagline: "Paneer cubes tossed through, curd on the side.",
        highlights: ["Cauliflower", "Paneer", "Curd"],
        minutes: 30, kcal: 460, protein: 26,
        tip: "Add the paneer once the cauliflower is tender, then cook two minutes more.",
        items: `
          Cauliflower | 1 pcs | produce | 40
          Paneer | 200 g | dairy | 95
          Potatoes | 150 g | produce | 40
          Curd | 200 g | dairy | 45
          Onion | 1 pcs | produce | 45
          Ginger | 20 g | produce | 20
          Cooking oil | 1 tbsp | pantry | 180 | s
          Cumin seeds | 1 tsp | spices | 55 | s
          Turmeric | 0.5 tsp | spices | 40 | s
          Salt | 1 tsp | spices | 28 | s`,
      },
    },
  },
];

const CATEGORIES: Record<string, IngredientCategory> = {
  produce: "produce",
  dairy: "dairy",
  meat: "meat_seafood",
  bakery: "bakery",
  pantry: "pantry",
  spices: "spices",
  frozen: "frozen",
  beverages: "beverages",
  other: "other",
};

type FeedItem = Omit<CartItem, "id">;

function parseItems(block: string, where: string): FeedItem[] {
  return block
    .trim()
    .split("\n")
    .map((line) => {
      const [name, amount, cat, price, flags = "", notes = "", subs = ""] = line.split("|").map((part) => part.trim());
      const match = /^([\d.]+)\s*(g|kg|ml|l|pcs|tsp|tbsp|bunch|pack|pinch)$/.exec(amount ?? "");
      const category = CATEGORIES[cat ?? ""];
      if (!name || !match || !category || !Number(price)) throw new Error(`feed: bad row in ${where}: "${line.trim()}"`);
      // "pinch" isn't a contract unit; send it as a quarter teaspoon.
      const [quantity, unit] = match[2] === "pinch" ? [0.25, "tsp" as Unit] : [Number(match[1]), match[2] as Unit];
      return {
        name,
        searchQuery: name.toLowerCase(),
        quantity,
        unit,
        category,
        optional: flags.includes("o"),
        pantryStaple: flags.includes("s"),
        substitutes: subs ? subs.split(",").map((s) => s.trim()).filter(Boolean) : [],
        ...(notes ? { notes } : {}),
        estimatedPriceInr: Number(price),
      };
    });
}

export interface FeedDish extends Omit<DishData, "styles"> {
  styles: Record<DishStyleId, Omit<StyleData, "items"> & { items: FeedItem[] }>;
}

// Parsed once at load: a malformed row fails loudly in dev and at build time.
export const FEED: FeedDish[] = DATA.map((dish) => ({
  ...dish,
  styles: Object.fromEntries(
    Object.entries(dish.styles).map(([style, data]) => [style, { ...data, items: parseItems(data.items, `${dish.id}/${style}`) }]),
  ) as FeedDish["styles"],
}));

for (const name of POPULAR_DISHES) {
  if (!FEED.some((d) => d.name === name)) throw new Error(`feed: POPULAR_DISHES lists "${name}" but the feed has no such dish`);
}

const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Best feed match for free text ("paneer makhani", "biriyani", "rajma"), or null. */
export function findDish(query: string): FeedDish | null {
  const q = normalise(query);
  if (q.length < 3) return null;
  const words = new Set(q.split(" ").filter((w) => w.length > 2));
  let best: FeedDish | null = null;
  let bestScore = 0;
  for (const dish of FEED) {
    for (const key of [dish.name, ...dish.aliases].map(normalise)) {
      let score = 0;
      if (q === key) score = 100;
      else if (q.includes(key) || key.includes(q)) score = 50 + Math.min(key.length, q.length);
      else {
        const keyWords = key.split(" ").filter((w) => w.length > 2);
        const hits = keyWords.filter((w) => words.has(w)).length;
        score = keyWords.length ? (hits / keyWords.length) * 45 : 0;
      }
      if (score > bestScore) {
        best = dish;
        bestScore = score;
      }
    }
  }
  return bestScore >= 30 ? best : null;
}

export const dishById = (id: string) => FEED.find((d) => d.id === id)!;

const STYLE_ORDER: DishStyleId[] = ["restaurant", "basic", "healthy", "protein"];

export function feedVariants(dish: FeedDish, source: Exclude<Source, "gemini">): VariantsOk {
  return {
    ok: true,
    source,
    dish: dish.name,
    cuisine: dish.cuisine,
    summary: dish.summary,
    isVeg: dish.veg,
    variants: STYLE_ORDER.map(
      (style): DishVariant => ({
        style,
        title: dish.styles[style].title,
        tagline: dish.styles[style].tagline,
        highlights: dish.styles[style].highlights,
        timeMinutes: dish.styles[style].minutes,
        kcalPerServing: dish.styles[style].kcal,
        proteinGrams: dish.styles[style].protein,
      }),
    ),
  };
}

/** Feed lists are written for 2 servings; scale counts to whole units, weights linearly. */
export function feedIngredients(dish: FeedDish, style: DishStyleId, servings: number, source: Exclude<Source, "gemini">): IngredientsOk {
  const factor = servings / 2;
  const data = dish.styles[style];
  return {
    ok: true,
    source,
    dish: dish.name,
    style,
    servings,
    tip: data.tip,
    items: data.items.map((item, index) => ({
      ...item,
      id: `ing_${String(index + 1).padStart(2, "0")}`,
      quantity:
        item.unit === "pcs" || item.unit === "bunch" || item.unit === "pack"
          ? Math.max(1, Math.round(item.quantity * factor))
          : item.quantity * factor,
    })),
  };
}
