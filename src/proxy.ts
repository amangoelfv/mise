import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/config";
import { SESSION_COOKIE, readSessionUser } from "@/lib/session-token";

/** Auth redirects happen here, before render, so protected pages never flash. */
export async function proxy(req: NextRequest) {
  const user = await readSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
  const { pathname, search } = req.nextUrl;

  if (pathname === "/login") {
    return user
      ? NextResponse.redirect(new URL(safeNext(req.nextUrl.searchParams.get("next")), req.url))
      : NextResponse.next();
  }

  if (!user) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app", "/settings", "/login"],
};
