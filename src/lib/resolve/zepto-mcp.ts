import type { CartConnector } from "@/lib/contract";
import type { OrderHistoryItem } from "./inventory";
import { normalizeName } from "./normalize";
import { GoldenCacheSource, type ZeptoSource } from "./zepto-source";
import type { ZeptoProduct } from "./zepto-types";

/**
 * Live Zepto access via the official MCP server (JSON-RPC over HTTP), using the
 * bearer token Mise's OAuth already obtained. Every method is best-effort and
 * wrapped by {@link FallbackZeptoSource}, so a live failure degrades to the
 * bundled golden cache rather than breaking the cart.
 *
 * Catalog + cart scopes only — this never places an order (Zepto forbids it).
 */

const TIMEOUT_MS = 15_000;
const PROTOCOL_VERSION = "2025-06-18";

type JsonRpc = { result?: { content?: Array<{ type: string; text?: string }> }; error?: { message?: string } };

function parseSse(text: string): JsonRpc | null {
  const dataLines = text.split(/\r?\n/).filter((l) => l.startsWith("data:"));
  for (let i = dataLines.length - 1; i >= 0; i--) {
    try {
      const obj = JSON.parse(dataLines[i]!.slice(5).trim()) as JsonRpc;
      if (obj.result || obj.error) return obj;
    } catch {
      // keep scanning
    }
  }
  return null;
}

class McpZeptoSource implements ZeptoSource {
  label = "live";
  private sessionId?: string;
  private initialized = false;

  constructor(
    private readonly token: string,
    private readonly url: string,
  ) {}

  private async rpc(body: Record<string, unknown>): Promise<JsonRpc | null> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(this.sessionId ? { "Mcp-Session-Id": this.sessionId } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const sid = res.headers.get("mcp-session-id");
    if (sid) this.sessionId = sid;
    const text = await res.text();
    if (!res.ok) throw new Error(`MCP ${String(body.method)} failed (${res.status})`);
    if (!text) return null;
    return (res.headers.get("content-type") ?? "").includes("text/event-stream")
      ? parseSse(text)
      : (JSON.parse(text) as JsonRpc);
  }

  private async ensureInit(): Promise<void> {
    if (this.initialized) return;
    await this.rpc({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "mise", version: "1.0" } },
    });
    await this.rpc({ jsonrpc: "2.0", method: "notifications/initialized" }).catch(() => undefined);
    this.initialized = true;
  }

  private async callTool<T>(name: string, args: Record<string, unknown>): Promise<T> {
    await this.ensureInit();
    const out = await this.rpc({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } });
    if (out?.error) throw new Error(out.error.message ?? `${name} error`);
    const textPart = out?.result?.content?.find((c) => c.type === "text" && c.text);
    if (!textPart?.text) throw new Error(`${name}: no content`);
    return JSON.parse(textPart.text) as T;
  }

  /** Set a delivery store so searches resolve (Zepto gates search on location). */
  private async ensureStore(): Promise<void> {
    const addrs = await this.callTool<{ addresses?: Array<{ latitude?: number; longitude?: number }> }>(
      "list_saved_addresses",
      {},
    );
    const a = addrs.addresses?.find((x) => typeof x.latitude === "number" && typeof x.longitude === "number");
    if (a) await this.callTool("get_location_serviceability", { latitude: a.latitude, longitude: a.longitude });
  }

  async searchMany(queries: readonly string[]): Promise<Map<string, ZeptoProduct[]>> {
    await this.ensureStore();
    const out = new Map<string, ZeptoProduct[]>();
    for (let i = 0; i < queries.length; i += 5) {
      const chunk = queries.slice(i, i + 5);
      const data = await this.callTool<{ sections?: Array<{ query: string; products?: ZeptoProduct[] }> }>(
        "search_multiple_products",
        { queries: chunk },
      );
      for (const section of data.sections ?? []) out.set(normalizeName(section.query), section.products ?? []);
    }
    for (const q of queries) if (!out.has(normalizeName(q))) out.set(normalizeName(q), []);
    return out;
  }

  async getOrderHistory(): Promise<readonly OrderHistoryItem[]> {
    const data = await this.callTool<{ orders?: Array<{ id: string; productsNamesAndCounts?: Array<{ name: string }> }> }>(
      "list_order_history",
      { limit: 10 },
    );
    return (data.orders ?? []).map((o) => ({ id: o.id, items: (o.productsNamesAndCounts ?? []).map((p) => p.name) }));
  }
}

/** Tries the live source; on any failure (or empty result) serves the golden cache. */
class FallbackZeptoSource implements ZeptoSource {
  label = "cached";
  constructor(
    private readonly live: McpZeptoSource,
    private readonly golden: GoldenCacheSource,
  ) {}

  async searchMany(queries: readonly string[]): Promise<Map<string, ZeptoProduct[]>> {
    try {
      const live = await this.live.searchMany(queries);
      this.label = "live";
      const golden = await this.golden.searchMany(queries);
      const out = new Map<string, ZeptoProduct[]>();
      for (const q of queries) {
        const key = normalizeName(q);
        const got = live.get(key) ?? [];
        out.set(key, got.length > 0 ? got : (golden.get(key) ?? []));
      }
      return out;
    } catch {
      this.label = "cached";
      return this.golden.searchMany(queries);
    }
  }

  async getOrderHistory(): Promise<readonly OrderHistoryItem[]> {
    try {
      return await this.live.getOrderHistory();
    } catch {
      return this.golden.getOrderHistory();
    }
  }
}

/** Picks the data source for a request: live MCP (+ fallback) when connected, else golden cache. */
export function createZeptoSource(connector: CartConnector): ZeptoSource {
  if (connector.transport === "mcp" && connector.accessToken) {
    return new FallbackZeptoSource(new McpZeptoSource(connector.accessToken, connector.mcpUrl), new GoldenCacheSource());
  }
  return new GoldenCacheSource();
}
