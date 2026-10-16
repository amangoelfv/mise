import { randomUrlToken } from "./session-token";

/**
 * Zepto's official MCP server (github.com/zeptonow/mcp) and its OAuth 2.1 server.
 * Users sign in on Zepto's own page (phone + OTP); Mise only ever holds the resulting token.
 */

export const ZEPTO_MCP_URL = "https://mcp.zepto.co.in/mcp";
const RESOURCE = "https://mcp.zepto.co.in";
const AUTH_SERVER = "https://auth.zepto.co.in";

/** Catalog + cart only. Deliberately no order/checkout scopes: Mise can't place orders. */
export const ZEPTO_SCOPES = [
  "tools:read",
  "tools:write",
  "dev.ucp.shopping.catalog.search:read",
  "dev.ucp.shopping.catalog.lookup:read",
  "dev.ucp.shopping.cart:manage",
  "dev.ucp.common.location.search:read",
  "dev.ucp.common.location.lookup:read",
];

interface AuthMetadata {
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  revocation_endpoint?: string;
}

export interface ZeptoTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  clientId: string;
}

let metadata: Promise<AuthMetadata> | null = null;
function authMetadata(): Promise<AuthMetadata> {
  metadata ??= fetch(`${AUTH_SERVER}/.well-known/oauth-authorization-server`, { cache: "no-store" }).then((res) => {
    if (!res.ok) throw new Error(`Zepto auth metadata ${res.status}`);
    return res.json();
  });
  metadata.catch(() => (metadata = null));
  return metadata;
}

const registered = new Map<string, Promise<string>>();

/** ZEPTO_CLIENT_ID if pre-registered, else dynamic client registration (cached per redirect URI). */
export function zeptoClientId(redirectUri: string): Promise<string> {
  if (process.env.ZEPTO_CLIENT_ID) return Promise.resolve(process.env.ZEPTO_CLIENT_ID);
  let pending = registered.get(redirectUri);
  if (!pending) {
    pending = authMetadata().then(async (meta) => {
      if (!meta.registration_endpoint) throw new Error("Zepto does not offer client registration; set ZEPTO_CLIENT_ID");
      const res = await fetch(meta.registration_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: "Mise",
          redirect_uris: [redirectUri],
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
          token_endpoint_auth_method: "none",
          scope: ZEPTO_SCOPES.join(" "),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.client_id) {
        throw new Error(`Zepto client registration failed (${res.status}): ${body.error_description ?? body.error ?? "unknown"}`);
      }
      return body.client_id as string;
    });
    pending.catch(() => registered.delete(redirectUri));
    registered.set(redirectUri, pending);
  }
  return pending;
}

async function pkceChallenge(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return Buffer.from(digest).toString("base64url");
}

export async function buildAuthorizeUrl(redirectUri: string) {
  const [meta, clientId] = await Promise.all([authMetadata(), zeptoClientId(redirectUri)]);
  const state = randomUrlToken(24);
  const verifier = randomUrlToken(48);
  const url = new URL(meta.authorization_endpoint);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: ZEPTO_SCOPES.join(" "),
    state,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: "S256",
    resource: RESOURCE,
  }).toString();
  return { url: url.toString(), state, verifier, clientId };
}

async function tokenRequest(params: Record<string, string>, clientId: string): Promise<ZeptoTokens> {
  const meta = await authMetadata();
  const res = await fetch(meta.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ ...params, client_id: clientId, resource: RESOURCE }),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(`Zepto token request failed (${res.status}): ${body.error_description ?? body.error ?? "unknown"}`);
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? params.refresh_token,
    expiresAt: Date.now() + (Number(body.expires_in) || 3600) * 1000,
    clientId,
  };
}

export function exchangeCode(code: string, verifier: string, redirectUri: string, clientId: string) {
  return tokenRequest({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: redirectUri }, clientId);
}

export function refreshTokens(tokens: ZeptoTokens) {
  if (!tokens.refreshToken) throw new Error("Zepto session expired");
  return tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refreshToken }, tokens.clientId);
}

export async function revokeTokens(tokens: ZeptoTokens) {
  const meta = await authMetadata().catch(() => null);
  if (!meta?.revocation_endpoint) return;
  await fetch(meta.revocation_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: tokens.refreshToken ?? tokens.accessToken, client_id: tokens.clientId }),
  }).catch(() => undefined);
}
