import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/http";
import { getConnections, getUser, setConnections } from "@/lib/session";
import { ZEPTO_OAUTH_COOKIE, unsealToken } from "@/lib/session-token";
import { exchangeCode } from "@/lib/zepto";

interface Pending {
  uid: string;
  state: string;
  verifier: string;
  clientId: string;
  redirectUri: string;
}

/** Step 2 of Zepto sign-in: verify state, swap the code for tokens, keep them sealed. */
export async function GET(req: Request) {
  const origin = appOrigin(req);
  const params = new URL(req.url).searchParams;
  const done = (status: "ok" | "error", message?: string) => {
    const res = NextResponse.redirect(
      `${origin}/connectors/zepto/done?status=${status}${message ? `&message=${encodeURIComponent(message)}` : ""}`,
    );
    res.cookies.set(ZEPTO_OAUTH_COOKIE, "", { path: "/api/connectors/zepto", maxAge: 0 });
    return res;
  };

  if (params.get("error")) return done("error", params.get("error_description") || "Zepto sign-in was cancelled.");

  const user = await getUser();
  const pending = await unsealToken<Pending>((await cookies()).get(ZEPTO_OAUTH_COOKIE)?.value);
  const code = params.get("code");
  if (!user || !pending || pending.uid !== user.id || !code || params.get("state") !== pending.state) {
    return done("error", "That sign-in link expired. Please try connecting again.");
  }

  try {
    const tokens = await exchangeCode(code, pending.verifier, pending.redirectUri, pending.clientId);
    const connections = await getConnections(user);
    await setConnections(user, { ...connections, zepto: { via: "zepto", connectedAt: new Date().toISOString(), ...tokens } });
    return done("ok");
  } catch (error) {
    console.error("[zepto/callback]", error);
    return done("error", "Zepto didn't accept the sign-in. Please try again.");
  }
}
