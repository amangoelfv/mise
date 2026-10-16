import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/http";

export async function POST(req: Request) {
  const res = NextResponse.redirect(`${appOrigin(req)}/`, 303);
  res.cookies.set("mise_session", "", { path: "/", maxAge: 0 });
  res.cookies.set("mise_connectors", "", { path: "/", maxAge: 0 });
  return res;
}
