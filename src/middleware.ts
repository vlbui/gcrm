import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Delegate auth / session handling to the Supabase helper.
  // It validates the session with Supabase (not just cookie presence),
  // protects /admin routes, enforces user status + Admin-only routes,
  // and refreshes the session cookie on every request.
  return updateSession(request);
}

export const config = {
  // Only run on routes that actually need the session:
  //  - /admin/*   → protected area
  //  - /login     → redirect already-authenticated users away
  //  - /cho-duyet → pending-approval page
  //  - /auth/*    → OAuth callback (helper short-circuits this path)
  // The public landing page and static assets are left untouched so we
  // don't call Supabase on every public request.
  matcher: [
    "/admin/:path*",
    "/login",
    "/cho-duyet",
    "/auth/:path*",
  ],
};
