import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only protect /admin routes
  if (pathname.startsWith("/admin")) {
    const hasAuth = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.value.length > 20);

    if (!hasAuth) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
