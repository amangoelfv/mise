"use client";

import type { Unit } from "./contract";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export async function api<T>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? (init.body === undefined ? "GET" : "POST");
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError("You seem to be offline.", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    // Session expired mid-flow: a full reload clears client state on purpose.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) throw new ApiError(data.error || `Something went wrong (${res.status})`, res.status, data.code);
  return data as T;
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";

export const inr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

const trim = (n: number) => String(Math.round(n * 100) / 100);

/** Scales a recipe quantity and rounds it to something a person would actually measure. */
export function scaleQuantity(quantity: number, unit: Unit, factor: number): number {
  const q = quantity * factor;
  switch (unit) {
    case "g":
    case "ml":
      return q >= 100 ? Math.round(q / 10) * 10 : q >= 20 ? Math.round(q / 5) * 5 : Math.max(1, Math.round(q));
    case "pcs":
    case "bunch":
    case "pack":
      return Math.max(0.5, Math.round(q * 2) / 2);
    case "tsp":
    case "tbsp":
      return Math.max(0.25, Math.round(q * 4) / 4);
    default:
      return Math.round(q * 100) / 100;
  }
}

export function formatQuantity(quantity: number, unit: Unit): string {
  if (unit === "g" && quantity >= 1000) return `${trim(quantity / 1000)} kg`;
  if (unit === "ml" && quantity >= 1000) return `${trim(quantity / 1000)} l`;
  if (unit === "pcs") return `${trim(quantity)} pc${quantity > 1 ? "s" : ""}`;
  if (unit === "bunch") return `${trim(quantity)} bunch${quantity > 1 ? "es" : ""}`;
  return `${trim(quantity)} ${unit}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  produce: "Fresh produce",
  dairy: "Dairy & eggs",
  meat_seafood: "Meat & seafood",
  bakery: "Bakery",
  pantry: "Pantry",
  spices: "Spices & seasoning",
  frozen: "Frozen",
  beverages: "Beverages",
  other: "Other",
};
