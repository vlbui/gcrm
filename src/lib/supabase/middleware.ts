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

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Protect /admin routes — require authenticated user
    if (pathname.startsWith("/admin") && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
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
        const url = request.nextUrl.clone();
        url.pathname = "/cho-duyet";
        return NextResponse.redirect(url);
      }

      // Admin-only routes
      if (
        pathname.startsWith("/admin/nguoi-dung") &&
        dbUser.vai_tro !== "Admin"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    }

    // Redirect logged-in users away from login page
    if (pathname === "/login" && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    // If auth check fails (network, env issue), let request through
    // rather than crashing the middleware
    console.error("Middleware auth error:", error);
  }

  return supabaseResponse;
}
