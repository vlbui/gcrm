import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface PipelineCard {
  id: string;
  ma_yc: string;
  ten_kh: string;
  sdt: string;
  email: string | null;
  dia_chi: string | null;
  loai_hinh: string | null;
  loai_con_trung: string | null;
  dien_tich: string | null;
  mo_ta: string | null;
  trang_thai: string;
  gia_tri: number;
  xu_ly_boi: string | null;
  ghi_chu_nv: string | null;
  created_at: string;
  // Joined
  users?: { ho_ten: string } | null;
}

export const PIPELINE_COLUMNS = [
  { key: "Mới", label: "Khách hỏi", color: "#6B7280" },
  { key: "Đã liên hệ", label: "Đã liên hệ", color: "#3B82F6" },
  { key: "Đang tư vấn", label: "Tư vấn", color: "#8B5CF6" },
  { key: "Đã báo giá", label: "Báo giá", color: "#F59E0B" },
  { key: "Chốt đơn", label: "Chốt đơn", color: "#10B981" },
  { key: "Đang triển khai", label: "Triển khai", color: "#2E7D32" },
  { key: "Hoàn thành", label: "Hoàn thành", color: "#059669" },
] as const;

export async function fetchPipelineCards(): Promise<PipelineCard[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_requests")
    .select("id, ma_yc, ten_kh, sdt, email, dia_chi, loai_hinh, loai_con_trung, dien_tich, mo_ta, trang_thai, gia_tri, xu_ly_boi, ghi_chu_nv, created_at, users:xu_ly_boi(ho_ten)")
    .neq("trang_thai", "Từ chối")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({
    ...d,
    users: Array.isArray(d.users) ? d.users[0] ?? null : d.users,
  })) as PipelineCard[];
}

export async function updateCardStatus(id: string, trang_thai: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("service_requests")
    .update({ trang_thai })
    .eq("id", id);
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật pipeline",
    module: "pipeline",
    chi_tiet: `Chuyển sang: ${trang_thai}`,
  });
}

export async function updateCardDetails(id: string, updates: Partial<PipelineCard>): Promise<void> {
  const supabase = createClient();
  const { users, ...dbUpdates } = updates as Record<string, unknown>;
  const { error } = await supabase
    .from("service_requests")
    .update(dbUpdates)
    .eq("id", id);
  if (error) throw error;
}
