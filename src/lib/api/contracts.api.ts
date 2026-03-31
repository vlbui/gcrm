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
  created_at: string;
  created_by: string | null;
  // Joined
  customers?: {
    ten_kh: string;
    ma_kh: string;
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

export async function deleteContract(id: string) {
  const supabase = createClient();
  const { data: contract } = await supabase
    .from("contracts")
    .select("ma_hd")
    .eq("id", id)
    .single();

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
