# Mise — build status (cart / ordering side)

Living doc. Updated as we build. Branch: `feat/real-zepto-cart-engine`.

## Done & verified in the browser
- **Live Zepto engine**: structuredContent parsing, text-only side-effect calls tolerated,
  JWT-expiry + auto-refresh, cookie OAuth connection wins over env override, full logging.
- **Gemini product selection** (style + diet + budget aware), minimal batched call, algo fallback,
  "why this pick" reason shown per line ("AI · …").
- **Deterministic fixes**: `-es` plural matching (tomatoes), discard price≤0 products.
- **Inventory skip** ("already in your kitchen") from Zepto order history (UUIDv7 dates + shelf life),
  explained in the cart; **add-back** button to pull a skipped item into the cart (one tap).
- **Zepto-style cart**: product rows (image, pack, qty steppers, remove), live totals,
  chosen style + variant shown. No dead buttons (removed "Open cart in Zepto" + dev JSON).
- **Order flow (mock, safe)**: Place order → delivery address → "Order placed". Never calls a real
  Zepto order; records a local order + emails the operator (Resend).
- **Admin** (`/admin`): password-gated (`ADMIN_PASSWORD`), Orders list + Zepto connect (operator only).
- **Profile** (teammate, merged): age→protein target, weight/height, diet, budget → feed Gemini
  prompts (variants, ingredients, and now product selection). First-run profile dialog.
- **Demo-id isolation**: each demo login gets a unique `demo:<uuid>` id → two judges don't share state.
- **Landing page** copy refreshed to the current model (profile, Gemini selection, home delivery).

## Parked (by decision)
- **Wishlist → weekly calendar (B/L/D)** — the one remaining vision feature. Plan: localStorage,
  keyed per user id (isolated via the unique demo id). Not started.

## Known issues / operational
- **Token freshness (IMPORTANT for the demo):** the Zepto access token lasts ~1h. Auto-refresh needs a
  valid refresh token **and `ZEPTO_CLIENT_ID`** in env. `.env.local` currently has access+refresh but no
  client id, so it dies after ~1h and the cart falls back to the 6-item golden cache. Before the demo:
  reconnect via `/admin`, export from `/api/connectors/zepto/token` (now includes CLIENT_ID), set all three.
- **Orders are in-memory**: the operator Orders list resets on server restart. Resend email is the durable
  record. Firestore is the real-prod fix (deferred).
- Admin connect card copy ("you check out and pay in Zepto") is slightly stale vs the delivery model;
  operator-facing, low priority.

## Prod env keys (Cloud Run)
```
SESSION_SECRET, NEXT_PUBLIC_DEMO_LOGIN=1, GEMINI_API_KEY,
ZEPTO_ACCESS_TOKEN, ZEPTO_REFRESH_TOKEN, ZEPTO_CLIENT_ID,
RESEND_API_KEY, RESEND_FROM, RESEND_TO,
ADMIN_ENABLED=1, ADMIN_PASSWORD
```
Do NOT set `ZEPTO_TOKEN_EXPORT` or `CART_API_URL` in prod. Google sign-in also needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Next
1. Wishlist + calendar (parked feature).
2. Firestore for durable orders + token persistence (true prod).
3. Rotating/expanding recipe styles.
