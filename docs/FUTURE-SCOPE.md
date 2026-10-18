# Mise — future scope (for the PPT)

Things intentionally deferred to keep the MVP tight + bug-free for submission. All are
natural next steps, not gaps in the core experience.

## Product
- **More shopping modes** beyond *Best rated / Best price*: **Balanced** (quality within a budget) and **Family / bulk packs** (size up for larger households). MVP keeps the two clearest.
- **Wishlist → weekly calendar** deepening: resume the exact saved *style/variant* when cooking from the plan (today it re-asks the style); drag-and-drop planning; auto-build a week's cart.
- **More quick-commerce stores**: Blinkit, Swiggy Instamart, BigBasket, Amazon Fresh (shown "coming soon"; the store step + cart contract are already store-agnostic).
- **Connect your own Zepto** (per-user accounts) in addition to the shared demo account.
- **Multimodal**: snap a photo of your fridge/pantry → Gemini subtracts what you already have.
- **Accessibility / reach**: Hindi + regional language input and a voice-first flow (Gemini).
- **Rotating / expanding recipe styles** beyond the current four.
- Use **height** (collected) for fuller nutrition targets; richer on-recipe nutrition metrics.

## Ops / platform
- **Durable orders** in Firestore (today in-memory + Resend email as the durable copy) + an admin "fulfil / delivered / cancel" lifecycle and a user "my orders" screen.
- **Richer offline fallback**: capture live Zepto results into the golden cache during normal use, so even a live outage serves a full, real cart.
- **Google sign-in** hardening (authorized origins / token verification on the Cloud Run domain). Demo login is the primary judge path.
- **Durable token persistence** so the shared account's refreshed token survives cold starts/scale-out.
- Structured-JSON logging for exact Cloud Run severities (errors already classify correctly).

## Impact framing (for the deck)
Affordable, nutrition-smart groceries for Indian households — age→protein targeting,
budget-aware product choice, and "already in your kitchen" waste/₹ savings. SDG 2 (Zero Hunger) / SDG 3 (Good Health). Built for India, scales across JAPAC. Gemini structured output + live Zepto commerce, deployed on Google Cloud Run.
