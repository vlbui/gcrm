import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing, let the request through (avoid crash)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options: Record<string, unknown>;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Let /auth/callback pass through untouched —
  // the PKCE code verifier cookie must not be consumed here.
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return supabaseResponse;
  }

  // Helper: create redirect with session cookies preserved
  function redirectWithCookies(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    // Copy all session cookies (with options) to the redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    });
    return redirectResponse;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Protect /admin routes — require authenticated user
    if (pathname.startsWith("/admin") && !user) {
      return redirectWithCookies("/login");
    }

    // If authenticated, check if user exists in users table with active status
    if (pathname.startsWith("/admin") && user) {
      const { data: dbUser } = await supabase
        .from("users")
        .select("id, trang_thai, vai_tro")
        .eq("email", user.email)
        .single();

      // User not in users table or not active → pending approval
      if (!dbUser || dbUser.trang_thai !== "Hoạt động") {
        return redirectWithCookies("/cho-duyet");
      }

      // Admin-only routes
      if (
        pathname.startsWith("/admin/nguoi-dung") &&
        dbUser.vai_tro !== "Admin"
      ) {
        return redirectWithCookies("/admin");
      }
    }

    // Redirect logged-in users away from login page
    if (pathname === "/login" && user) {
      return redirectWithCookies("/admin");
    }
  } catch {
    // auth error — continue without redirect
  }

  return supabaseResponse;
}
