import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface ServiceHistory {
  id: string;
  ma_lsdv: string;
  contract_id: string;
  customer_id: string;
  ngay_thuc_hien: string;
  ktv_thuc_hien: string | null;
  hoa_chat_su_dung: { id: string; ten: string; lieu_luong: string }[] | null;
  vat_tu_su_dung: { id: string; ten: string; so_luong: number }[] | null;
  ket_qua: string | null;
  ghi_chu: string | null;
  anh_truoc: string[] | null;
  anh_sau: string[] | null;
  created_at: string;
  created_by: string | null;
  // Joined
  contracts?: {
    ma_hd: string;
    dich_vu: string;
  };
  customers?: {
    ten_kh: string;
    ma_kh: string;
  };
}

export type CreateServiceHistoryInput = Omit<
  ServiceHistory,
  "id" | "ma_lsdv" | "created_at" | "created_by" | "contracts" | "customers"
>;

async function generateMaLSDV(): Promise<string> {
  const supabase = createClient();
  const year = new Date().getFullYear();
  const prefix = `GS-LS-${year}-`;
  // Year-scoped so the sequence restarts each year.
  const { count } = await supabase
    .from("service_history")
    .select("*", { count: "exact", head: true })
    .ilike("ma_lsdv", `${prefix}%`);
  const nextNum = (count ?? 0) + 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

export async function fetchServiceHistories(): Promise<ServiceHistory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_history")
    .select("*, contracts(ma_hd, dich_vu), customers(ten_kh, ma_kh)")
    .order("ngay_thuc_hien", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchServiceHistory(id: string): Promise<ServiceHistory> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_history")
    .select("*, contracts(ma_hd, dich_vu), customers(ten_kh, ma_kh)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchServiceHistoriesByContract(
  contractId: string
): Promise<ServiceHistory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_history")
    .select("*, contracts(ma_hd, dich_vu), customers(ten_kh, ma_kh)")
    .eq("contract_id", contractId)
    .order("ngay_thuc_hien", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createServiceHistory(
  input: CreateServiceHistoryInput
): Promise<ServiceHistory> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ma_lsdv = await generateMaLSDV();
  const { data, error } = await supabase
    .from("service_history")
    .insert({
      ma_lsdv,
      ...input,
      created_by: user?.id ?? null,
    })
    .select("*, contracts(ma_hd, dich_vu), customers(ten_kh, ma_kh)")
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Thêm lịch sử dịch vụ",
    module: "service_history",
    chi_tiet: `${ma_lsdv} - ${input.ngay_thuc_hien}`,
  });

  return data;
}

export async function updateServiceHistory(
  id: string,
  updates: Partial<CreateServiceHistoryInput>
): Promise<ServiceHistory> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_history")
    .update(updates)
    .eq("id", id)
    .select("*, contracts(ma_hd, dich_vu), customers(ten_kh, ma_kh)")
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật lịch sử dịch vụ",
    module: "service_history",
    chi_tiet: data.ma_lsdv,
  });

  return data;
}

export async function deleteServiceHistory(id: string) {
  const supabase = createClient();
  const { data: record } = await supabase
    .from("service_history")
    .select("ma_lsdv")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("service_history").delete().eq("id", id);
  if (error) throw error;

  if (record) {
    await logActivity({
      hanh_dong: "Xóa lịch sử dịch vụ",
      module: "service_history",
      chi_tiet: record.ma_lsdv,
    });
  }
}
