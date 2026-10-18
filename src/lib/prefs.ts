"use client";

import { useSyncExternalStore } from "react";
import { BUDGET_PREFERENCES, DIET_VALUES, type BudgetPreference, type Diet } from "./contract";
import { AGE_BANDS, HEIGHT_CM, WEIGHT_KG, type AgeBand } from "./nutrition";

export type ProfileStatus = "unset" | "saved" | "skipped";
const PROFILE_STATUSES = ["unset", "saved", "skipped"] as const;

export interface Prefs {
  servings: number;
  diet: Diet;
  /** Comma-separated allergies / dislikes. */
  avoid: string;
  skipStaples: boolean;
  pincode: string;
  /** Delivery details, remembered on this device for the order step. */
  name: string;
  phone: string;
  address: string;
  landmark: string;
  /** Null means "not answered". Never derive a protein target from a number nobody gave us. */
  ageBand: AgeBand | null;
  weightKg: number | null;
  heightCm: number | null;
  budget: BudgetPreference;
  /** "saved" and "skipped" are both terminal: the first-run form is offered once per account. */
  profileStatus: ProfileStatus;
}

export const DEFAULT_PREFS: Prefs = {
  servings: 2,
  diet: "any",
  avoid: "",
  skipStaples: true,
  pincode: "",
  name: "",
  phone: "",
  address: "",
  landmark: "",
  ageBand: null,
  weightKg: null,
  heightCm: null,
  budget: "best_rated",
  profileStatus: "unset",
};

/** One record per Google account. The previous device-global record is seeded in once. */
export const KEY_PREFIX = "mise:prefs:v2:";
export const LEGACY_KEY = "mise:prefs:v1";

const listeners = new Set<() => void>();
/**
 * Accounts whose legacy migration has already been attempted. Keyed on the attempt, not on the
 * write succeeding: if setItem throws (quota), re-entering the branch would hand read() a new
 * object on every call — read() is getSnapshot, so that is a render loop — and would keep
 * forcing profileStatus back to "unset", stranding the first-run dialog.
 */
const seedAttempted = new Set<string>();
/** Cleared the first time a write is refused (private mode, quota): memory becomes the truth. */
let storageWritable = true;
let activeKey: string | null = null;
let lastRaw: string | null = null;
let current: Prefs = DEFAULT_PREFS;

const pick = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback;

const pickOrNull = <T extends string>(v: unknown, options: readonly T[]): T | null =>
  options.includes(v as T) ? (v as T) : null;

const inRange = (v: unknown, range: { min: number; max: number }): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= range.min && v <= range.max ? v : null;

/**
 * Stored JSON is untrusted — it may predate a field, or have been hand-edited in devtools.
 * Validating here keeps an unknown ageBand or diet from reaching the Gemini prompts as a
 * lookup that resolves to undefined.
 */
export function coercePrefs(raw: unknown): Prefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const servings = inRange(r.servings, { min: 1, max: 12 });
  return {
    servings: servings === null ? DEFAULT_PREFS.servings : Math.round(servings),
    diet: pick(r.diet, DIET_VALUES, DEFAULT_PREFS.diet),
    avoid: typeof r.avoid === "string" ? r.avoid.slice(0, 200) : DEFAULT_PREFS.avoid,
    skipStaples: typeof r.skipStaples === "boolean" ? r.skipStaples : DEFAULT_PREFS.skipStaples,
    pincode: typeof r.pincode === "string" ? r.pincode.replace(/\D/g, "").slice(0, 6) : DEFAULT_PREFS.pincode,
    name: typeof r.name === "string" ? r.name.slice(0, 60) : DEFAULT_PREFS.name,
    phone: typeof r.phone === "string" ? r.phone.slice(0, 20) : DEFAULT_PREFS.phone,
    address: typeof r.address === "string" ? r.address.slice(0, 200) : DEFAULT_PREFS.address,
    landmark: typeof r.landmark === "string" ? r.landmark.slice(0, 120) : DEFAULT_PREFS.landmark,
    ageBand: pickOrNull(r.ageBand, AGE_BANDS),
    weightKg: inRange(r.weightKg, WEIGHT_KG),
    heightCm: inRange(r.heightCm, HEIGHT_CM),
    budget: pick(r.budget, BUDGET_PREFERENCES, DEFAULT_PREFS.budget),
    profileStatus: pick(r.profileStatus, PROFILE_STATUSES, DEFAULT_PREFS.profileStatus),
  };
}

const parse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

/**
 * Points the store at one account's record. Call it during render, before reading prefs:
 * it deliberately does not notify listeners, because the component that calls it is the one
 * that reads prefs, and notifying mid-render is not safe.
 */
export function setPrefsUser(userId: string) {
  const key = KEY_PREFIX + userId;
  if (key === activeKey) return;
  activeKey = key;
  lastRaw = null;
  current = DEFAULT_PREFS;
}

/** Current prefs, read at call time (safe inside async handlers and effects). */
export function getPrefs(): Prefs {
  return read();
}

function read(): Prefs {
  if (!activeKey) return DEFAULT_PREFS;
  // Storage refused a write earlier, so it no longer reflects what the person chose.
  if (!storageWritable) return current;
  let raw: string | null;
  try {
    raw = localStorage.getItem(activeKey);
  } catch {
    return current;
  }
  // No record for this account yet: adopt the old device-global one, but still ask the
  // profile questions. Written through immediately so later reads take the normal path.
  if (raw === null && !seedAttempted.has(activeKey)) {
    seedAttempted.add(activeKey);
    let legacy: string | null = null;
    try {
      legacy = localStorage.getItem(LEGACY_KEY);
    } catch {
      legacy = null;
    }
    if (legacy !== null) {
      current = { ...coercePrefs(parse(legacy)), profileStatus: "unset" };
      const next = JSON.stringify(current);
      try {
        localStorage.setItem(activeKey, next);
        lastRaw = next;
      } catch {
        // Storage went away between the read and the write; keep the seed in memory.
        storageWritable = false;
      }
      return current;
    }
  }
  if (raw === lastRaw) return current;
  lastRaw = raw;
  current = coercePrefs(raw === null ? {} : parse(raw));
  return current;
}

export function updatePrefs(patch: Partial<Prefs>) {
  current = { ...read(), ...patch };
  if (activeKey && storageWritable) {
    const next = JSON.stringify(current);
    try {
      localStorage.setItem(activeKey, next);
      // Only mirror what actually landed, so a later read can trust the comparison.
      lastRaw = next;
    } catch {
      // Storage unavailable (private mode): keep prefs in memory for this tab.
      storageWritable = false;
    }
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => (e.key === activeKey || e.key === null) && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_PREFS);
}

export const avoidList = (prefs: Prefs) =>
  prefs.avoid
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
