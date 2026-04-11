import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export const DEAL_STAGES = [
  { key: "Khách hỏi", label: "Khách hỏi", color: "#6B7280" },
  { key: "Tư vấn", label: "Tư vấn", color: "#3B82F6" },
  { key: "Báo giá", label: "Báo giá", color: "#F59E0B" },
  { key: "Chốt", label: "Chốt", color: "#10B981" },
  { key: "Triển khai", label: "Triển khai", color: "#2E7D32" },
  { key: "Hoàn thành", label: "Hoàn thành", color: "#059669" },
  { key: "Chăm sóc", label: "Chăm sóc", color: "#8B5CF6" },
] as const;

export type DealStage = (typeof DEAL_STAGES)[number]["key"];

export interface PaymentRecord {
  id: string;
  so_tien: number;
  ngay_tt: string;
  hinh_thuc: string;
  ghi_chu?: string;
}

export interface Deal {
  id: string;
  ma_deal: string;
  giai_doan: DealStage;
  loai_kh: string;
  ten_kh: string;
  sdt: string;
  email: string | null;
  dia_chi: string | null;
  ten_cong_ty: string | null;
  nguoi_lien_he: string | null;
  loai_hinh: string | null;
  dich_vu: string[];
  loai_con_trung: string[];
  dien_tich: number | null;
  gia_tri: number;
  ngay_hen: string | null;
  ngay_thuc_hien: string | null;
  ngay_hoan_thanh: string | null;
  ktv_phu_trach: string[];
  hoa_chat_su_dung: Record<string, unknown>[];
  vat_tu_su_dung: Record<string, unknown>[];
  anh_truoc: string[];
  anh_sau: string[];
  thanh_toan: PaymentRecord[];
  trang_thai_thanh_toan: string;
  ghi_chu: string | null;
  uu_tien: number;
  nguoi_phu_trach: string | null;
  created_at: string;
  updated_at: string;
  // Virtual
  users?: { ho_ten: string } | null;
}

export type CreateDealInput = {
  ten_kh: string;
  sdt: string;
  giai_doan?: DealStage;
  loai_kh?: string;
  email?: string;
  dia_chi?: string;
  ten_cong_ty?: string;
  nguoi_lien_he?: string;
  loai_hinh?: string;
  loai_con_trung?: string[];
  dich_vu?: string[];
  dien_tich?: number;
  gia_tri?: number;
  ghi_chu?: string;
  nguoi_phu_trach?: string;
  ktv_phu_trach?: string[];
};

async function generateMaDeal(): Promise<string> {
  const supabase = createClient();
  const year = new Date().getFullYear();
  const prefix = `D-${year}-`;
  // Scope to this year so numbering restarts each year.
  const { count } = await supabase
    .from("deals")
    .select("*", { count: "exact", head: true })
    .ilike("ma_deal", `${prefix}%`);
  return `${prefix}${String((count ?? 0) + 1).padStart(4, "0")}`;
}

const SELECT = "*, users:nguoi_phu_trach(ho_ten)";

export async function fetchDeals(): Promise<Deal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(SELECT)
    .order("uu_tien", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({
    ...d,
    users: Array.isArray(d.users) ? d.users[0] ?? null : d.users,
  })) as Deal[];
}

export async function fetchDeal(id: string): Promise<Deal> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(SELECT)
    .eq("id", id)
    .single();
  if (error) throw error;
  return {
    ...data,
    users: Array.isArray(data.users) ? data.users[0] ?? null : data.users,
  } as Deal;
}

export async function createDeal(input: CreateDealInput): Promise<Deal> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ma_deal = await generateMaDeal();

  const { data, error } = await supabase
    .from("deals")
    .insert({
      ma_deal,
      ...input,
      nguoi_phu_trach: input.nguoi_phu_trach || user?.id || null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Tạo deal",
    module: "deals",
    chi_tiet: `${ma_deal} - ${input.ten_kh}`,
  });

  return {
    ...data,
    users: Array.isArray(data.users) ? data.users[0] ?? null : data.users,
  } as Deal;
}

