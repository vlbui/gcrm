import { createClient } from "@/lib/supabase/client";

export type UserRole = "Admin" | "Nhân viên" | "Xem";

export interface AppUser {
  id: string;
  email: string;
  ho_ten: string;
  vai_tro: UserRole;
  trang_thai: string;
  avatar_url: string | null;
  created_at: string;
}

export async function loginWithGoogle() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

export async function logout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("email", user.email)
    .single();

  return data;
}

export async function getCurrentAuthUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
