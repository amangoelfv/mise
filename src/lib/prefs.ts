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
  let raw: string | null;
  try {
    raw = localStorage.getItem(activeKey);
  } catch {
    return current;
  }
  // No record for this account yet: adopt the old device-global one, but still ask the
  // profile questions. Written through immediately so later reads take the normal path.
  if (raw === null) {
    let legacy: string | null = null;
    try {
      legacy = localStorage.getItem(LEGACY_KEY);
    } catch {
      legacy = null;
    }
    if (legacy !== null) {
      current = { ...coercePrefs(parse(legacy)), profileStatus: "unset" };
      lastRaw = JSON.stringify(current);
      try {
        localStorage.setItem(activeKey, lastRaw);
      } catch {
        // Storage went away between the read and the write; keep the seed in memory.
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
  if (activeKey) {
    try {
      lastRaw = JSON.stringify(current);
      localStorage.setItem(activeKey, lastRaw);
    } catch {
      // Storage unavailable (private mode): keep prefs in memory for this tab.
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
