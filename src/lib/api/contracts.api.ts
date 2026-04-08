import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface Contract {
  id: string;
  ma_hd: string;
  customer_id: string;
  dich_vu: string;
  dien_tich: string | null;
  gia_tri: number | null;
  trang_thai: string;
  ngay_bat_dau: string | null;
  ngay_ket_thuc: string | null;
  ghi_chu: string | null;
  // New V3 fields (optional — may not exist on old records)
  loai_hd?: string;
  tan_suat?: string | null;
  so_lan_du_kien?: number;
  giai_doan?: string;
  trang_thai_thanh_toan?: string | null;
  so_tien_da_tra?: number | null;
  created_at: string;
  created_by: string | null;
  // Joined
  customers?: {
    ten_kh: string;
    ma_kh: string;
    sdt?: string;
  };
}

export type CreateContractInput = Omit<Contract, "id" | "ma_hd" | "created_at" | "created_by" | "customers">;

async function generateMaHD(): Promise<string> {
  const year = new Date().getFullYear();
  const supabase = createClient();
  const { count } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true });
  const nextNum = (count ?? 0) + 1;
  return `GS-${year}-${String(nextNum).padStart(3, "0")}`;
}

export async function fetchContracts(): Promise<Contract[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("*, customers(ten_kh, ma_kh)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchContract(id: string): Promise<Contract> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("*, customers(ten_kh, ma_kh)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchContractsByCustomer(customerId: string): Promise<Contract[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("*, customers(ten_kh, ma_kh)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createContract(input: CreateContractInput): Promise<Contract> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ma_hd = await generateMaHD();
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      ma_hd,
      ...input,
      created_by: user?.id ?? null,
    })
    .select("*, customers(ten_kh, ma_kh)")
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Thêm hợp đồng",
    module: "contracts",
    chi_tiet: `${ma_hd} - ${input.dich_vu}`,
  });

  return data;
}

export async function updateContract(
  id: string,
  updates: Partial<CreateContractInput>
): Promise<Contract> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contracts")
    .update(updates)
    .eq("id", id)
    .select("*, customers(ten_kh, ma_kh)")
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật hợp đồng",
    module: "contracts",
    chi_tiet: `${data.ma_hd}`,
  });

  return data;
}

/**
 * Tự động tính và cập nhật trạng thái hợp đồng dựa trên:
 * - Trạng thái các lần dịch vụ (service_visits)
 * - Ngày kết thúc hợp đồng (ngay_ket_thuc)
 *
 * Logic:
 *  - Có visit "Đang làm" hoặc "Đã lên lịch" → "Đang phục vụ"
 *  - ngay_ket_thuc đã qua → "Kết thúc"
 *  - Tất cả visits ở trạng thái cuối (Hoàn thành/Hủy/Hoãn) → "Kết thúc"
 *  - Không có visit → giữ nguyên
 *  - Hợp đồng đã "Hủy" → không thay đổi
 */
export async function syncContractStatus(contractId: string): Promise<void> {
  const supabase = createClient();

  const { data: contract } = await supabase
    .from("contracts")
    .select("trang_thai, ngay_ket_thuc")
    .eq("id", contractId)
    .single();
  if (!contract || contract.trang_thai === "Hủy") return;

  const { data: visits } = await supabase
    .from("service_visits")
    .select("trang_thai")
    .eq("contract_id", contractId);

  const allVisits = visits ?? [];
  const today = new Date().toISOString().split("T")[0];

  let newStatus: string | null = null;

  const TERMINAL = ["Hoàn thành", "Hủy", "Hoãn"];
  const hasActive = allVisits.some((v) => v.trang_thai === "Đang làm" || v.trang_thai === "Đã lên lịch");
  const allDone = allVisits.length > 0 && allVisits.every((v) => TERMINAL.includes(v.trang_thai));

  if (hasActive) {
    newStatus = "Đang phục vụ";
  } else if (allDone || (contract.ngay_ket_thuc && contract.ngay_ket_thuc < today)) {
    newStatus = "Kết thúc";
  }

  if (newStatus && newStatus !== contract.trang_thai) {
    await supabase.from("contracts").update({ trang_thai: newStatus }).eq("id", contractId);
  }
}

export async function deleteContract(id: string) {
  const supabase = createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("ma_hd")
    .eq("id", id)
    .single();

  // Delete dependent records that have ON DELETE RESTRICT
  await supabase.from("service_history").delete().eq("contract_id", id);
  await supabase.from("payments").delete().eq("contract_id", id);

  const { error } = await supabase.from("contracts").delete().eq("id", id);
  if (error) throw error;

  if (contract) {
    await logActivity({
      hanh_dong: "Xóa hợp đồng",
      module: "contracts",
      chi_tiet: contract.ma_hd,
    });
  }
}
