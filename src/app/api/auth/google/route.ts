import { googleClientId } from "@/lib/config";
import { fail, readJson, str } from "@/lib/http";
import { setUser, verifyGoogleAccessToken, verifyGoogleCredential } from "@/lib/session";

export async function POST(req: Request) {
  if (!googleClientId) return fail("Google sign-in isn't configured on this deployment.", 400);
  // accessToken: our custom button (OAuth token client). credential: an ID token (One Tap / rendered button).
  const body = await readJson(req);
  const accessToken = str(body.accessToken, "", 4096);
  const credential = str(body.credential, "", 4096);
  if (!accessToken && !credential) return fail("Missing Google credential.");
  try {
    const user = accessToken
      ? await verifyGoogleAccessToken(accessToken, googleClientId)
      : await verifyGoogleCredential(credential, googleClientId);
    await setUser(user);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[auth/google]", error);
    return fail("We couldn't verify your Google account.", 401);
  }
}
