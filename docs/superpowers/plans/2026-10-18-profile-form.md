# First-Run Profile Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ask a signed-in user five questions once per device, before their first set of recipe suggestions, and use the answers to tune the Gemini prompts and the Zepto cart request.

**Architecture:** Prefs move from one device-global `localStorage` record to one record per Google account (`mise:prefs:v2:<user.id>`), gaining age band, weight, height, budget and a `profileStatus` that makes the prompt fire exactly once. The form is a `Dialog` over the existing `styles` stage with `fetchVariants` deferred until it resolves, which leaves the flow's history machinery untouched. Budget reaches both Gemini prompts and, as a new optional contract field, the cart service; body metrics never leave the device.

**Tech Stack:** Next.js 16.4.2 (App Router), React 19.3, TypeScript strict, Tailwind v4, `@google/genai`, `node:test` for unit tests.

**Spec:** `docs/superpowers/specs/2026-10-18-profile-form-design.md`

## Global Constraints

- `AGENTS.md`: this is **not** the Next.js in your training data. Read the relevant guide under `node_modules/next/dist/docs/` before writing code — here `01-app/03-api-reference/01-directives` and the client-component pages of `01-app/01-getting-started`.
- `CONTRACT_VERSION` stays `"1.0"`. `CONTRACT.md:45` defines the policy: bumped on breaking changes only, and an optional field is not one.
- `src/lib/contract.ts` must keep **zero imports** — its header says it is copied as-is into the cart service. New wire types go in that file.
- No database, no server-side persistence. All profile state is `localStorage`.
- `weightKg`, `heightCm` and `ageBand` **never** appear in `CartRequest`. Only the derived `proteinTargetG` reaches Gemini; the raw values stay on the device.
- Per-task gate is `npx tsc --noEmit -p tsconfig.json` (fast). `npm run lint` and `npm run build` run at the end of each task that touches components or routes.
- Copy: en-IN tone, no emoji, matching the existing voice in `settings-view.tsx`.
- If `next dev` re-adds the agent block to `AGENTS.md`, commit it with the work rather than reverting it.

## Review Focus

Five conditions the spec implies that no task's happy path exercises. Each has a test or check attached to the task that owns the code.

1. **Weight outside a human range** (`0`, negative, `900`, non-numeric) must never yield `NaN` or an absurd protein target — Task 1.
2. **A stored record with a type-wrong value** (`ageBand: "middle"` from a hand-edited or older payload) must not reach `PROTEIN_G_PER_KG` as an unknown key. `read()` today does an unvalidated `{...DEFAULT_PREFS, ...JSON.parse(raw)}` spread, so this is a real hole — Task 3.
3. **Dialog dismissed by Escape, backdrop or the X button** must still run `fetchVariants`, or the styles screen sits on its loader forever — Task 7.
4. **Prefs read before `setPrefsUser`, or just after an account switch** must serve defaults or the correct record, never the previous account's data — Task 3.
5. **`best_price` must not collapse the four style cards** toward `basic`, which is already described to Gemini as budget-friendly — Task 5.

### Deliberate refinements to the spec

- The spec put `proteinTargetG` in `prefs.ts` taking a whole `Prefs`. This plan puts it in a new `src/lib/nutrition.ts` taking `(ageBand, weightKg)`. It is then a pure function with no dependency on the client-side store, so it is unit-testable without stubbing `localStorage`, and `prefs.ts` stays a storage module.
- Spec §5 says the style cards *can* show protein against the target without committing to it. Task 8 commits to it. Without it, age/weight/height change nothing a user can see.

---

### Task 1: Nutrition module and the test path

