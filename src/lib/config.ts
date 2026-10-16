export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/** Demo sign-in is on when Google isn't configured, or when explicitly enabled for judges. */
export const demoLoginEnabled = !googleClientId || process.env.NEXT_PUBLIC_DEMO_LOGIN === "1";

/** Only allow same-origin relative redirects. */
export function safeNext(next: unknown, fallback = "/app"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
