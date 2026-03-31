import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const redirectUrl = `${origin}${next}`;
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Parse cookies from the incoming request
            const cookieHeader = request.headers.get("cookie") ?? "";
            return cookieHeader.split(";").map((c) => {
              const [name, ...rest] = c.trim().split("=");
              return { name, value: rest.join("=") };
            }).filter((c) => c.name);
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: Record<string, unknown>;
            }[]
          ) {
            // Set session cookies on the redirect response
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user exists in users table
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, trang_thai, vai_tro")
          .eq("email", user.email)
          .single();

        if (!dbUser || dbUser.trang_thai !== "Hoạt động") {
          const pendingResponse = NextResponse.redirect(`${origin}/cho-duyet`);
          response.cookies.getAll().forEach((cookie) => {
            pendingResponse.cookies.set(cookie.name, cookie.value);
          });
          return pendingResponse;
        }
      }

      return response;
    }
  }

  // Auth error → redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