**Files:**
- Modify: `tsconfig.json` (add `allowImportingTsExtensions: true`)
- Modify: `package.json` (add `"test": "node --test src/lib/*.test.ts"`)
- Create: `src/lib/nutrition.ts`
- Test: `src/lib/nutrition.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `AgeBand`, `AGE_BANDS`, `PROTEIN_G_PER_KG`, `WEIGHT_KG`, `HEIGHT_CM`, `proteinTargetG(ageBand, weightKg)`, `mealProteinShareG(target)`.

Node v24.21.0 strips TypeScript natively, so no runner is installed. Node's ESM resolver needs the `.ts` extension in import specifiers and `tsc` rejects it without `allowImportingTsExtensions`; that flag requires `noEmit`, which this project already sets. All three commands were verified clean with it during planning.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/nutrition.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { proteinTargetG, mealProteinShareG, PROTEIN_G_PER_KG } from "./nutrition.ts";

test("scales with weight by age band", () => {
  assert.equal(proteinTargetG("adult", 70), 60);    // 70 * 0.85
  assert.equal(proteinTargetG("under20", 70), 70);  // 70 * 1.0
  assert.equal(proteinTargetG("senior", 70), 77);   // 70 * 1.1
});

test("returns null when either input is missing", () => {
  assert.equal(proteinTargetG(null, 70), null);
  assert.equal(proteinTargetG("adult", null), null);
  assert.equal(proteinTargetG(null, null), null);
});

// Review Focus 1
test("never returns NaN or an absurd target for out-of-range weight", () => {
  assert.equal(proteinTargetG("adult", 0), null);
  assert.equal(proteinTargetG("adult", -5), null);
  assert.equal(proteinTargetG("adult", Number.NaN), null);
  assert.equal(proteinTargetG("adult", 900), proteinTargetG("adult", 250)); // clamped to max
  assert.equal(proteinTargetG("adult", 10), proteinTargetG("adult", 25));   // clamped to min
});

test("senior factor exceeds adult, reflecting age-related muscle loss", () => {
  assert.ok(PROTEIN_G_PER_KG.senior > PROTEIN_G_PER_KG.adult);
  assert.ok(PROTEIN_G_PER_KG.under20 > PROTEIN_G_PER_KG.adult);
});

test("meal share is a third of the daily target", () => {
  assert.equal(mealProteinShareG(60), 20);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx tsc --noEmit -p tsconfig.json` first — expect `TS5097` on the `.ts` import until the flag is added. Then `npm test`.
Expected: FAIL with a module-not-found error for `./nutrition.ts`.

- [ ] **Step 3: Add the flag and the script, then implement `src/lib/nutrition.ts`**

Exact values the spec pins — `under20: 1.0`, `adult: 0.85`, `senior: 1.1`:

```ts
export type AgeBand = "under20" | "adult" | "senior";
export const AGE_BANDS = ["under20", "adult", "senior"] as const;
export const PROTEIN_G_PER_KG: Record<AgeBand, number> = { under20: 1.0, adult: 0.85, senior: 1.1 };
export const WEIGHT_KG = { min: 25, max: 250 } as const;
export const HEIGHT_CM = { min: 90, max: 230 } as const;
export function proteinTargetG(ageBand: AgeBand | null, weightKg: number | null): number | null;
export function mealProteinShareG(target: number): number;
```

