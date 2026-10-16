import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/http";
import { getUser } from "@/lib/session";
import { ZEPTO_OAUTH_COOKIE, sealToken } from "@/lib/session-token";
import { buildAuthorizeUrl } from "@/lib/zepto";

/** Step 1 of Zepto sign-in: PKCE + state into a short-lived sealed cookie, then off to Zepto. */
export async function GET(req: Request) {
  const origin = appOrigin(req);
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?next=/settings`);

  const redirectUri = `${origin}/api/connectors/zepto/callback`;
  try {
    const { url, state, verifier, clientId } = await buildAuthorizeUrl(redirectUri);
    const res = NextResponse.redirect(url);
    res.cookies.set(ZEPTO_OAUTH_COOKIE, await sealToken({ uid: user.id, state, verifier, clientId, redirectUri }, 600), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/connectors/zepto",
      maxAge: 600,
    });
    return res;
  } catch (error) {
    console.error("[zepto/start]", error);
    const message = "Couldn't reach Zepto sign-in. Try again in a moment.";
    return NextResponse.redirect(`${origin}/connectors/zepto/done?status=error&message=${encodeURIComponent(message)}`);
  }
}
