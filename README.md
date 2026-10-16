# mise

**What do you want to eat today?** Type a dish, pick how you want to cook it, and Mise writes the exact grocery list with Gemini and builds the cart on Zepto.

From *mise en place*: everything in its place. Built for the Gemini hackathon.

## Run it

```bash
npm install
cp .env.example .env.local   # optional, see below
npm run dev -- -p 3200
```

Open http://localhost:3200. With no env vars at all you get:

- a **demo login** instead of Google sign-in,
- **sample data** (White Sauce Pasta) instead of live Gemini, flagged in the UI,
- a **simulated cart service** and a "simulated store" option in the Zepto dialog.

Add `GEMINI_API_KEY` to generate any dish, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` for Google sign-in, and `CART_API_URL` once the cart service exists. All variables are documented in [.env.example](.env.example).

## How it works

```
You ──"white sauce pasta"──▶ Gemini 3.5 Flash-Lite ──▶ 4 takes (restaurant / basic / healthy / protein)
You ──pick one──────────────▶ Gemini 3.8 Flash ──────▶ ingredient list (JSON schema, scaled to servings)
You ──untick what you have──▶ Mise ──CartRequest v1──▶ Cart API ──Zepto MCP──▶ cart ready ──▶ "Open cart in Zepto"
```

- Both Gemini calls use structured output (`responseJsonSchema`) and are sanitised server-side: [src/lib/gemini.ts](src/lib/gemini.ts).
- The JSON handed to the cart service is a versioned contract: [CONTRACT.md](CONTRACT.md), types in [src/lib/contract.ts](src/lib/contract.ts). Press **JSON** on any ingredient list to see the exact payload.
- **Zepto** connects through its official MCP server ([zeptonow/mcp](https://github.com/zeptonow/mcp)): OAuth 2.1 + PKCE in a popup, phone and OTP on Zepto's own page. Mise requests catalog and cart scopes only, so it can never place an order. Tokens live in an encrypted, httpOnly cookie: [src/lib/zepto.ts](src/lib/zepto.ts), [src/app/api/connectors/zepto](src/app/api/connectors/zepto).
- **Google sign-in** uses Google Identity Services; the server verifies the ID token against Google's JWKS and issues its own signed session cookie ([src/lib/session.ts](src/lib/session.ts)). No database.
- Kitchen preferences (servings, diet, allergies, skip staples, pincode) are stored per device in `localStorage` and sent to Gemini with each request.

## Pages

| Route | What |
| --- | --- |
| `/` | The pitch deck: eight scroll-snapped slides, arrow keys work. |
| `/app` | The product. `/app?q=rajma%20chawal` jumps straight to styles. |
| `/settings` | Connectors (Zepto), kitchen preferences, account, system status. |
| `/brand` | Logo, colour, type, motifs and voice. Also in [BRAND.md](BRAND.md). |
| `/login` | Google sign-in, plus demo login when enabled. |

## Code map

```
src/
  proxy.ts                 auth redirects before render
  app/
    page.tsx               deck
    (app)/app, settings    signed-in pages (cookie reads inside <Suspense>, Cache Components)
    api/dish/*             Gemini: variants, ingredients
    api/cart/*             build CartRequest, call the cart service, poll status
    api/connectors/zepto/* Zepto OAuth start / callback / simulate / disconnect
    api/auth/*             Google, demo, logout
  components/
    orb.tsx                WebGL dot sphere (no three.js)
    brand.tsx              logo mark + wordmark
    flow/*                 dish → style → list → cart
  lib/                     contract, gemini, session, zepto, cart-api adapter
```

## Deploy

Cloud Run in Mumbai, built from the included `Dockerfile`: see [DEPLOY.md](DEPLOY.md).

## Notes

- Next.js 16 with `cacheComponents`: anything reading cookies or `searchParams` sits inside `<Suspense>`, and auth redirects happen in `src/proxy.ts`.
- Zepto's README says extra OAuth redirect URIs must be requested through GitHub issues on [zeptonow/mcp](https://github.com/zeptonow/mcp). Request `https://<your domain>/api/connectors/zepto/callback` before deploying.
