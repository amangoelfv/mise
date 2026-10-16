# Mise ⇄ Cart API contract · v1.0

Mise turns a dish into a structured ingredient list (Gemini) and hands it to a **cart service**, which fills the user's Zepto cart and tells Mise when it's ready. This document is everything the cart service needs to implement.

The TypeScript source of truth is [`src/lib/contract.ts`](src/lib/contract.ts). It has no imports, so you can copy it into the cart service as-is.

## Endpoints

Base URL is whatever Mise has in `CART_API_URL`. Every request carries `Authorization: Bearer <CART_API_KEY>` and `Content-Type: application/json`.

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| `POST` | `/v1/carts` | `CartRequest` | `CartStatus` (200 or 202) |
| `GET` | `/v1/carts/{cartId}` | none | `CartStatus` |

- Return `status: "ready"` straight from the POST if you can build the cart within ~20 s. Otherwise return `status: "processing"` and Mise polls `GET /v1/carts/{cartId}` every 1.5 s for up to 2 minutes.
- Any non-2xx response should be JSON `{ "error": "Human-readable message" }`. Mise shows it to the user verbatim, so write it for a person.
- Mise times out a single call after 25 s.

## How you reach Zepto: `connector`

Users connect Zepto inside Mise through **Zepto's official MCP server** ([github.com/zeptonow/mcp](https://github.com/zeptonow/mcp)). They sign in on Zepto's own page (phone + OTP, OAuth 2.1 with PKCE), and Mise sends you a bearer token for that user with every cart request:

```json
"connector": {
  "provider": "zepto",
  "transport": "mcp",
  "mcpUrl": "https://mcp.zepto.co.in/mcp",
  "accessToken": "eyJ…",
  "expiresAt": "2026-10-16T09:12:00.000Z"
}
```

- Call the MCP server at `mcpUrl` (Streamable HTTP) with `Authorization: Bearer <accessToken>`. Use `tools/list` to discover tool names; the server offers catalog search, cart management, order placement and order history.
- **The token is scoped to catalog and cart only:** `tools:read tools:write dev.ucp.shopping.catalog.search:read dev.ucp.shopping.catalog.lookup:read dev.ucp.shopping.cart:manage dev.ucp.common.location.search:read dev.ucp.common.location.lookup:read`. Mise deliberately does not request order or checkout scopes. The user always checks out in Zepto.
- Mise refreshes the token before sending it; it is valid until at least `expiresAt`. Don't store or log it beyond the request.
- `transport: "simulated"` (with a `connectionId` instead of a token) only appears in demo setups where nobody has a Zepto account. Treat it as "make up a plausible cart".

Suggested approach for each item: search the catalog with `searchQuery`, pick the smallest pack that covers `quantity` + `unit` (or the best price per unit), add it to the cart, and fall back to `substitutes` in order. Anything you can't find goes in `unavailable`.

## `CartRequest`

| Field | Type | Notes |
| --- | --- | --- |
| `version` | `"1.0"` | Bumped on breaking changes. |
| `requestId` | string | Unique per request; echo it back. |
| `createdAt` | ISO 8601 | |
| `source` | `"mise-web"` | |
| `user` | `{ id, email, name }` | `id` is stable per Google account (`google:<sub>`) or `demo`. |
| `connector` | see above | |
| `delivery.pincode` | string? | 6 digits, optional. |
| `dish` | object | `query` (what they typed), `name`, `cuisine?`, `style` (`restaurant` / `basic` / `healthy` / `protein`), `styleLabel`, `variantTitle`, `servings`. |
| `preferences` | `{ diet, avoid[] }` | `diet`: `any` / `vegetarian` / `eggetarian` / `vegan` / `jain`. Respect these when substituting. |
| `items` | `CartItem[]` | Only what the user kept ticked. 1 to 40 items. |

### `CartItem`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | `ing_01`, `ing_02`… Echo it in `CartLine.ingredientId`. |
| `name` | string | Display name: "Fresh cream". |
| `searchQuery` | string | What to type into Zepto search: "fresh cream". Generic, no brand. |
| `quantity`, `unit` | number, enum | Amount the **recipe uses**, already scaled to `servings`. Units: `g kg ml l pcs tsp tbsp bunch pack`. You choose the pack size. |
| `category` | enum | `produce dairy meat_seafood bakery pantry spices frozen beverages other` |
| `optional` | boolean | Garnish or add-on. Fine to drop if unavailable. |
| `pantryStaple` | boolean | Salt, oil… The user chose to keep it anyway. |
| `substitutes` | string[] | Up to 2, best first. |
| `notes` | string? | e.g. "about 6 cloves". |
| `estimatedPriceInr` | number? | Gemini's guess for the smallest pack. A hint, not a price. |