`proteinTargetG` returns `null` for a missing band, and for a weight that is not a finite number greater than zero; it clamps a finite positive weight into `WEIGHT_KG` before multiplying, then rounds.

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test`
Expected: PASS, 6/6.

- [ ] **Step 5: Verify the flag broke nothing**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint && npm run build`
Expected: all three clean.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json package.json src/lib/nutrition.ts src/lib/nutrition.test.ts
git commit -m "feat: protein target derivation with node:test unit tests"
```

---

### Task 2: Contract field and validation vocabulary

**Files:**
- Modify: `src/lib/contract.ts`
- Modify: `src/lib/http.ts`
- Modify: `CONTRACT.md`

**Interfaces:**
- Consumes: nothing.
- Produces: `BudgetPreference` from `contract.ts`; `BUDGETS` from `http.ts`.

- [ ] **Step 1: Add the type and field to `src/lib/contract.ts`**

```ts
export type BudgetPreference = "best_rated" | "best_price";
```

`CartRequest.preferences` becomes `{ diet: Diet; avoid: string[]; budget?: BudgetPreference }`. The field is optional with a doc comment stating that absent means `best_rated`. Keep `CONTRACT_VERSION` at `"1.0"` and add no imports to this file.

- [ ] **Step 2: Add the validation tuple to `src/lib/http.ts`**

```ts
export const BUDGETS = ["best_rated", "best_price"] as const;
```

Placed beside the existing `DIETS` / `STYLES` / `UNITS` / `CATEGORIES` tuples and following their style.

- [ ] **Step 3: Document it in `CONTRACT.md`**

Add a `preferences.budget` row to the `CartRequest` table, stating it is optional and that absent means `best_rated`. Add one sentence on what the cart service should do with each value: `best_rated` ranks candidate products by rating, `best_price` by lowest price for an acceptable pack. Update the example payloads to include the field. Leave every `"1.0"` in the document as it is, and add a line under the `version` row's table noting that `preferences.budget` was added additively without a version bump.

- [ ] **Step 4: Verify the version did not move**

Run: `grep -n 'CONTRACT_VERSION = ' src/lib/contract.ts && npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: the grep shows `"1.0"`; tsc and lint clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/contract.ts src/lib/http.ts CONTRACT.md
git commit -m "feat: optional preferences.budget in the cart contract"
```

---

### Task 3: Per-account prefs store

**Files:**
- Modify: `src/lib/prefs.ts`
- Test: `src/lib/prefs.test.ts`

**Interfaces:**
- Consumes: `AgeBand`, `AGE_BANDS`, `WEIGHT_KG`, `HEIGHT_CM` from `./nutrition.ts`; `BudgetPreference` from `./contract.ts`.
- Produces: the extended `Prefs` and `DEFAULT_PREFS`; `ProfileStatus`; `setPrefsUser(userId: string): void`; `coercePrefs(raw: unknown): Prefs`; unchanged `getPrefs`, `updatePrefs`, `usePrefs`, `avoidList`.

`prefs.ts` stays a module singleton read through `useSyncExternalStore` — `getPrefs()` is called from inside async handlers in `flow.tsx` and must keep working, so do **not** convert it to React context.

- [ ] **Step 1: Write the failing test**

The test stubs `globalThis.localStorage` with a minimal in-memory `Storage` before importing the module; `prefs.ts` only touches `localStorage` inside functions, so a lazy stub is enough, and nothing under test touches `window`.

```ts
// src/lib/prefs.test.ts — assertions, not full bodies
test("stores under a per-account key");                      // mise:prefs:v2:google:123
test("writes for one account are invisible to another");     // Review Focus 4
test("serves DEFAULT_PREFS before setPrefsUser is called");  // Review Focus 4
test("seeds from the legacy mise:prefs:v1 record");          // diet/servings carried over...
test("legacy seed leaves profileStatus unset");              // ...but the person is still asked
test("legacy key is left in place after seeding");
test("corrupt JSON falls back to DEFAULT_PREFS");            // Review Focus 2
test("an unknown ageBand is replaced with null");            // Review Focus 2
test("an unknown budget is replaced with best_rated");       // Review Focus 2
test("a string weightKg is replaced with null");              // Review Focus 2
test("updatePrefs merges and persists under the active key");
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL — `setPrefsUser` and `coercePrefs` are not exported.

- [ ] **Step 3: Implement the changes in `src/lib/prefs.ts`**

```ts
export type ProfileStatus = "unset" | "saved" | "skipped";

export interface Prefs {
  servings: number; diet: Diet; avoid: string; skipStaples: boolean; pincode: string;
  ageBand: AgeBand | null; weightKg: number | null; heightCm: number | null;
  budget: BudgetPreference; profileStatus: ProfileStatus;
}

export const KEY_PREFIX = "mise:prefs:v2:";
export const LEGACY_KEY = "mise:prefs:v1";
export function setPrefsUser(userId: string): void;
export function coercePrefs(raw: unknown): Prefs;
```

`DEFAULT_PREFS` adds `ageBand: null, weightKg: null, heightCm: null, budget: "best_rated", profileStatus: "unset"`. The three body fields are `null`, not numbers, so "not answered" stays distinguishable from an answer.

`setPrefsUser` sets the active key to `KEY_PREFIX + userId`, clears the `lastRaw`/`current` cache so the next `read()` reloads, and notifies listeners. It is idempotent, so calling it during render is safe; when the key is unchanged it returns without notifying.

**Replace the unvalidated spread in `read()` with `coercePrefs`.** This is the Review Focus 2 fix: `coercePrefs` validates each field rather than trusting stored JSON — `ageBand` against `AGE_BANDS` else `null`, `budget` against the two values else `best_rated`, `profileStatus` against the three values else `"unset"`, `weightKg`/`heightCm` as finite numbers inside `WEIGHT_KG`/`HEIGHT_CM` else `null`, and the existing fields as they are already defaulted.

Before the active key is set, `read()` returns `DEFAULT_PREFS` without touching storage.

