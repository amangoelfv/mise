import { demoLoginEnabled } from "@/lib/config";
import { fail } from "@/lib/http";
import { setUser } from "@/lib/session";

export async function POST() {
  if (!demoLoginEnabled) return fail("Demo sign-in is disabled.", 404);
  const uid = crypto.randomUUID();
  await setUser({ id: `demo:${uid}`, email: `demo+${uid.slice(0, 8)}@mise.local`, name: "Demo Chef", demo: true });
  return Response.json({ ok: true });
}
