# Mise — build status (cart / ordering side)

Living doc. Branch: `feat/real-zepto-cart-engine`.

## Done & verified in the browser
- **Live Zepto engine**: structuredContent parsing, text-only side-effect calls tolerated,
  JWT-expiry + auto-refresh, cookie OAuth connection wins over env override, full logging.
- **Gemini product selection** (style + diet + budget aware), batched, algo fallback, "why this pick".
- Deterministic fixes: `-es` plural matching (tomatoes), discard price≤0 products.
- **Inventory skip** ("already in your kitchen") from Zepto order history + **one-tap add-back**.
- **Zepto-style cart**: product rows (image, pack, qty steppers, remove), live totals, chosen
  style + variant, and **"coming soon" store chips** (Zepto live; Blinkit/Swiggy/BigBasket soon;
  connect-your-own soon).
- **Order flow (mock, safe)**: Place order → address → "Order placed"; records locally + Resend email.
  Never places a real Zepto order.
- **Admin** (`/admin`): password-gated, Orders list + Zepto connect (operator only).
- **Profile** (age→protein, weight/height, diet, budget) feeds all Gemini prompts; first-run dialog.
- **Recommended for you**: the style best matching the profile is badged + explained on the style cards.
- **Demo-id isolation**: each demo login gets a unique `demo:<uuid>` → judges don't share state.
- **Wishlist → weekly calendar** (`/plan`): save dishes, assign to Mon–Sun × B/L/D, "Cook" a slot.
  localStorage, per user id.
- **Landing page** copy current (profile, Gemini selection, home delivery; no stale "Cart API").

## Known issues / operational
- **Token freshness (IMPORTANT):** Zepto access token ~1h. Auto-refresh needs a valid refresh token
  **and `ZEPTO_CLIENT_ID`** in env. Set all three (from `/api/connectors/zepto/token`) or carts fall
  back to the 6-item golden cache.
- **Orders in-memory**: operator Orders list resets on restart; Resend email is the durable record.
- Logging: `console.*` reaches Cloud Run; errors show as ERROR + auto-captured by Error Reporting.
  Optional polish: structured-JSON logger for exact INFO/WARNING severities (not required).
- Admin-connect card copy ("check out in Zepto") slightly stale; operator-only, minor.

## Prod env keys (Cloud Run)
```
SESSION_SECRET            # openssl rand -base64 32   (required)
NEXT_PUBLIC_DEMO_LOGIN=1  # judge demo button
GEMINI_API_KEY            # required
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FAST_MODEL=gemini-2.5-flash-lite
ZEPTO_ACCESS_TOKEN  ZEPTO_REFRESH_TOKEN  ZEPTO_CLIENT_ID   # all three (client id = refresh)
RESEND_API_KEY  RESEND_FROM=onboarding@resend.dev  RESEND_TO
ADMIN_ENABLED=1  ADMIN_PASSWORD
```
Do NOT set `ZEPTO_TOKEN_EXPORT` or `CART_API_URL` in prod. Google sign-in also needs `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Parked / future
- Firestore for durable orders + token persistence (true prod).
- Rotating/expanding recipe styles; more quick-commerce stores (Blinkit/Swiggy/BigBasket).
- Structured-JSON logging polish.
