import { createClient } from "@/lib/supabase/client";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  email: string;
  hanh_dong: string;
  module: string;
  chi_tiet: string | null;
  created_at: string;
}

export async function logActivity(params: {
  hanh_dong: string;
  module: string;
  chi_tiet?: string;
}) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("activity_log").insert({
      user_id: user.id,
      email: user.email,
      hanh_dong: params.hanh_dong,
      module: params.module,
      chi_tiet: params.chi_tiet ?? null,
    });
    // Audit logging must never break the caller's happy path,
    // but we should surface failures in the console for ops.
    if (error) {
      console.warn("[logActivity] insert failed:", error.message);
    }
  } catch (err) {
    console.warn("[logActivity] unexpected error:", err);
  }
}

export async function fetchActivityLogs(limit = 50): Promise<ActivityLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
