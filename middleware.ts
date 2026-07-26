import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth, AUTH_ENABLED } from "@/auth";

const PUBLIC = ["/sign-in", "/api/auth"];

export default async function middleware(request: NextRequest) {
  if (!AUTH_ENABLED) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (PUBLIC.some((prefix) => pathname.startsWith(prefix))) return NextResponse.next();

  const session = await auth();
  if (session) return NextResponse.next();

  const target = new URL("/sign-in", request.url);
  target.searchParams.set("next", pathname);
  return NextResponse.redirect(target);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
