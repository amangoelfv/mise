# Mise — 3-minute demo script

Tagline: **"Recipe to doorstep — nutrition-smart, budget-safe, in one tap."**

Built for the Google Cloud AI Builder Cup: **Gemini + Google Cloud Run + Zepto live commerce.**
Problem statement fit: **Retail & Commerce / Sustainability & Social Impact** (affordable nutrition for Indian households).

## Before you record
- App is deployed and reachable on **Cloud Run** (say the URL out loud + show it).
- Use the **demo account** (one tap, no sign-in).
- Make sure Zepto is live (token + client_id set) so the cart shows **real products + prices**.

## The three differentiators to say explicitly
1. **Nutrition** — your age → daily protein target tunes the recipes ("★ Recommended for you").
2. **Affordability** — your budget preference (best-price / best-rated) steers which product Gemini picks.
3. **Inventory-aware** — we skip what you already bought on Zepto ("already in your kitchen") → money saved.

## Script (~3:00)
- **0:00–0:20 — Problem.** "Indian families want to eat healthy on a budget, but shopping is manual, wasteful and nutrition-blind." One line, one stat if you have it.
- **0:20–0:40 — Solution + proof.** One sentence on Mise; show the **live Cloud Run URL**. "Gemini-powered, deployed on Google Cloud."
- **0:40–2:10 — One live flow (don't branch):**
  1. New user → quick profile (age, diet, budget) — captured once.
  2. Type a dish (e.g. "rajma chawal") → **four Gemini styles**; point at the **"★ For you"** badge ("matched to my age/protein").
  3. Pick it → ingredient list; untick a staple ("I have salt").
  4. **Build cart** → real Zepto products + prices; expand a row to show **Gemini's "why this pick"**; show **"already in your kitchen"** skip and **₹ saved**.
  5. Edit (qty / remove / add-back), then **Place order** → address → **"Order placed"** + the operator gets an email.
- **2:10–2:40 — Impact + scale.** Affordable nutrition security; SDG 2 (Zero Hunger) / SDG 3 (Good Health). "Built for India, scales across JAPAC; Zepto today, Blinkit/Swiggy next."
- **2:40–3:00 — Tech.** "Gemini structured output for the recipe + product selection, deployed on Google Cloud Run, integrated with Zepto's live commerce API."

## Judging-criteria hooks (name them in the video)
- **AI implementation:** Gemini structured/JSON output → validated, profile-aware grocery list + per-product choice with reasons.
- **Impact:** real ₹ saved + nutrition targeting for everyday households.
- **Innovation/UX:** nutrition + affordability + inventory-awareness in one clean flow.
- **Best Use of Google AI / Most Impactful / Best UI/UX:** all directly addressable — mention the stack + the social-impact angle.

## Verify on the Hack2skill portal before submitting
- Exact deliverables (video length, repo link, deck).
- Eligibility (reportedly working professionals, 21+, teams 2–4, JAPAC).
