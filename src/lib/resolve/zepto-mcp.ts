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

// Which saved address (by label) sets the delivery store for live search. The account can
// hold many addresses; pin one so prices/availability are consistent instead of "whichever
// Zepto returns first". Override with ZEPTO_STORE_ADDRESS_LABEL; falls back to the first
// address that has coordinates if the label isn't found.
const STORE_ADDRESS_LABEL = (process.env.ZEPTO_STORE_ADDRESS_LABEL || "home").trim().toLowerCase();

type JsonRpc = {
  result?: { content?: Array<{ type: string; text?: string }>; structuredContent?: unknown };
  error?: { message?: string };
};

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
    if (!res.ok) {
      console.error(`[zepto] MCP ${String(body.method)} HTTP ${res.status}: ${text.slice(0, 300)}`);
      throw new Error(`MCP ${String(body.method)} failed (${res.status})`);
    }
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
    if (out?.error) {
      console.error(`[zepto] tool ${name} error:`, out.error.message ?? out.error);
      throw new Error(out.error.message ?? `${name} error`);
    }
    // Zepto returns the machine-readable payload in `structuredContent`, and a
    // human-readable summary ("Found 30…", "📜 Order History…") in content[].text.
    // Prefer structuredContent; only fall back to text when a tool inlines JSON there.
    const result = out?.result;
    if (result?.structuredContent != null) return result.structuredContent as T;

    const textPart = result?.content?.find((c) => c.type === "text" && c.text);
    if (textPart?.text) {
      try {
        return JSON.parse(textPart.text) as T;
      } catch {
        console.error(`[zepto] tool ${name}: no structuredContent and text isn't JSON — head: ${textPart.text.slice(0, 120)}`);
        throw new Error(`${name}: unparseable result`);
      }
    }
    console.error(`[zepto] tool ${name}: empty result (keys: ${result ? Object.keys(result).join(",") : "none"})`);
    throw new Error(`${name}: no content`);
  }

  /**
   * Call a tool for its side effect only (e.g. setting the delivery location), where
   * the response is a human-readable confirmation with no structured payload to parse.
   * Returns the text for logging; never throws on a missing/non-JSON body.
   */
  private async callToolSideEffect(name: string, args: Record<string, unknown>): Promise<string> {
    await this.ensureInit();
    const out = await this.rpc({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name, arguments: args } });
    if (out?.error) throw new Error(out.error.message ?? `${name} error`);
    return out?.result?.content?.find((c) => c.type === "text" && c.text)?.text ?? "";
  }

  /** Set a delivery store so searches resolve (Zepto gates search on location). */
  private async ensureStore(): Promise<void> {
    const addrs = await this.callTool<{ addresses?: Array<{ label?: string; latitude?: number; longitude?: number }> }>(
      "list_saved_addresses",
      {},
    );
    const withCoords = (addrs.addresses ?? []).filter((x) => typeof x.latitude === "number" && typeof x.longitude === "number");
    // Prefer the pinned label; otherwise the first address that has coordinates.
    const a = withCoords.find((x) => (x.label ?? "").trim().toLowerCase() === STORE_ADDRESS_LABEL) ?? withCoords[0];
    if (a) {
      // get_location_serviceability returns a text confirmation ("✅ Zepto delivers…"), not JSON.
      const confirmation = await this.callToolSideEffect("get_location_serviceability", { latitude: a.latitude, longitude: a.longitude });
      console.info(`[zepto] store set from saved address "${a.label ?? "(unlabelled)"}" (lat ${a.latitude}, lng ${a.longitude}): ${confirmation.split("\n")[0]}`);
    } else {
      console.warn(`[zepto] no saved address with coordinates (${addrs.addresses?.length ?? 0} addresses); search may return nothing`);
    }
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
    console.info(
      `[zepto] live search done:`,
      [...out.entries()].map(([q, p]) => `${q}=${p.length}`).join(", "),
    );
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
      let fromGolden = 0;
      for (const q of queries) {
        const key = normalizeName(q);
        const got = live.get(key) ?? [];
        if (got.length === 0 && (golden.get(key)?.length ?? 0) > 0) fromGolden += 1;
        out.set(key, got.length > 0 ? got : (golden.get(key) ?? []));
      }
      if (fromGolden > 0) console.warn(`[zepto] ${fromGolden}/${queries.length} queries empty on live, filled from cache`);
      return out;
    } catch (error) {
      this.label = "cached";
      console.warn(`[zepto] live search FAILED — serving golden cache instead. Reason:`, error);
      return this.golden.searchMany(queries);
    }
  }

  async getOrderHistory(): Promise<readonly OrderHistoryItem[]> {
    try {
      return await this.live.getOrderHistory();
    } catch (error) {
      console.warn(`[zepto] live order history failed, using cache. Reason:`, error);
      return this.golden.getOrderHistory();
    }
  }
}

/** Picks the data source for a request: live MCP (+ fallback) when connected, else golden cache. */
export function createZeptoSource(connector: CartConnector): ZeptoSource {
  if (connector.transport === "mcp" && connector.accessToken) {
    const kind = connector.accessToken.startsWith("eyJ") ? "jwt" : "opaque";
    console.info(`[zepto] source = live MCP (${connector.mcpUrl}), token ${kind} len=${connector.accessToken.length}`);
    return new FallbackZeptoSource(new McpZeptoSource(connector.accessToken, connector.mcpUrl), new GoldenCacheSource());
  }
  console.info(`[zepto] source = golden cache (connector transport="${connector.transport}", no live token)`);
  return new GoldenCacheSource();
}
