import { createHash } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Lightweight gate for the operator-only /admin path. The page exists only when
 * ADMIN_PASSWORD is set, and that password is the gate: logging in stores an
 * unguessable cookie (sha256 of the password) that must match. No password → no
 * admin page (404). No separate ADMIN_ENABLED flag needed.
 */

const COOKIE = "mise_admin";
const PASSWORD = process.env.ADMIN_PASSWORD;

/** Admin is available iff an operator password is configured. */
export function adminEnabled(): boolean {
  return !!PASSWORD;
}

function cookieToken(): string | null {
  return PASSWORD ? createHash("sha256").update(`mise-admin:${PASSWORD}`).digest("hex") : null;
}

export async function isAdmin(): Promise<boolean> {
  const expected = cookieToken();
  if (!expected) return false; // no password configured → admin off
  const store = await cookies();
  return store.get(COOKIE)?.value === expected;
}

export function checkAdminPassword(input: unknown): boolean {
  return typeof input === "string" && !!PASSWORD && input === PASSWORD;
}

export async function grantAdmin(): Promise<void> {
  const token = cookieToken();
  if (!token) return;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
}
