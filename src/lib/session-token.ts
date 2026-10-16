import { EncryptJWT, SignJWT, base64url, jwtDecrypt, jwtVerify, type JWTPayload } from "jose";

/** Signed-cookie primitives shared by server components, route handlers and proxy.ts. */

export const SESSION_COOKIE = "mise_session";
export const CONNECTORS_COOKIE = "mise_connectors";
export const ZEPTO_OAUTH_COOKIE = "mise_zepto_oauth";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  demo?: boolean;
}

let devSecretWarned = false;
function secret() {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return new TextEncoder().encode(value);
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to 32+ characters in production");
  }
  if (!devSecretWarned) {
    devSecretWarned = true;
    console.warn("[mise] SESSION_SECRET not set; using an insecure dev secret");
  }
  return new TextEncoder().encode("mise-dev-only-secret-never-use-in-production");
}

export async function signToken(payload: JWTPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function readToken<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload as T;
  } catch {
    return null;
  }
}

export async function readSessionUser(token: string | undefined): Promise<SessionUser | null> {
  return (await readToken<{ user?: SessionUser }>(token))?.user ?? null;
}

let encryptionKey: Promise<Uint8Array> | null = null;
/** A256GCM key derived from SESSION_SECRET, for cookies that carry third-party tokens. */
function sealKey() {
  encryptionKey ??= crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(`mise-seal:${new TextDecoder().decode(secret())}`))
    .then((digest) => new Uint8Array(digest));
  return encryptionKey;
}

export async function sealToken(payload: JWTPayload, maxAgeSec = SESSION_MAX_AGE) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .encrypt(await sealKey());
}

export async function unsealToken<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, await sealKey());
    return payload as T;
  } catch {
    return null;
  }
}

export const randomUrlToken = (bytes = 32) => base64url.encode(crypto.getRandomValues(new Uint8Array(bytes)));
