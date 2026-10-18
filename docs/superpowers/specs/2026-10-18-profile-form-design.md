# First-run profile form — design

**Date:** 2026-10-18
**Status:** awaiting review
**Scope:** the profile form only. The "go to recipe" screen is a separate feature with its own spec.

## 1. Why

Mise asks Gemini for four takes on a dish and then a grocery list, but it knows almost
nothing about the person cooking. Today it knows `diet`, `avoid`, `servings`,
`skipStaples` and `pincode`, all held in one device-global `localStorage` record
(`src/lib/prefs.ts`).

We want five facts, asked once, so that the four style cards and the ingredient list come
back tuned to the person instead of generic:

| Fact | What it buys us |
| --- | --- |
| Age band | Protein factor — a teenager, an adult and an older adult need different g/kg |
| Weight, height | The protein target itself |
| Diet preference | Exact ingredient selection (already modelled as `Diet`) |
| Skip pantry staples | Don't make someone re-buy salt and turmeric |
| Budget | Whether to rank products by rating or by price |

## 2. Non-goals

- **No database.** Nothing persists server-side; see §3.
- **No cross-device sync.** A profile filled on a laptop does not appear on a phone. This
  is a deliberate choice for the testing period, not an oversight.
- **No recipe steps.** Separate feature, separate spec.
- **No new sign-in or account surface.** The profile is keyed off the existing session.
- **No health claims.** See §5.

## 3. Storage

There is no database in this project. The complete inventory of state today:

| What | Where | Scope |
| --- | --- | --- |
| Kitchen prefs | `localStorage["mise:prefs:v1"]` | per device, **shared across accounts** |
| Session user | signed JWT in `SESSION_COOKIE` (`src/lib/session.ts`) | per device |
| Zepto tokens | encrypted JWT in `CONNECTORS_COOKIE` | per device, bound to `user.id` |
| Carts | the cart service behind `CART_API_URL` | not ours |

### Decision: extend the existing prefs store, re-keyed per user

The profile overlaps the existing prefs on `diet` and `skipStaples`. A second store would
give those two fields two sources of truth, and `settings-view.tsx` would have to read from
both. So we extend `Prefs` rather than adding a parallel `Profile`.

The key becomes per-account:

```
mise:prefs:v2:<user.id>        e.g. mise:prefs:v2:google:1079...
```

`user.id` is already the stable `google:<sub>` string minted in
`verifyGoogleCredential` (`src/lib/session.ts`). Per account, per device — exactly the
requested scope, with no infrastructure.

### Shape

```ts
export type AgeBand = "under20" | "adult" | "senior";
export type BudgetPreference = "best_rated" | "best_price";
export type ProfileStatus = "unset" | "saved" | "skipped";

export interface Prefs {
  // existing
  servings: number;
  diet: Diet;
  avoid: string;
  skipStaples: boolean;
  pincode: string;
  // new
  ageBand: AgeBand | null;
  weightKg: number | null;
  heightCm: number | null;
  budget: BudgetPreference;
  profileStatus: ProfileStatus;
}

export const DEFAULT_PREFS: Prefs = {
  servings: 2,
  diet: "any",
  avoid: "",
  skipStaples: true,
  pincode: "",
  ageBand: null,
  weightKg: null,
  heightCm: null,
  budget: "best_rated",
  profileStatus: "unset",
};
```

`null` rather than a default number for the three body fields, so "not answered" is
distinguishable from "answered 70 kg" — we must not derive a protein target from a number
nobody gave us.

### `profileStatus` drives the prompt

- `"unset"` — never asked on this device for this account. Prompt on the next dish.
- `"saved"` — filled in. Never prompt again.
- `"skipped"` — offered and declined. **Never prompt again**; Settings remains the way in.

Both `"saved"` and `"skipped"` are terminal. The prompt is strictly once per account per
device, as requested.

### Wiring the user id into a module-level store

`prefs.ts` is a module singleton read through `useSyncExternalStore`, and `getPrefs()` is
called from inside async handlers in `flow.tsx` — a property its own comment calls out and
that we must preserve. So we do **not** convert it to React context. Instead:

```ts
/** Points the store at one account's record. Idempotent; safe to call during render. */
export function setPrefsUser(userId: string): void
```

It sets the active key and invalidates the cached read. `Flow` and `SettingsView` are the
only two consumers of prefs; both already render under a `getUser()` call, so each calls
`setPrefsUser(...)` at the top of its body. Before the first call the store serves
`DEFAULT_PREFS`, which is also the correct SSR snapshot.

