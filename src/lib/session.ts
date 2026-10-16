import { createRemoteJWKSet, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  CONNECTORS_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  readSessionUser,
  sealToken,
  signToken,
  unsealToken,
  type SessionUser,
} from "./session-token";
import type { ZeptoTokens } from "./zepto";

export type { SessionUser } from "./session-token";

export type ZeptoConnection =
  | ({ via: "zepto"; connectedAt: string } & ZeptoTokens)
  | { via: "simulated"; connectedAt: string; connectionId: string };

export interface Connections {
  zepto?: ZeptoConnection;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export async function getUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return readSessionUser(store.get(SESSION_COOKIE)?.value);
}

export async function setUser(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signToken({ user: { ...user } }), cookieOptions);
}

/** Store tokens live in their own encrypted cookie, bound to the signed-in user. */
export async function getConnections(user: SessionUser): Promise<Connections> {
  const store = await cookies();
  const payload = await unsealToken<{ uid?: string; connections?: Connections }>(store.get(CONNECTORS_COOKIE)?.value);
  if (!payload || payload.uid !== user.id) return {};
  return payload.connections ?? {};
}

export async function setConnections(user: SessionUser, connections: Connections) {
  const store = await cookies();
  store.set(CONNECTORS_COOKIE, await sealToken({ uid: user.id, connections: { ...connections } }), cookieOptions);
}

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

/** Verifies a Google Identity Services ID token and maps it to a session user. */
export async function verifyGoogleCredential(credential: string, clientId: string): Promise<SessionUser> {
  const { payload } = await jwtVerify(credential, googleKeys, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });
  const email = typeof payload.email === "string" ? payload.email : "";
  if (!payload.sub || !email || payload.email_verified !== true) {
    throw new Error("Google account email is not verified");
  }
  return {
    id: `google:${payload.sub}`,
    email,
    name: typeof payload.name === "string" ? payload.name : email.split("@")[0],
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
