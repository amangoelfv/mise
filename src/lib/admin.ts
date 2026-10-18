import { createHash } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Lightweight password gate for the operator-only /admin path. The page is first
 * gated by ADMIN_ENABLED; when ADMIN_PASSWORD is also set, an unguessable cookie
 * (sha256 of the password) must match. No password set → ADMIN_ENABLED alone gates
 * (dev convenience).
 */

const COOKIE = "mise_admin";
const PASSWORD = process.env.ADMIN_PASSWORD;

export function adminEnabled(): boolean {
  return process.env.ADMIN_ENABLED === "1";
}

export function adminPasswordRequired(): boolean {
  return adminEnabled() && !!PASSWORD;
}

function cookieToken(): string | null {
  return PASSWORD ? createHash("sha256").update(`mise-admin:${PASSWORD}`).digest("hex") : null;
}

export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const expected = cookieToken();
  if (!expected) return true; // enabled but no password configured
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
