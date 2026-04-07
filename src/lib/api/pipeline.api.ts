import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";
import { createCustomer } from "./customers.api";
import { createContract } from "./contracts.api";

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

/** Tạo KH từ card pipeline, trả về customer id */
export async function createCustomerFromCard(card: PipelineCard): Promise<string> {
  const customer = await createCustomer({
    ten_kh: card.ten_kh,
    sdt: card.sdt,
    email: card.email ?? "",
    dia_chi: card.dia_chi ?? "",
    loai_kh: card.loai_hinh || "Hộ gia đình",
    trang_thai: "Đang phục vụ",
    ghi_chu: `Từ yêu cầu ${card.ma_yc}`,
  });
  return customer.id;
}

/** Tạo HĐ từ card pipeline */
export async function createContractFromCard(
  card: PipelineCard,
  customerId: string
): Promise<string> {
  const contract = await createContract({
    customer_id: customerId,
    dich_vu: card.loai_con_trung ? `Dịch vụ ${card.loai_con_trung}` : "Dịch vụ kiểm soát côn trùng",
    gia_tri: card.gia_tri || 0,
    trang_thai: "Mới",
    dien_tich: card.dien_tich || null,
    ngay_bat_dau: new Date().toISOString().split("T")[0],
    ngay_ket_thuc: null,
    ghi_chu: `Từ pipeline ${card.ma_yc}`,
  });
  return contract.id;
}

/** Tìm KH trùng SĐT */
export async function findExistingCustomer(sdt: string): Promise<{ id: string; ten_kh: string; ma_kh: string } | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, ten_kh, ma_kh")
    .eq("sdt", sdt)
    .limit(1)
    .maybeSingle();
  return data;
}