Legacy migration: on a read where the active key holds nothing but `LEGACY_KEY` does, seed from the legacy record through `coercePrefs` and force `profileStatus` to `"unset"`. Leave the legacy key in place.

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test`
Expected: PASS, all tests across both files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/prefs.ts src/lib/prefs.test.ts
git commit -m "feat: scope prefs per account and validate stored records"
```

---

### Task 4: Wire the account id into the two prefs consumers

**Files:**
- Modify: `src/app/(app)/app/page.tsx`
- Modify: `src/app/(app)/settings/page.tsx`
- Modify: `src/components/flow/flow.tsx`
- Modify: `src/components/settings-view.tsx`

**Interfaces:**
- Consumes: `setPrefsUser` from `@/lib/prefs`.
- Produces: `Flow` gains a `userId: string` prop; `SettingsView`'s existing `user` object gains `id: string`.

The two components take the id differently, following the props each already has:

- `Flow` takes a flat `firstName` string, so it gains a sibling `userId: string` prop. `app/page.tsx` already holds `user` and passes `userId={user.id}`.
- `SettingsView` already takes a `user` object (`{ name, email, picture, demo }`), so that object gains `id` and `settings/page.tsx` adds `id: user.id` to the literal it builds. No new prop.

Each component calls `setPrefsUser(...)` at the top of its body, before any `usePrefs()` read.

- [ ] **Step 1: Pass the id from both server pages**

- [ ] **Step 2: Call `setPrefsUser` in both client components**

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint && npm run build`
Expected: all clean.

- [ ] **Step 4: Verify the key scoping by hand**

Run `npm run dev`, sign in, open Settings, change Default servings, and in devtools confirm the value landed under `mise:prefs:v2:google:<sub>` and **not** under `mise:prefs:v1`. If a `mise:prefs:v1` record exists from before, confirm its `diet` and `servings` were carried into the new key.
Expected: the per-account key holds the change; the legacy key is untouched.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/app/page.tsx" "src/app/(app)/settings/page.tsx" src/components/flow/flow.tsx src/components/settings-view.tsx
git commit -m "feat: point the prefs store at the signed-in account"
```

---

### Task 5: Budget and protein target in the Gemini prompts

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/gemini.ts`
- Modify: `src/app/api/dish/variants/route.ts`
- Modify: `src/app/api/dish/ingredients/route.ts`
- Modify: `src/components/flow/flow.tsx` (the two request bodies)

**Interfaces:**
- Consumes: `BudgetPreference` from `./contract`; `BUDGETS` and `oneOf` from `./http`; `proteinTargetG` from `./nutrition`.
- Produces: `VariantsInput` gains `budget: BudgetPreference` and `proteinTargetG: number | null`; `IngredientsInput` gains `budget: BudgetPreference`; `BUDGET_RULES` in `gemini.ts`.

- [ ] **Step 1: Extend the input types in `src/lib/types.ts`**

`VariantsInput` gains both fields; `IngredientsInput` gains `budget` only. The ingredient list is already constrained by the chosen variant, so the target adds nothing there.

- [ ] **Step 2: Add `BUDGET_RULES` and the prompt lines in `src/lib/gemini.ts`**

Exact copy, beside the existing `DIET_RULES`:

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

In `getVariants`, add the budget line after the diet line, and — **Review Focus 5** — an explicit instruction that the four styles must stay clearly distinct from one another regardless of this preference. `basic` is already described to Gemini as budget-friendly in `src/lib/styles.ts`, so without that instruction `best_price` pulls all four cards toward it and flattens the only screen where Mise shows range. When `proteinTargetG` is non-null, add one line giving the daily target and asking for realistic per-serving protein against it; add nothing when it is null.

In `getIngredients`, add the same budget line after the diet line. It should bias `searchQuery` specificity and `estimatedPriceInr` toward the chosen tier.

- [ ] **Step 3: Validate and forward in both routes**

Each route reads `budget` with `oneOf(body.budget, BUDGETS, "best_rated")`, matching how `diet` is already handled with `DIETS`. The variants route also reads `proteinTargetG` with `num(...)` clamped to a sane range, passing `null` when absent.

- [ ] **Step 4: Send the fields from the client**

Nothing reaches the routes until `flow.tsx` sends it, and without this step the check in Step 6 cannot be run at all.

In `fetchVariants`, the `/api/dish/variants` body gains `budget: prefs.budget` and `proteinTargetG: proteinTargetG(prefs.ageBand, prefs.weightKg)` — the derived number only, never the raw weight or age band. In `chooseStyle`, the `/api/dish/ingredients` body gains `budget: prefs.budget`. Both already call `getPrefs()` and already pass `diet` and `avoid`, so the fields go beside those.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint && npm run build`
Expected: all clean.