export async function updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
  const supabase = createClient();
  // Remove virtual fields
  const { users, ma_deal, created_at, updated_at, id: _id, ...dbUpdates } = updates as Record<string, unknown>;

  const { data, error } = await supabase
    .from("deals")
    .update(dbUpdates)
    .eq("id", id)
    .select(SELECT)
    .single();
  if (error) throw error;

  return {
    ...data,
    users: Array.isArray(data.users) ? data.users[0] ?? null : data.users,
  } as Deal;
}

// Allowlist of fields that can be updated via updateDealField.
// DO NOT add: id, ma_deal, created_at, updated_at, or any virtual join field.
const UPDATABLE_DEAL_FIELDS = new Set<keyof Deal>([
  "giai_doan",
  "loai_kh",
  "ten_kh",
  "sdt",
  "email",
  "dia_chi",
  "ten_cong_ty",
  "nguoi_lien_he",
  "loai_hinh",
  "dich_vu",
  "loai_con_trung",
  "dien_tich",
  "gia_tri",
  "ngay_hen",
  "ngay_thuc_hien",
  "ngay_hoan_thanh",
  "ktv_phu_trach",
  "hoa_chat_su_dung",
  "vat_tu_su_dung",
  "anh_truoc",
  "anh_sau",
  "trang_thai_thanh_toan",
  "ghi_chu",
  "uu_tien",
  "nguoi_phu_trach",
]);

export async function updateDealField(
  id: string,
  field: keyof Deal,
  value: unknown
): Promise<void> {
  if (!UPDATABLE_DEAL_FIELDS.has(field)) {
    throw new Error(`Field "${String(field)}" is not updatable`);
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("deals")
    .update({ [field]: value })
    .eq("id", id);
  if (error) throw error;
}

export async function updateDealStage(id: string, giai_doan: DealStage): Promise<void> {
  const supabase = createClient();
  const updates: Record<string, unknown> = { giai_doan };

  if (giai_doan === "Hoàn thành") {
    updates.ngay_hoan_thanh = new Date().toISOString().split("T")[0];
  }

  const { error } = await supabase.from("deals").update(updates).eq("id", id);
  if (error) throw error;

  await logActivity({
    hanh_dong: "Chuyển giai đoạn",
    module: "deals",
    chi_tiet: giai_doan,
  });
}

export async function deleteDeal(id: string): Promise<void> {
  const supabase = createClient();
  const { data: deal } = await supabase.from("deals").select("ma_deal, ten_kh").eq("id", id).single();
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) throw error;

  if (deal) {
    await logActivity({
      hanh_dong: "Xóa deal",
      module: "deals",
      chi_tiet: `${deal.ma_deal} - ${deal.ten_kh}`,
    });
  }
}

export async function addPayment(dealId: string, payment: Omit<PaymentRecord, "id">): Promise<void> {
  const supabase = createClient();
  const { data: deal } = await supabase
    .from("deals")
    .select("thanh_toan, gia_tri")
    .eq("id", dealId)
    .single();
  if (!deal) throw new Error("Deal not found");

  const existing = (deal.thanh_toan || []) as PaymentRecord[];
  const newPayment: PaymentRecord = {
    id: crypto.randomUUID(),
    ...payment,
  };
  const allPayments = [...existing, newPayment];
  const totalPaid = allPayments.reduce((s, p) => s + p.so_tien, 0);
  const giaTriDeal = deal.gia_tri || 0;

  let trang_thai_thanh_toan = "Chưa TT";
  if (totalPaid >= giaTriDeal && giaTriDeal > 0) trang_thai_thanh_toan = "Đã TT";
  else if (totalPaid > 0) trang_thai_thanh_toan = "Đã cọc";

  await supabase
    .from("deals")
    .update({ thanh_toan: allPayments, trang_thai_thanh_toan })
    .eq("id", dealId);

  await logActivity({
    hanh_dong: "Thêm thanh toán",
    module: "deals",
    chi_tiet: `${payment.so_tien.toLocaleString()}đ`,
  });
}

// Dashboard queries
export async function fetchDealStats(dateFrom?: string, dateTo?: string) {
  const supabase = createClient();
  let query = supabase.from("deals").select("giai_doan, gia_tri, thanh_toan, created_at, loai_con_trung, ktv_phu_trach");

  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
