import type { CartConnector } from "./contract";
import { getConnections, setConnections, type Connections, type SessionUser } from "./session";
import type { ZeptoState } from "./types";
import { demoZeptoOverride, ZEPTO_MCP_URL, refreshTokens, type ZeptoTokens } from "./zepto";

/** Refresh the access token once it's within this window of expiring. */
const REFRESH_WINDOW_MS = 2 * 60_000;

export function zeptoState(connections: Connections): ZeptoState {
  const zepto = connections.zepto;
  if (zepto) return { connected: true, via: zepto.via, since: zepto.connectedAt };
  // Hosted single-account: the env override makes every visitor "connected".
  if (demoZeptoOverride()) return { connected: true, via: "zepto", since: new Date().toISOString() };
  return { connected: false };
}

function mcpConnector(accessToken: string, expiresAt: number): CartConnector {
  return { provider: "zepto", transport: "mcp", mcpUrl: ZEPTO_MCP_URL, accessToken, expiresAt: new Date(expiresAt).toISOString() };
}

/**
 * The single-account env-override token, refreshed and cached in-memory so the
 * ~1h access token self-heals within a running instance (the hosted/prod path,
 * where judges never sign in). Across cold starts it re-seeds from env; durable
 * persistence of a rotated refresh token would need a store (e.g. Firestore).
 */
let overrideCache: ZeptoTokens | null = null;
async function envOverrideConnector(): Promise<CartConnector | null> {
  const seed = demoZeptoOverride();
  if (!seed) return null;

  // Prefer the cache (it holds refreshed tokens), unless env was updated with a newer one.
  let tokens = overrideCache ?? seed;
  if (overrideCache && seed.accessToken !== overrideCache.accessToken && seed.expiresAt > overrideCache.expiresAt) {
    tokens = seed;
  }

  if (tokens.expiresAt - Date.now() < REFRESH_WINDOW_MS) {
    if (!tokens.refreshToken || !tokens.clientId) {
      console.warn(
        "[zepto] env override token is expired and cannot refresh — set ZEPTO_CLIENT_ID and a valid ZEPTO_REFRESH_TOKEN, or connect at /admin.",
      );
    } else {
      try {
        tokens = { ...tokens, ...(await refreshTokens(tokens)) };
        overrideCache = tokens;
        console.info("[zepto] env override token refreshed; new expiry", new Date(tokens.expiresAt).toISOString());
      } catch (error) {
        console.warn("[zepto] env override refresh failed:", error);
      }
    }
  } else {
    overrideCache = tokens;
  }

  // Return whatever we have; a still-expired token will 401 and get logged by the live source.
  return mcpConnector(tokens.accessToken, tokens.expiresAt);
}

/**
 * The connector block for a CartRequest. A signed-in user's own interactive Zepto
 * connection wins (it auto-refreshes and persists to their cookie); otherwise we
 * fall back to the shared single-account env override.
 * Only call from route handlers (it may rewrite the cookie). Returns null when not connected.
 */
export async function cartConnector(user: SessionUser): Promise<CartConnector | null> {
  const connections = await getConnections(user);
  const zepto = connections.zepto;

  if (zepto) {
    if (zepto.via === "simulated") {
      console.info("[zepto] connector: signed-in user's SIMULATED connection");
      return { provider: "zepto", transport: "simulated", connectionId: zepto.connectionId };
    }

    let tokens = zepto;
    const minsLeft = Math.round((zepto.expiresAt - Date.now()) / 60000);
    if (zepto.expiresAt - Date.now() < REFRESH_WINDOW_MS) {
      console.info(`[zepto] connector: signed-in user's OAuth token (expires in ${minsLeft} min) — refreshing now`);
      try {
        tokens = { ...zepto, ...(await refreshTokens(zepto)) };
        await setConnections(user, { ...connections, zepto: tokens });
        console.info("[zepto] cookie token refreshed; new expiry", new Date(tokens.expiresAt).toISOString());
      } catch (error) {
        console.warn("[zepto] cookie token refresh failed, disconnecting this user", error);
        delete connections.zepto;
        await setConnections(user, connections);
        return envOverrideConnector(); // fall back to the shared account if one is configured
      }
    } else {
      console.info(`[zepto] connector: signed-in user's OAuth token (valid ${minsLeft} more min)`);
    }
    return mcpConnector(tokens.accessToken, tokens.expiresAt);
  }

  console.info("[zepto] connector: no signed-in connection — using shared env-override account");
  return envOverrideConnector();
}
