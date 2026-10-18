"use client";

import { useSyncExternalStore } from "react";
import type { Diet } from "./contract";

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
};

const KEY = "mise:prefs:v1";
const listeners = new Set<() => void>();
let lastRaw: string | null = null;
let current: Prefs = DEFAULT_PREFS;

/** Current prefs, read at call time (safe inside async handlers and effects). */
export function getPrefs(): Prefs {
  return read();
}

function read(): Prefs {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return current;
  }
  if (raw === lastRaw) return current;
  lastRaw = raw;
  try {
    current = { ...DEFAULT_PREFS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    current = DEFAULT_PREFS;
  }
  return current;
}

export function updatePrefs(patch: Partial<Prefs>) {
  current = { ...read(), ...patch };
  try {
    lastRaw = JSON.stringify(current);
    localStorage.setItem(KEY, lastRaw);
  } catch {
    // Storage unavailable (private mode): keep prefs in memory for this tab.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === KEY && listener();
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
