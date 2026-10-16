import { cartApiMode } from "@/lib/cart-api";
import { fail, readJson, requireUser } from "@/lib/http";
import { getConnections, setConnections } from "@/lib/session";
import { revokeTokens } from "@/lib/zepto";

/** Simulated connection for demos without a Zepto account (only while the cart API is simulated too). */
export async function POST(req: Request) {
  const user = await requireUser();
  if (user instanceof Response) return user;

  if ((await readJson(req)).action !== "simulate") return fail("Unknown action.");
  if (cartApiMode !== "mock") return fail("Simulated connections are off when a real cart API is configured.", 403);

  const connections = await getConnections(user);
  const connectedAt = new Date().toISOString();
  await setConnections(user, {
    ...connections,
    zepto: { via: "simulated", connectedAt, connectionId: `sim_${crypto.randomUUID().slice(0, 12)}` },
  });
  return Response.json({ connected: true, via: "simulated", since: connectedAt });
}

export async function DELETE() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const connections = await getConnections(user);
  if (connections.zepto?.via === "zepto") await revokeTokens(connections.zepto);
  delete connections.zepto;
  await setConnections(user, connections);
  return Response.json({ connected: false });
}
