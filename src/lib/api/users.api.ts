import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";
import type { UserRole } from "./auth.api";

export interface User {
  id: string;
  email: string;
  ho_ten: string;
  vai_tro: UserRole;
  trang_thai: string;
  avatar_url: string | null;
  created_at: string;
}

export type CreateUserInput = Omit<User, "id" | "created_at">;

export async function fetchUsers(): Promise<User[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchUser(id: string): Promise<User> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .insert(input)
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Thêm người dùng",
    module: "users",
    chi_tiet: `${input.email} - ${input.ho_ten} (${input.vai_tro})`,
  });

  return data;
}

export async function updateUser(
  id: string,
  updates: Partial<CreateUserInput>
): Promise<User> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật người dùng",
    module: "users",
    chi_tiet: `${data.email} - ${data.ho_ten}`,
  });

  return data;
}

export async function deleteUser(id: string) {
  const supabase = createClient();
  const { data: user } = await supabase
    .from("users")
    .select("email, ho_ten")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;

  if (user) {
    await logActivity({
      hanh_dong: "Xóa người dùng",
      module: "users",
      chi_tiet: `${user.email} - ${user.ho_ten}`,
    });
  }
}
