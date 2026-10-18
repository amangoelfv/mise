import type { CartConnector } from "./contract";
import { getConnections, setConnections, type Connections, type SessionUser } from "./session";
import type { ZeptoState } from "./types";
import { demoZeptoOverride, ZEPTO_MCP_URL, refreshTokens } from "./zepto";

export function zeptoState(connections: Connections): ZeptoState {
  const zepto = connections.zepto;
  const demo = demoZeptoOverride();
  if (demo) return { connected: true, via: "zepto", since: new Date().toISOString() };
  return zepto ? { connected: true, via: zepto.via, since: zepto.connectedAt } : { connected: false };
}

/**
 * The connector block for a CartRequest, refreshing the Zepto token when it is about to expire.
 * Only call from route handlers (it may rewrite the cookie). Returns null when not connected.
 */
export async function cartConnector(user: SessionUser): Promise<CartConnector | null> {
  const demo = demoZeptoOverride();
  if (demo) {
    let tokens = demo;
    if (tokens.expiresAt - Date.now() < 2 * 60_000 && tokens.refreshToken) {
      try {
        tokens = { ...tokens, ...(await refreshTokens(tokens)) };
      } catch (error) {
        console.warn("[zepto] demo override refresh failed", error);
        return null;
      }
    }
    return {
      provider: "zepto",
      transport: "mcp",
      mcpUrl: ZEPTO_MCP_URL,
      accessToken: tokens.accessToken,
      expiresAt: new Date(tokens.expiresAt).toISOString(),
    };
  }

  const connections = await getConnections(user);
  const zepto = connections.zepto;
  if (!zepto) return null;
  if (zepto.via === "simulated") return { provider: "zepto", transport: "simulated", connectionId: zepto.connectionId };

  let tokens = zepto;
  if (zepto.expiresAt - Date.now() < 2 * 60_000) {
    try {
      tokens = { ...zepto, ...(await refreshTokens(zepto)) };
      await setConnections(user, { ...connections, zepto: tokens });
    } catch (error) {
      console.warn("[zepto] refresh failed, disconnecting", error);
      delete connections.zepto;
      await setConnections(user, connections);
      return null;
    }
  }
  return {
    provider: "zepto",
    transport: "mcp",
    mcpUrl: ZEPTO_MCP_URL,
    accessToken: tokens.accessToken,
    expiresAt: new Date(tokens.expiresAt).toISOString(),
  };
}
