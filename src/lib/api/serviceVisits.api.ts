import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";
import { syncContractStatus } from "./contracts.api";

export interface MaterialUsage {
  id: string;
  ten: string;
  ma: string;
  so_luong: number;
  don_vi: string;
  don_gia?: number;
  vat_pct?: number;
}

export interface ServiceVisit {
  id: string;
  contract_id: string;
  lan_thu: number;
  ngay_du_kien: string | null;
  ngay_thuc_te: string | null;
  gio_bat_dau: string | null;
  gio_ket_thuc: string | null;
  ktv_ids: string[];
  hoa_chat: MaterialUsage[];
  vat_tu: MaterialUsage[];
  anh_truoc: string[];
  anh_sau: string[];
  trang_thai: string;
  tien_cong: number;
  da_thanh_toan: number;
  ghi_chu_truoc: string | null;
  ghi_chu_sau: string | null;
  created_at: string;
  created_by: string | null;
}

export type CreateVisitInput = {
  contract_id: string;
  ngay_du_kien?: string;
  gio_bat_dau?: string;
  gio_ket_thuc?: string;
  ktv_ids?: string[];
  ghi_chu_truoc?: string;
};

export async function fetchVisitsByContract(contractId: string): Promise<ServiceVisit[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_visits")
    .select("*")
    .eq("contract_id", contractId)
    .order("lan_thu", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ServiceVisit[];
}

export async function fetchAllVisits(filters?: { from?: string; to?: string }): Promise<ServiceVisit[]> {
  const supabase = createClient();
  let query = supabase.from("service_visits").select("*").order("ngay_du_kien", { ascending: true });
  if (filters?.from) query = query.gte("ngay_du_kien", filters.from);
  if (filters?.to) query = query.lte("ngay_du_kien", filters.to);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ServiceVisit[];
}

export async function createVisit(input: CreateVisitInput): Promise<ServiceVisit> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // lan_thu is assigned by the BEFORE INSERT trigger in the database,
  // which serializes per contract so two concurrent inserts can't land
  // on the same number. We just pass 0 (the trigger treats 0/NULL as "auto").
  const { data, error } = await supabase
    .from("service_visits")
    .insert({ ...input, lan_thu: 0, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw error;

  await logActivity({ hanh_dong: "Tạo lần DV", module: "service_visits", chi_tiet: `Lần ${data.lan_thu}` });
  await syncContractStatus(input.contract_id);
  return data as ServiceVisit;
}

export async function updateVisit(id: string, updates: Partial<ServiceVisit>): Promise<ServiceVisit> {
  const supabase = createClient();
  const { id: _, contract_id, lan_thu, created_at, created_by, ...dbUpdates } = updates as Record<string, unknown>;
  const { data, error } = await supabase
    .from("service_visits")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ServiceVisit;
}

export async function completeVisit(id: string): Promise<void> {
  const supabase = createClient();

  // Get visit with materials
  const { data: visit } = await supabase
    .from("service_visits")
    .select("contract_id, lan_thu, hoa_chat, vat_tu, da_thanh_toan")
    .eq("id", id)
    .single();
  if (!visit) throw new Error("Visit not found");

  const { data: { user } } = await supabase.auth.getUser();

  // Auto xuất kho — insert the transaction record and atomically decrement
  // the stock via the adjust_stock RPC. Previously this was a read + write
  // pair that could double-spend under concurrency.
  const applyUsage = async (
    loai: "chemicals" | "supplies",
    items: MaterialUsage[]
  ) => {
    for (const item of items) {
      if (!item.so_luong || item.so_luong <= 0) continue;

      const { error: txErr } = await supabase.from("inventory_transactions").insert({
        loai,
        item_id: item.id,
        loai_giao_dich: "Xuất",
        so_luong: item.so_luong,
        don_vi: item.don_vi,
        ghi_chu: `Auto xuất kho - Lần DV`,
        created_by: user?.id ?? null,
      });
      if (txErr) throw txErr;

      const { error: rpcErr } = await supabase.rpc("adjust_stock", {
        p_loai: loai,
        p_item_id: item.id,
        p_delta: -item.so_luong,
      });
      if (rpcErr) throw rpcErr;
    }
  };

  await applyUsage("chemicals", (visit.hoa_chat || []) as MaterialUsage[]);
  await applyUsage("supplies", (visit.vat_tu || []) as MaterialUsage[]);

  // Update visit status
  await supabase.from("service_visits").update({
    trang_thai: "Hoàn thành",
    ngay_thuc_te: new Date().toISOString().split("T")[0],
  }).eq("id", id);

  // Sync contract status based on all visits + end date
  await syncContractStatus(visit.contract_id);

  await logActivity({ hanh_dong: "Hoàn thành DV", module: "service_visits", chi_tiet: `Lần ${visit.lan_thu}` });
}

export async function deleteVisit(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("service_visits").delete().eq("id", id);
  if (error) throw error;
}

// Auto-generate visits for periodic contracts
export async function autoGenerateVisits(contractId: string, soLan: number, ngayBatDau: string, tanSuat: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const start = new Date(ngayBatDau);
  const visits = [];

  for (let i = 0; i < soLan; i++) {
    const date = new Date(start);
    if (tanSuat === "1 tháng") date.setMonth(date.getMonth() + i);
    else if (tanSuat === "2 tháng") date.setMonth(date.getMonth() + i * 2);
    else if (tanSuat === "3 tháng") date.setMonth(date.getMonth() + i * 3);
    else if (tanSuat === "6 tháng") date.setMonth(date.getMonth() + i * 6);
    else if (tanSuat === "Năm") date.setFullYear(date.getFullYear() + i);
    else date.setMonth(date.getMonth() + i); // default monthly

    visits.push({
      contract_id: contractId,
      lan_thu: i + 1,
      ngay_du_kien: date.toISOString().split("T")[0],
      trang_thai: "Đã lên lịch",
      created_by: user?.id ?? null,
    });
  }

  const { error } = await supabase.from("service_visits").insert(visits);
  if (error) throw error;

  await logActivity({ hanh_dong: "Auto tạo lịch DV", module: "service_visits", chi_tiet: `${soLan} lần` });
  await syncContractStatus(contractId);
}
