import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Only run middleware on admin, login, auth, and cho-duyet routes
    "/admin/:path*",
    "/login",
    "/auth/:path*",
    "/cho-duyet",
  ],
};