The two components take the id differently, following the props each already has:

- `Flow` takes a flat `firstName` string, so it gains a sibling `userId: string` prop.
  `(app)/app/page.tsx` already holds `user` and passes `userId={user.id}`.
- `SettingsView` already takes a `user` object (`{ name, email, picture, demo }`), so that
  object gains `id: string` and `(app)/settings/page.tsx` adds `id: user.id` to the literal
  it builds. No new prop.

### Migration from the device-global key

On the first read for a user where `mise:prefs:v2:<id>` is absent but the legacy
`mise:prefs:v1` exists, seed from the legacy record and leave `profileStatus` at `"unset"`
so the person is still offered the new questions. The legacy key is left in place
(harmless, and it keeps a rollback cheap).

## 4. First-run prompt

### Placement

The prompt fires on the **first dish submission**, between the dish and the four style
cards — not on arrival at `/app`. Someone who signs in and looks around is never
interrupted; someone about to get recipe suggestions is asked first, which is where the
questions make sense.

### Decision: a dialog over the styles screen, not a new flow stage

`flow.tsx` walks a strict linear history chain:

```ts
const ORDER: Record<Stage, number> = { ask: 0, styles: 1, ingredients: 2, cart: 3 };
```

Its comment states the invariant: "Steps only ever advance by one, so a stage's index
equals its distance from the `ask` entry." `startOver()` depends on it
(`window.history.go(-ORDER[stage])`). Inserting a `profile` stage that exists only on first
run would make those indices conditional and break that invariant.

So the prompt is a `Dialog` (the existing component, already used for Zepto connect and the
payload viewer) rendered over the `styles` stage. The stage machinery, the history chain and
`startOver` are untouched.

**Flow:** `askDish()` advances to `styles` as it does today, but when
`profileStatus === "unset"` it opens the profile dialog **instead of** calling
`fetchVariants`. The styles screen behind shows its normal loading state. On resolve we
close the dialog and call `fetchVariants`, which then carries the fresh prefs.

```
askDish("paneer tikka")
  └─ profileStatus === "unset"?
       ├─ yes → stage = "styles", open dialog, DO NOT fetch
       │         ├─ Continue → save, status = "saved",   close, fetchVariants
       │         └─ Skip     → defaults, status = "skipped", close, fetchVariants
       └─ no  → stage = "styles", fetchVariants   (today's path)
```

### The dialog

One screen, five questions, all tappable, nothing required:

- **Age** — three chips: `Under 20` / `20–50` / `50+`, mapping to `ageBand`
- **Weight, height** — two short numeric inputs, both optional, `kg` and `cm`
- **Diet** — the five existing chips from `settings-view.tsx`, same labels
- **Skip pantry staples** — the existing toggle, defaulting on
- **Budget** — two chips: `Best rated` / `Best price`

Two actions: **Continue** and **Skip (use defaults)**. "Skip" is a real, visible,
equal-weight option — the person is testing a cooking app, not filling a form.

### Edge cases

| Case | Behaviour |
| --- | --- |
| Dialog dismissed by Escape, backdrop or the X button | All three route through `Dialog`'s single `onClose`, so one handler covers them. Treated as **Skip**. Critically, `fetchVariants` must still run, or the styles screen hangs on its loading state forever. |
| Arriving at `/app?q=paneer`, first run | `boot()` calls `fetchVariants` directly; it needs the same gate. |
| Reaching `/app` with no dish | No prompt. The prompt is tied to dish submission. |
| Continue tapped with nothing filled in | Equivalent to Skip, but records `"saved"` — they were asked and answered. |
| Dialog opens on a phone | `Dialog` focuses the first `input`/`textarea`/`select` on `showModal()` (`src/components/dialog.tsx`), which here would be the weight field — popping the keyboard over a form that is meant to be tapped. The form must either put the chip groups in their own non-input markup ahead of it and accept this, or the implementation suppresses that autofocus for this dialog. **Suppress it**: add an opt-out prop to `Dialog` rather than reordering the questions. |
| `localStorage` unavailable (private mode) | `prefs.ts` already degrades to an in-memory record. The prompt may reappear in a later session; acceptable. |
| Two accounts on one device | Separate keys, so the second account is prompted on its first dish. Correct. |

## 5. Deriving the protein target

