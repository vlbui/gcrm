import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface ChemicalUsage {
  id: string;
  ten: string;
  so_luong: number;
  don_vi: string;
}

export interface DealService {
  id: string;
  deal_id: string;
  lan_thu: number;
  ngay_thuc_hien: string | null;
  gio_bat_dau: string | null;
  gio_ket_thuc: string | null;
  ktv_ids: string[];
  hoa_chat: ChemicalUsage[];
  vat_tu: ChemicalUsage[];
  anh_truoc: string[];
  anh_sau: string[];
  ket_qua: string;
  ghi_chu: string | null;
  created_at: string;
  created_by: string | null;
}

export type CreateDealServiceInput = {
  deal_id: string;
  ngay_thuc_hien?: string;
  gio_bat_dau?: string;
  gio_ket_thuc?: string;
  ktv_ids?: string[];
  ghi_chu?: string;
};

export async function fetchDealServices(dealId: string): Promise<DealService[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deal_services")
    .select("*")
    .eq("deal_id", dealId)
    .order("lan_thu", { ascending: true });
  if (error) throw error;
  return (data ?? []) as DealService[];
}

export async function createDealService(input: CreateDealServiceInput): Promise<DealService> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Tính lần thứ mấy
  const { count } = await supabase
    .from("deal_services")
    .select("*", { count: "exact", head: true })
    .eq("deal_id", input.deal_id);

  const lan_thu = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("deal_services")
    .insert({
      ...input,
      lan_thu,
      created_by: user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Tạo lịch DV",
    module: "deal_services",
    chi_tiet: `Lần ${lan_thu}`,
  });

  return data as DealService;
}

export async function updateDealService(
  id: string,
  updates: Partial<Omit<DealService, "id" | "deal_id" | "lan_thu" | "created_at" | "created_by">>
): Promise<DealService> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deal_services")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DealService;
}

export async function deleteDealService(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("deal_services").delete().eq("id", id);
  if (error) throw error;
}
