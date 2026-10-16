import type { CartConnector } from "./contract";
import { getConnections, setConnections, type Connections, type SessionUser } from "./session";
import type { ZeptoState } from "./types";
import { ZEPTO_MCP_URL, refreshTokens } from "./zepto";

export function zeptoState(connections: Connections): ZeptoState {
  const zepto = connections.zepto;
  return zepto ? { connected: true, via: zepto.via, since: zepto.connectedAt } : { connected: false };
}

/**
 * The connector block for a CartRequest, refreshing the Zepto token when it is about to expire.
 * Only call from route handlers (it may rewrite the cookie). Returns null when not connected.
 */
export async function cartConnector(user: SessionUser): Promise<CartConnector | null> {
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
