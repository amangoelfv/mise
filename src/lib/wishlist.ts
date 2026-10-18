"use client";

import { useSyncExternalStore } from "react";
import type { DishStyleId } from "./contract";
import { DISH_STYLES } from "./styles";

/** A dish the user saved from the ingredients screen, to cook again or slot into the week. */
export interface SavedDish {
  id: string;
  dish: string;
  style: DishStyleId;
  variantTitle: string;
  cuisine?: string;
  savedAt: string;
}

export type Meal = "breakfast" | "lunch" | "dinner";
export const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];
export const MEAL_LABELS: Record<Meal, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
/** Column order of the weekly calendar: index 0..6 = Mon..Sun. */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export interface PlanState {
  saved: SavedDish[];
  /** `"${dayIndex}:${meal}"` -> a SavedDish id. A missing key is an empty slot. */
  slots: Record<string, string | null>;
}

/** One record per Google account, so two people on one device never see each other's plan. */
export const KEY_PREFIX = "mise:plan:v1:";

/** Stable empty snapshot: returned before setWishlistUser, and as the SSR snapshot. */
export const EMPTY_PLAN: PlanState = { saved: [], slots: {} };

export const slotKey = (dayIndex: number, meal: Meal): string => `${dayIndex}:${meal}`;

const STYLE_IDS = DISH_STYLES.map((s) => s.id);
const MEAL_SET = new Set<string>(MEALS);
const MAX_SAVED = 30;

const listeners = new Set<() => void>();
/** Cleared the first time a write is refused (private mode, quota): memory becomes the truth. */
let storageWritable = true;
let activeKey: string | null = null;
let lastRaw: string | null = null;
let current: PlanState = EMPTY_PLAN;

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    // fall through to the timestamp id
  }
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

const pickStyle = (v: unknown): DishStyleId =>
  (STYLE_IDS as string[]).includes(v as string) ? (v as DishStyleId) : STYLE_IDS[0];

const isSlotKey = (key: string): boolean => {
  const [day, meal] = key.split(":");
  const n = Number(day);
  return Number.isInteger(n) && n >= 0 && n <= 6 && MEAL_SET.has(meal);
};

/**
 * Stored JSON is untrusted — it may predate a field or have been hand-edited in devtools.
 * Validating here keeps a bad style from reaching styleById() as a lookup that resolves to
 * undefined, and drops slots that point at a dish that no longer exists.
 */
export function coercePlan(raw: unknown): PlanState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const saved: SavedDish[] = [];
  const ids = new Set<string>();
  if (Array.isArray(r.saved)) {
    for (const entry of r.saved) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;
      const dish = typeof e.dish === "string" ? e.dish.trim().slice(0, 120) : "";
      if (!dish) continue;
      const id = typeof e.id === "string" && e.id ? e.id : makeId();
      if (ids.has(id)) continue;
      ids.add(id);
      saved.push({
        id,
        dish,
        style: pickStyle(e.style),
        variantTitle: typeof e.variantTitle === "string" ? e.variantTitle.slice(0, 120) : "",
        cuisine: typeof e.cuisine === "string" && e.cuisine ? e.cuisine.slice(0, 80) : undefined,
        savedAt: typeof e.savedAt === "string" ? e.savedAt : new Date().toISOString(),
      });
      if (saved.length >= MAX_SAVED) break;
    }
  }

  const slots: Record<string, string | null> = {};
  if (r.slots && typeof r.slots === "object") {
    for (const [key, value] of Object.entries(r.slots as Record<string, unknown>)) {
      if (!isSlotKey(key)) continue;
      if (typeof value === "string" && ids.has(value)) slots[key] = value;
    }
  }

  return { saved, slots };
}

const parse = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

/** Keep only slots whose assigned dish still exists. */
function pruneSlots(slots: Record<string, string | null>, ids: Set<string>): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(slots)) {
    if (typeof value === "string" && ids.has(value)) out[key] = value;
  }
  return out;
}

/**
 * Points the store at one account's record. Call it during render, before reading the plan:
 * it deliberately does not notify listeners, because the component that calls it is the one
 * that reads the plan, and notifying mid-render is not safe.
 */
export function setWishlistUser(userId: string) {
  const key = KEY_PREFIX + userId;
  if (key === activeKey) return;
  activeKey = key;
  lastRaw = null;
  current = EMPTY_PLAN;
}

function read(): PlanState {
  if (!activeKey) return EMPTY_PLAN;
  // Storage refused a write earlier, so it no longer reflects what the person chose.
  if (!storageWritable) return current;
  let raw: string | null;
  try {
    raw = localStorage.getItem(activeKey);
  } catch {
    return current;
  }
  if (raw === lastRaw) return current;
  lastRaw = raw;
  current = coercePlan(raw === null ? {} : parse(raw));
  return current;
}

/** Current plan, read at call time (safe inside async handlers and event handlers). */
export function getPlan(): PlanState {
  return read();
}

function write(next: PlanState) {
  current = next;
  if (activeKey && storageWritable) {
    const serialized = JSON.stringify(current);
    try {
      localStorage.setItem(activeKey, serialized);
      // Only mirror what actually landed, so a later read can trust the comparison.
      lastRaw = serialized;
    } catch {
      // Storage unavailable (private mode): keep the plan in memory for this tab.
      storageWritable = false;
    }
  }
  listeners.forEach((listener) => listener());
}

/** Saves a dish (dedupe by dish+style+variantTitle, newest first, capped). No-op before setWishlistUser. */
export function addToWishlist(d: Omit<SavedDish, "id" | "savedAt">) {
  if (!activeKey) return;
  const state = read();
  const dish = (d.dish ?? "").trim();
  if (!dish) return;
  const style = pickStyle(d.style);
  const variantTitle = (d.variantTitle ?? "").trim();
  const dupe = state.saved.some(
    (s) =>
      s.dish.toLowerCase() === dish.toLowerCase() &&
      s.style === style &&
      s.variantTitle.toLowerCase() === variantTitle.toLowerCase(),
  );
  if (dupe) return;
  const entry: SavedDish = {
    id: makeId(),
    dish: dish.slice(0, 120),
    style,
    variantTitle: variantTitle.slice(0, 120),
    cuisine: d.cuisine ? d.cuisine.trim().slice(0, 80) || undefined : undefined,
    savedAt: new Date().toISOString(),
  };
  const saved = [entry, ...state.saved].slice(0, MAX_SAVED);
  const ids = new Set(saved.map((s) => s.id));
  write({ saved, slots: pruneSlots(state.slots, ids) });
}

/** Removes a saved dish and clears any week slots that referenced it. No-op before setWishlistUser. */
export function removeSaved(id: string) {
  if (!activeKey) return;
  const state = read();
  const saved = state.saved.filter((s) => s.id !== id);
  if (saved.length === state.saved.length) return;
  const ids = new Set(saved.map((s) => s.id));
  write({ saved, slots: pruneSlots(state.slots, ids) });
}

/** Assigns a saved dish to a week slot, or clears it with null. No-op before setWishlistUser. */
export function assignSlot(key: string, savedId: string | null) {
  if (!activeKey || !isSlotKey(key)) return;
  const state = read();
  const slots = { ...state.slots };
  if (savedId === null) {
    delete slots[key];
  } else {
    if (!state.saved.some((s) => s.id === savedId)) return;
    slots[key] = savedId;
  }
  write({ saved: state.saved, slots });
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

export function usePlan(): PlanState {
  return useSyncExternalStore(subscribe, read, () => EMPTY_PLAN);
}
