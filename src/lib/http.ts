import { BUDGET_PREFERENCES } from "./contract";
import { getUser, type SessionUser } from "./session";

/**
 * Public origin for absolute redirects. Set APP_URL in production: behind Cloud Run's
 * standalone server, req.url reports the bind address (0.0.0.0:8080), not the public host.
 */
export const appOrigin = (req: Request) => (process.env.APP_URL || new URL(req.url).origin).replace(/\/+$/, "");

export function fail(error: string, status = 400, code?: string) {
  return Response.json({ error, code }, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Returns the signed-in user, or a 401 Response to return as-is. */
export async function requireUser(): Promise<SessionUser | Response> {
  const user = await getUser();
  return user ?? fail("Please sign in again.", 401, "unauthenticated");
}

export const str = (v: unknown, fallback = "", max = 200) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : fallback;

export const num = (v: unknown, fallback = 0, min = -Infinity, max = Infinity) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export const strList = (v: unknown, maxItems = 10, maxLen = 60) =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim().slice(0, maxLen)).slice(0, maxItems)
    : [];

export function oneOf<T extends string>(v: unknown, options: readonly T[], fallback: T): T {
  return options.includes(v as T) ? (v as T) : fallback;
}

export const DIETS = ["any", "vegetarian", "eggetarian", "vegan", "jain"] as const;
// Re-exported rather than redeclared: the client validates budget too, and src/lib/contract.ts
// has no imports, so it is safe for a "use client" module in a way this file is not.
export const BUDGETS = BUDGET_PREFERENCES;
export const STYLES = ["restaurant", "basic", "healthy", "protein"] as const;
export const UNITS = ["g", "kg", "ml", "l", "pcs", "tsp", "tbsp", "bunch", "pack"] as const;
export const CATEGORIES = [
  "produce",
  "dairy",
  "meat_seafood",
  "bakery",
  "pantry",
  "spices",
  "frozen",
  "beverages",
  "other",
] as const;
