import { getConnections, getUser } from "@/lib/session";

/**
 * INTERNAL, opt-in: reveals the connected user's Zepto tokens so an operator can
 * copy them into prod env (single-account demo). Returns 404 unless
 * ZEPTO_TOKEN_EXPORT=1 — never enable this in production.
 */
export async function GET() {
  if (process.env.ZEPTO_TOKEN_EXPORT !== "1") return new Response("Not found", { status: 404 });

  const user = await getUser();
  if (!user) return Response.json({ error: "Not logged in." }, { status: 401 });

  const zepto = (await getConnections(user)).zepto;
  if (!zepto || zepto.via !== "zepto") {
    return Response.json({ error: "Zepto not connected via OAuth (connect first)." }, { status: 409 });
  }

  return Response.json({
    ZEPTO_ACCESS_TOKEN: zepto.accessToken,
    ZEPTO_REFRESH_TOKEN: zepto.refreshToken ?? null,
    // The client id the refresh token was issued to — REQUIRED for auto-refresh to work.
    ZEPTO_CLIENT_ID: zepto.clientId,
    ZEPTO_ACCESS_TOKEN_EXPIRES_AT: zepto.expiresAt,
    note: "Copy all three (ACCESS, REFRESH, CLIENT_ID) into prod env (Cloud Run). Keep secret. Do NOT set ZEPTO_TOKEN_EXPORT in prod.",
  });
}