```ts
const PROTEIN_G_PER_KG: Record<AgeBand, number> = {
  under20: 1.0,  // still growing
  adult:   0.85, // ~RDA
  senior:  1.1,  // higher intake offsets age-related muscle loss
};

/** Daily protein target in grams, or null when we weren't told enough. */
export function proteinTargetG(prefs: Prefs): number | null {
  if (!prefs.ageBand || !prefs.weightKg) return null;
  return Math.round(prefs.weightKg * PROTEIN_G_PER_KG[prefs.ageBand]);
}
```

A pure function of prefs, with no weight or no age band yielding `null`. Every consumer
must handle `null` — a skipped profile is the common case, not an error.

`DishVariant` already carries `proteinGrams` and `kcalPerServing`
(`src/lib/types.ts`), so the style cards can show the take's protein against roughly a
third of the daily target without any new Gemini field.

### Height does not affect the protein number — flagged

Protein targets scale with body **weight**, not height. Height's usual job is a calorie
estimate (Mifflin-St Jeor), which also needs biological sex and an activity level — neither
of which we ask for, and asking would make this no longer a quick form.

This spec therefore **collects and stores height, derives nothing from it, and shows it
back in Settings.** That is an honest placeholder, not a computation. See decision D1.

### Not medical advice

These are rough general-population figures. The dialog carries one quiet line to that
effect, and Mise must not present the target as a personal nutritional prescription.
Weight, height and age band **never leave the device** — they are not added to
`CartRequest` (§7), because the cart service has no use for them.

## 6. Budget in the Gemini prompts

`budget` is the one new field that changes generation. It is a **tier modifier within each
style**, never a replacement for the style.

This matters: `basic` is already described to Gemini as "budget-friendly"
(`src/lib/styles.ts`). A naive "make it cheap" instruction would pull all four cards toward
`basic` and collapse the only screen where Mise shows range.

```ts
const BUDGET_RULES: Record<BudgetPreference, string> = {
  best_rated:
    "Shopping preference: quality first. Prefer well-regarded ingredients and brands " +
    "where they genuinely improve the dish.",
  best_price:
    "Shopping preference: value first. Prefer affordable, widely available ingredients " +
    "and common pack sizes; avoid premium imports where a local equivalent works.",
};
```

- **`getVariants`** — one line after the diet rules, plus an explicit instruction that the
  four styles must stay clearly distinct from one another regardless of this preference.
- **`getIngredients`** — the same line. It should bias `searchQuery` specificity and
  `estimatedPriceInr` toward the chosen tier.

`VariantsInput` and `IngredientsInput` (`src/lib/types.ts`) each gain
`budget: BudgetPreference`, and the two route handlers validate it with the existing
`oneOf` helper against a new `BUDGETS` tuple in `src/lib/http.ts`, matching how `DIETS` and
`STYLES` are already handled.

## 7. Contract change

The cart service picks the actual products, so `budget` has to reach it.

```ts
export type BudgetPreference = "best_rated" | "best_price";

export interface CartRequest {
  // ...
  preferences: {
    diet: Diet;
    avoid: string[];
    /** How the cart service should rank candidate products. Absent = best_rated. */
    budget?: BudgetPreference;
  };
}
```

### `CONTRACT_VERSION` stays `"1.0"`

`CONTRACT.md` line 45 defines the policy: `version` is "Bumped on breaking changes." An
optional field that older consumers ignore is not a breaking change — and bumping the
string **would** break them, since `CartRequest.version` is the literal type `"1.0"` and a
service validating `version === "1.0"` would start rejecting every request. So the field is
added additively and the version is left alone.

`contract.ts` has no imports on purpose so it can be copied wholesale into the cart service;
the new type must live in that file to keep that true.

`CONTRACT.md` needs: the `preferences.budget` row, a note that it is optional with
`best_rated` as the implied default, a sentence on what each value means for product
ranking, and the example payloads updated.

`cart/route.ts` populates it beside the existing `diet` and `avoid`, validated with `oneOf`.
`CartBody` in `types.ts` gains the field, and `cartBody()` in `flow.tsx` reads it from prefs.

## 8. Files touched

