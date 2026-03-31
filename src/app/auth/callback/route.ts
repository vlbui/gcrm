import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = await createClient();
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

        if (!dbUser) {
          // User not in users table → pending approval
          return NextResponse.redirect(`${origin}/cho-duyet`);
        }

        if (dbUser.trang_thai !== "Hoạt động") {
          return NextResponse.redirect(`${origin}/cho-duyet`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error → redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
