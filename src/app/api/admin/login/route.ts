import { adminEnabled, checkAdminPassword, grantAdmin } from "@/lib/admin";
import { fail, readJson } from "@/lib/http";

/** Exchange the admin password for an admin cookie. 404 unless ADMIN_ENABLED. */
export async function POST(req: Request) {
  if (!adminEnabled()) return new Response("Not found", { status: 404 });
  const body = await readJson(req);
  if (!checkAdminPassword(body.password)) return fail("Wrong password.", 401);
  await grantAdmin();
  return Response.json({ ok: true });
}