- [ ] **Step 6: Check the four styles stay distinct (Review Focus 5)**

With `GEMINI_API_KEY` set, request the same dish twice — once with `budget: "best_price"`, once with `"best_rated"` — and compare the four cards.
Expected: ingredient tiers differ between the two runs, but within each run `restaurant` is still visibly richer than `basic`, `healthy` and `protein` still read as themselves, and no two cards have collapsed into near-duplicates. If they have, strengthen the distinctness instruction before moving on.

- [ ] **Step 7: Commit**

```bash
git add src/lib/types.ts src/lib/gemini.ts src/app/api/dish/variants/route.ts src/app/api/dish/ingredients/route.ts src/components/flow/flow.tsx
git commit -m "feat: budget and protein target in the Gemini prompts"
```

---

### Task 6: The profile dialog

**Files:**
- Create: `src/components/flow/profile-dialog.tsx`
- Modify: `src/components/dialog.tsx`

**Interfaces:**
- Consumes: `Dialog`; `updatePrefs`, `getPrefs` from `@/lib/prefs`; `AGE_BANDS`, `WEIGHT_KG`, `HEIGHT_CM` from `@/lib/nutrition`.
- Produces: `ProfileDialog({ open, onDone }: { open: boolean; onDone: () => void })`.

`ProfileDialog` owns its draft state, persists through `updatePrefs` and then calls `onDone()`. Both outcomes persist before calling it: Continue writes the answers with `profileStatus: "saved"`, every dismissal path writes `profileStatus: "skipped"` and nothing else. The caller therefore has one callback and no branching.

- [ ] **Step 1: Add the focus opt-out to `src/components/dialog.tsx`**

`Dialog` gains `focusFirstField?: boolean`, defaulting to `true` so the Zepto and payload dialogs are unaffected. When `false`, skip the `dialog.querySelector("input, textarea, select")?.focus()` line at `src/components/dialog.tsx:28`.

This exists for one reason: in this form the first `input` is the weight field, so the current behaviour pops the mobile keyboard over a set of questions meant to be tapped.

- [ ] **Step 2: Build the form**

One screen, five questions, nothing required, `focusFirstField={false}`:

| Question | Control | Reuse |
| --- | --- | --- |
| Age | three chips: `Under 20` / `20–50` / `50+` → `AgeBand` | the `role="radiogroup"` chip pattern from `settings-view.tsx` |
| Weight, height | two short numeric inputs, `kg` and `cm`, both optional | the pincode input's styling |
| Diet | the five existing chips, same labels | lift `DIETS` from `settings-view.tsx` |
| Skip pantry staples | toggle, defaulting on | the existing `role="switch"` |
| Budget | two chips: `Best rated` / `Best price` | same chip pattern |

Two actions: **Continue** (`btn-accent`) and **Skip (use defaults)** (`btn-ghost`) — visible and equal-weight, not a hidden link. Plus one quiet line stating the protein figure is a rough general guide, not nutritional advice, per spec §5.

To avoid two sources of truth for the diet chips, export `DIETS` from `settings-view.tsx` or move it to a shared module and import it in both; do not copy the array.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint && npm run build`
Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/flow/profile-dialog.tsx src/components/dialog.tsx
git commit -m "feat: first-run profile dialog"
```

---

### Task 7: Gate the first dish on the dialog

**Files:**
- Modify: `src/components/flow/flow.tsx`

**Interfaces:**
- Consumes: `ProfileDialog`; `getPrefs` from `@/lib/prefs`.
- Produces: no new exports.

Do **not** add a `profile` stage. `ORDER` at `src/components/flow/flow.tsx:35` relies on a stage's index equalling its distance from the `ask` entry — `startOver()` does `history.go(-ORDER[stage])` — and a stage that exists only on first run makes those indices conditional. The dialog renders over the `styles` stage instead, and the history machinery is untouched.

- [ ] **Step 1: Add the gate**

A `profileOpen` state plus a `pendingDish` ref. In `askDish`, after the existing stage transition to `styles`, branch on `getPrefs().profileStatus === "unset"`: if so, store the dish in the ref and open the dialog **instead of** calling `fetchVariants`; otherwise call it as today. The styles screen behind shows its normal loading state, which it already renders when `variants` is null.

