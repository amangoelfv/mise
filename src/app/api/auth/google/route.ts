import { googleClientId } from "@/lib/config";
import { fail, readJson, str } from "@/lib/http";
import { setUser, verifyGoogleCredential } from "@/lib/session";

export async function POST(req: Request) {
  if (!googleClientId) return fail("Google sign-in isn't configured on this deployment.", 400);
  const credential = str((await readJson(req)).credential, "", 4096);
  if (!credential) return fail("Missing Google credential.");
  try {
    await setUser(await verifyGoogleCredential(credential, googleClientId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[auth/google]", error);
    return fail("We couldn't verify your Google account.", 401);
  }
}
