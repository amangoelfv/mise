/** Shared copy and URLs for metadata, sitemap, robots, manifest and structured data. */
export const SITE = {
  name: "Mise",
  title: "Mise · What do you want to eat today?",
  description:
    "Type a dish. Mise asks how you want to cook it, writes the exact grocery list with Gemini, and builds the cart on Zepto.",
  url: (process.env.APP_URL || "http://localhost:3200").replace(/\/+$/, ""),
  keywords: [
    "Mise",
    "recipe to grocery cart",
    "grocery list generator",
    "Zepto",
    "Gemini",
    "Indian recipes",
    "home cooking",
    "meal planning",
    "quick commerce",
  ],
};

/** For pages behind sign-in: keep them out of search results. */
export const PRIVATE_ROBOTS = { index: false, follow: false } as const;
