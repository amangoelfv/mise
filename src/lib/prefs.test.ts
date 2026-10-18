import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * prefs.ts keeps module-level state, so each test gets a fresh instance through a
 * cache-busted import rather than a reset hook in production code.
 */
let instance = 0;
async function freshPrefs(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed));
  const stub = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  (globalThis as { localStorage?: unknown }).localStorage = stub;
  const mod = await import(`./prefs.ts?t=${++instance}`);
  return { ...mod, store } as typeof import("./prefs.ts") & { store: Map<string, string> };
}

const KEY_A = "mise:prefs:v2:google:aaa";
const LEGACY = "mise:prefs:v1";

test("stores under a per-account key", async () => {
  const p = await freshPrefs();
  p.setPrefsUser("google:aaa");
  p.updatePrefs({ servings: 4 });
  assert.equal(JSON.parse(p.store.get(KEY_A)!).servings, 4);
});

// Review Focus 4
test("writes for one account are invisible to another", async () => {
  const p = await freshPrefs();
  p.setPrefsUser("google:aaa");
  p.updatePrefs({ servings: 5, diet: "jain" });
  p.setPrefsUser("google:bbb");
  assert.equal(p.getPrefs().servings, p.DEFAULT_PREFS.servings);
  assert.equal(p.getPrefs().diet, p.DEFAULT_PREFS.diet);
});

// Review Focus 4
test("serves DEFAULT_PREFS before setPrefsUser is called", async () => {
  const p = await freshPrefs({ [KEY_A]: JSON.stringify({ servings: 9 }) });
  // Defaults while no account is active, even though a record for one exists...
  assert.deepEqual(p.getPrefs(), p.DEFAULT_PREFS);
  // ...and that same record becomes readable once the account is named.
  p.setPrefsUser("google:aaa");
  assert.equal(p.getPrefs().servings, 9);
});

test("seeds from the legacy mise:prefs:v1 record", async () => {
  const p = await freshPrefs({ [LEGACY]: JSON.stringify({ servings: 6, diet: "jain", pincode: "560001" }) });
  p.setPrefsUser("google:aaa");
  assert.equal(p.getPrefs().servings, 6);
  assert.equal(p.getPrefs().diet, "jain");
  assert.equal(p.getPrefs().pincode, "560001");
});

test("legacy seed leaves profileStatus unset", async () => {
  const p = await freshPrefs({ [LEGACY]: JSON.stringify({ servings: 6, profileStatus: "saved" }) });
  p.setPrefsUser("google:aaa");
  assert.equal(p.getPrefs().profileStatus, "unset");
});

test("legacy key is left in place after seeding", async () => {
  const p = await freshPrefs({ [LEGACY]: JSON.stringify({ servings: 6 }) });
  p.setPrefsUser("google:aaa");
  p.updatePrefs({ servings: 7 });
  assert.ok(p.store.has(LEGACY));
  assert.equal(JSON.parse(p.store.get(LEGACY)!).servings, 6);
});

// Review Focus 2
test("corrupt JSON falls back to DEFAULT_PREFS", async () => {
  const p = await freshPrefs({ [KEY_A]: "{not json" });
  p.setPrefsUser("google:aaa");
  assert.deepEqual(p.getPrefs(), p.DEFAULT_PREFS);
});

// Review Focus 2
test("an unknown ageBand is replaced with null", async () => {
  const p = await freshPrefs({ [KEY_A]: JSON.stringify({ ageBand: "middle" }) });
  p.setPrefsUser("google:aaa");
  assert.equal(p.getPrefs().ageBand, null);
});

// Review Focus 2
test("an unknown budget is replaced with best_rated", async () => {
  const p = await freshPrefs({ [KEY_A]: JSON.stringify({ budget: "cheapest" }) });
  p.setPrefsUser("google:aaa");
  assert.equal(p.getPrefs().budget, "best_rated");
});

// Review Focus 2
test("a string weightKg is replaced with null", async () => {
  const p = await freshPrefs({ [KEY_A]: JSON.stringify({ weightKg: "70" }) });
  p.setPrefsUser("google:aaa");
  assert.equal(p.getPrefs().weightKg, null);
});

// Review Focus 2
test("an out-of-range weightKg is replaced with null", async () => {
  const p = await freshPrefs({ [KEY_A]: JSON.stringify({ weightKg: 900, heightCm: 5 }) });
  p.setPrefsUser("google:aaa");
  assert.equal(p.getPrefs().weightKg, null);
  assert.equal(p.getPrefs().heightCm, null);
});

// Review Focus 2
test("an unknown profileStatus is replaced with unset", async () => {
  const p = await freshPrefs({ [KEY_A]: JSON.stringify({ profileStatus: "maybe" }) });
  p.setPrefsUser("google:aaa");
  assert.equal(p.getPrefs().profileStatus, "unset");
});

test("updatePrefs merges and persists under the active key", async () => {
  const p = await freshPrefs();
  p.setPrefsUser("google:aaa");
  p.updatePrefs({ ageBand: "senior", weightKg: 64 });
  p.updatePrefs({ profileStatus: "saved" });
  const stored = JSON.parse(p.store.get(KEY_A)!);
  assert.equal(stored.ageBand, "senior");
  assert.equal(stored.weightKg, 64);
  assert.equal(stored.profileStatus, "saved");
});

test("a valid stored profile round-trips", async () => {
  const p = await freshPrefs({
    [KEY_A]: JSON.stringify({ ageBand: "under20", weightKg: 55, heightCm: 165, budget: "best_price", profileStatus: "saved" }),
  });
  p.setPrefsUser("google:aaa");
  assert.deepEqual(
    { ...p.getPrefs() },
    { ...p.DEFAULT_PREFS, ageBand: "under20", weightKg: 55, heightCm: 165, budget: "best_price", profileStatus: "saved" },
  );
});

// Review Focus 2 — a bogus diet would reach gemini.ts's DIET_RULES as an unknown key
test("an unknown diet is replaced with any", async () => {
  const p = await freshPrefs({ [KEY_A]: JSON.stringify({ diet: "pescatarian-ish" }) });
  p.setPrefsUser("google:aaa");
  assert.equal(p.getPrefs().diet, "any");
});
