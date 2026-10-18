import goldenCache from "./golden-cache.json";
import type { OrderHistoryItem } from "./inventory";
import { normalizeName } from "./normalize";
import type { ZeptoProduct } from "./zepto-types";

/**
 * Where the resolver gets Zepto data. The rest of the engine depends on this
 * interface, so it runs the same against the bundled golden cache (fool-proof
 * fallback) and the live MCP (see zepto-mcp.ts).
 */
export interface ZeptoSource {
  /** "live" | "cached" | "mock" — surfaced in the response. */
  readonly label: string;
  searchMany(queries: readonly string[]): Promise<Map<string, ZeptoProduct[]>>;
  getOrderHistory(): Promise<readonly OrderHistoryItem[]>;
}

interface GoldenData {
  search: Record<string, ZeptoProduct[]>;
  orders: OrderHistoryItem[];
}

/**
 * Serves real Zepto data captured ahead of time and bundled in the repo. Works
 * on Cloud Run's read-only filesystem and never expires, so a demo can't break.
 */
export class GoldenCacheSource implements ZeptoSource {
  readonly label = "cached";
  private readonly byQuery: Map<string, ZeptoProduct[]>;
  private readonly orders: readonly OrderHistoryItem[];

  constructor(data: GoldenData = goldenCache as unknown as GoldenData) {
    this.byQuery = new Map();
    for (const [query, products] of Object.entries(data.search ?? {})) {
      this.byQuery.set(normalizeName(query), products);
    }
    this.orders = data.orders ?? [];
  }

  searchMany(queries: readonly string[]): Promise<Map<string, ZeptoProduct[]>> {
    const out = new Map<string, ZeptoProduct[]>();
    for (const q of queries) {
      const key = normalizeName(q);
      out.set(key, this.byQuery.get(key) ?? []);
    }
    return Promise.resolve(out);
  }

  getOrderHistory(): Promise<readonly OrderHistoryItem[]> {
    return Promise.resolve(this.orders);
  }
}