| File | Change |
| --- | --- |
| `src/lib/nutrition.ts` | **new** — `AgeBand`, protein factors, `proteinTargetG` (see the plan's refinement note) |
| `src/lib/prefs.ts` | new fields, per-user key, `setPrefsUser`, validated reads, legacy migration |
| `tsconfig.json` | `allowImportingTsExtensions` so `node --test` and `tsc` agree (§9) |
| `package.json` | `test` script |
| `src/lib/contract.ts` | `BudgetPreference`, optional `preferences.budget` |
| `src/lib/types.ts` | `budget` on `VariantsInput`, `IngredientsInput`, `CartBody` |
| `src/lib/http.ts` | `BUDGETS` tuple |
| `src/lib/gemini.ts` | `BUDGET_RULES`, both prompts, keep-styles-distinct instruction |
| `src/components/flow/profile-dialog.tsx` | **new** — the form |
| `src/components/dialog.tsx` | opt-out prop for the open-focus behaviour |
| `src/components/flow/flow.tsx` | gate in `askDish` and `boot`, dialog state, `budget` in `cartBody` |
| `src/components/settings-view.tsx` | age/weight/height/budget rows, `id` on the `user` prop |
| `src/components/flow/style-picker.tsx` | protein shown against the target when known |
| `src/app/(app)/app/page.tsx` | pass `userId` |
| `src/app/(app)/settings/page.tsx` | add `id: user.id` to the `user` prop literal |
| `src/app/api/dish/variants/route.ts` | validate and forward `budget` |
| `src/app/api/dish/ingredients/route.ts` | validate and forward `budget` |
| `src/app/api/cart/route.ts` | populate `preferences.budget` |
| `CONTRACT.md` | document the new field |

Per `AGENTS.md`, implementation must read the relevant guide under
`node_modules/next/dist/docs/` first — here `01-app/03-api-reference/01-directives` and the
client-component pages of `01-app/01-getting-started` — since this version's APIs differ
from training data.

## 9. Verification

This project has no `test` script and no test files, but it does not need a test runner
installed. **Verified on this machine during planning:** Node v24.21.0 strips TypeScript
types natively, so `node --test src/lib/prefs.test.ts` runs a `node:test` file against the
real modules with **zero new dependencies** — it imports `prefs.ts` (including its `react`
import and `"use client"` directive) without complaint.

The one catch, also verified: Node's ESM resolver requires the `.ts` extension in the import
specifier, and `tsc` rejects that extension with TS5097 unless
`allowImportingTsExtensions: true` is set. Adding that flag to `tsconfig.json` leaves both
`npx tsc --noEmit` and `npm run build` clean (both confirmed passing with it). It requires
`noEmit`, which this project already sets.

So verification is:

1. `npx tsc --noEmit -p tsconfig.json` clean — a fast per-task gate, much quicker than a
   full build.
2. `node --test src/lib/*.test.ts` green, covering the pure functions.
3. `npm run lint` and `npm run build` both clean.
4. Manual, signed in, with `localStorage` cleared:
   - first dish prompts; **Continue** saves and the four cards appear
   - first dish prompts; **Skip** proceeds on defaults and the cards still appear
   - **Escape out of the dialog** → cards still appear, prompt does not return
   - a second dish in the same session does **not** prompt
   - a reload does not prompt
   - signing in as a second account on the same device **does** prompt
   - Settings shows the saved values and editing them persists across a reload
   - the payload viewer on the ingredients screen shows `preferences.budget`
5. `CART_API_URL` unset, so the simulated cart path exercises the contract change without
   waiting on the cart service.

`proteinTargetG` is a pure function of prefs and a health-adjacent calculation, so it is the
one thing here that genuinely wants unit tests rather than a manual check.

## 10. Decisions for review

**D1 — Height.** It is collected and stored but computes nothing (§5). Options: keep it as
specified; drop the field until something uses it; or add biological sex and an activity
level to get a real calorie estimate, at the cost of the form being quick.
*Recommendation: keep as specified.* It was explicitly requested, it is one input, and a
later feature can use it without re-asking.

**D2 — Age band labels.** The spec uses `Under 20` / `20–50` / `50+` rather than
"middle-aged" / "old". Same three bands, but numeric labels are unambiguous and read better
to the person answering. *Recommendation: as specified.*

**D3 — Tests, revised after verification.** This decision originally read "no tests,
adding a runner is its own change." **That premise was wrong and has been corrected**: on
Node 24 there is no runner to add. `node --test` plus one `tsconfig.json` flag gives real
unit tests for zero dependencies, all three commands verified passing during planning (§9).
*Revised recommendation: unit-test `proteinTargetG` and the prefs read/migration logic;
leave the dialog and settings UI to the manual checklist.* The health-adjacent arithmetic is
exactly what should not rest on a manual once-over.

**D4 — Prefs key version.** Moving to `mise:prefs:v2:<user.id>` with a seed from the legacy
key (§3) rather than keeping `v1` and layering the account id on. *Recommendation: as
specified* — the shape changes, so the version should.