## `CartStatus`

| Field | Type | Notes |
| --- | --- | --- |
| `version` | `"1.0"` | |
| `cartId` | string | Your id. Used in the polling URL. |
| `requestId` | string | From the request. |
| `status` | `processing` / `ready` / `partial` / `failed` | `partial` = cart built but something was missing. |
| `provider` | `"zepto"` | |
| `cartUrl` | string? | **Required for `ready` / `partial`.** Mise's big "Open cart in Zepto" button links here. |
| `lines` | `CartLine[]` | What you added. |
| `unavailable` | `{ ingredientId, name, reason? }[]` | |
| `totals` | `{ itemsInr, deliveryInr?, totalInr, currency: "INR" }`? | |
| `etaMinutes` | number? | Shown as "arrives in about N min". |
| `message` | string? | Shown under the button (or as the error for `failed`). |
| `updatedAt` | ISO 8601 | |

### `CartLine`

`{ ingredientId, productId, name, brand?, packSize, quantity, priceInr, mrpInr?, imageUrl? }`. `packSize` is human-readable ("200 ml"), `quantity` is the number of packs, `priceInr` is the line total.

## Example

Request (trimmed to two items):

```json
{
  "version": "1.0",
  "requestId": "req_5f0c6a4e-2b8f-4c47-9d8e-0c1d4b7f2a10",
  "createdAt": "2026-10-16T08:15:09.704Z",
  "source": "mise-web",
  "user": { "id": "google:1098…", "email": "cook@example.com", "name": "Asha" },
  "connector": {
    "provider": "zepto",
    "transport": "mcp",
    "mcpUrl": "https://mcp.zepto.co.in/mcp",
    "accessToken": "eyJ…",
    "expiresAt": "2026-10-16T09:12:00.000Z"
  },
  "delivery": { "pincode": "560001" },
  "dish": {
    "query": "white sauce pasta",
    "name": "White Sauce Pasta",
    "cuisine": "Italian · Indian home-style",
    "style": "restaurant",
    "styleLabel": "Restaurant Style",
    "variantTitle": "Parmesan Alfredo Penne",
    "servings": 2
  },
  "preferences": { "diet": "vegetarian", "avoid": ["peanuts"] },
  "items": [
    {
      "id": "ing_01",
      "name": "Penne pasta",
      "searchQuery": "penne pasta",
      "quantity": 250,
      "unit": "g",
      "category": "pantry",
      "optional": false,
      "pantryStaple": false,
      "substitutes": ["Fusilli"],
      "estimatedPriceInr": 99
    },
    {
      "id": "ing_02",
      "name": "Fresh cream",
      "searchQuery": "fresh cream",
      "quantity": 200,
      "unit": "ml",
      "category": "dairy",
      "optional": false,
      "pantryStaple": false,
      "substitutes": [],
      "estimatedPriceInr": 70
    }
  ]
}
```

Response:

```json
{
  "version": "1.0",
  "cartId": "cart_8b1e…",
  "requestId": "req_5f0c6a4e-2b8f-4c47-9d8e-0c1d4b7f2a10",
  "status": "ready",
  "provider": "zepto",
  "cartUrl": "https://www.zeptonow.com/",
  "lines": [
    { "ingredientId": "ing_01", "productId": "zp_123", "name": "Penne Rigate", "brand": "Borges", "packSize": "500 g", "quantity": 1, "priceInr": 145 },
    { "ingredientId": "ing_02", "productId": "zp_456", "name": "Fresh Cream", "brand": "Amul", "packSize": "250 ml", "quantity": 1, "priceInr": 72 }
  ],
  "unavailable": [],
  "totals": { "itemsInr": 217, "deliveryInr": 0, "totalInr": 217, "currency": "INR" },
  "etaMinutes": 10,
  "updatedAt": "2026-10-16T08:15:21.002Z"
}
```

## Testing against Mise

1. Run Mise locally (`npm run dev`), set `CART_API_URL=http://localhost:<your port>` and `CART_API_KEY=<anything>` in `.env.local`, restart.
2. In the app, open any ingredient list and press **JSON** to see the exact request Mise will send (the token is masked in that preview only).
3. With `CART_API_URL` unset, Mise simulates the cart service locally, which is handy for UI work.