Apply the same gate in `boot()`, which calls `fetchVariants(initialQuery)` directly on the `?q=` path.

`onDone` closes the dialog and calls `fetchVariants(pendingDish.current)`.

- [ ] **Step 2: Add `budget` to the cart request**

`cartBody()` reads `budget` from `getPrefs()` and sets it on the returned `CartBody`; `CartBody` in `src/lib/types.ts` gains the field. `src/app/api/cart/route.ts` populates `preferences.budget` with `oneOf(body.budget, BUDGETS, "best_rated")` beside the existing `diet` and `avoid`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint && npm run build`
Expected: all clean.

- [ ] **Step 4: Check every dismissal path still loads the cards (Review Focus 3)**

With `localStorage` cleared, run each of these and confirm the four cards still arrive:

| Path | Expectation |
| --- | --- |
| Continue | answers saved, cards load |
| Skip | defaults kept, cards load, `profileStatus` is `skipped` |
| Escape | as Skip |
| Backdrop click | as Skip |
| X button | as Skip |

All five dismissals route through `Dialog`'s single `onClose`, so one handler covers them — but if any path fails to call `fetchVariants`, the styles screen sits on its loader forever. Check all five.

- [ ] **Step 5: Commit**

```bash
git add src/components/flow/flow.tsx src/lib/types.ts src/app/api/cart/route.ts
git commit -m "feat: ask the profile questions before the first suggestions"
```

---

### Task 8: Settings rows and protein on the style cards

**Files:**
- Modify: `src/components/settings-view.tsx`
- Modify: `src/components/flow/style-picker.tsx`

**Interfaces:**
- Consumes: `proteinTargetG`, `mealProteinShareG`, `AGE_BANDS` from `@/lib/nutrition`; `usePrefs`, `updatePrefs`.
- Produces: no new exports.

- [ ] **Step 1: Add the rows to the Kitchen section of Settings**

Four additions, following the existing `Row` and chip-group patterns in that file: age band chips, weight and height numeric inputs, and budget chips. Diet and Skip-pantry-staples rows already exist and stay as they are. When a protein target can be derived, show it as a read-only hint under the weight row.

Update the Kitchen section hint and the page subtitle, which both currently say prefs are "saved on this device" — they are now saved on this device **for this account**.

- [ ] **Step 2: Show protein against the target on the cards**

`src/components/flow/style-picker.tsx` already renders `{variant.proteinGrams} g protein` in the mono metadata row. When a target is known, render it as `{variant.proteinGrams} / {share} g protein` where `share = mealProteinShareG(target)`, colouring the figure with the existing `text-herb` when the take meets the share. When no target is known, leave the row exactly as it is today.

Extend the footer line "Estimates per serving." to explain the comparison only when a target is shown.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint && npm run build`
Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/settings-view.tsx src/components/flow/style-picker.tsx
git commit -m "feat: profile rows in settings and protein against target on the cards"
```

---

### Task 9: Full verification pass

**Files:** none — this task only runs checks and fixes what they turn up.

- [ ] **Step 1: Automated gates**

Run: `npm test && npx tsc --noEmit -p tsconfig.json && npm run lint && npm run build`
Expected: all four clean.

- [ ] **Step 2: Work the spec §9 manual checklist**

Signed in, `localStorage` cleared before each run:

- first dish prompts; Continue saves and the four cards appear
- first dish prompts; Skip proceeds on defaults and the cards still appear
- Continue with nothing filled in proceeds on defaults and records `saved`, not `skipped`
- a second dish in the same session does **not** prompt
- a reload does **not** prompt
- signing in as a second account on the same device **does** prompt
- Settings shows the saved values and editing them persists across a reload
- the payload viewer on the ingredients screen shows `preferences.budget`
- on a mobile viewport the dialog opens without the keyboard covering it

- [ ] **Step 3: Check the contract change against the simulated cart**

With `CART_API_URL` unset, build a cart and open the payload viewer.
Expected: `preferences.budget` present, `version` still `"1.0"`, and no `weightKg`, `heightCm` or `ageBand` anywhere in the payload.

- [ ] **Step 4: Commit any fixes, then hand back**

Report what passed, what needed fixing, and anything the checklist could not cover.
