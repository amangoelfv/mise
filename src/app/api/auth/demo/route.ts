import { demoLoginEnabled } from "@/lib/config";
import { fail } from "@/lib/http";
import { setUser } from "@/lib/session";

export async function POST() {
  if (!demoLoginEnabled) return fail("Demo sign-in is disabled.", 404);
  await setUser({ id: "demo", email: "demo@mise.local", name: "Demo Chef", demo: true });
  return Response.json({ ok: true });
}
