import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface MaterialUsage {
  id: string;
  ten: string;
  ma: string;
  so_luong: number;
  don_vi: string;
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

  const { count } = await supabase
    .from("service_visits")
    .select("*", { count: "exact", head: true })
    .eq("contract_id", input.contract_id);

  const { data, error } = await supabase
    .from("service_visits")
    .insert({ ...input, lan_thu: (count ?? 0) + 1, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw error;

  await logActivity({ hanh_dong: "Tạo lần DV", module: "service_visits", chi_tiet: `Lần ${data.lan_thu}` });
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
  const { data: visit } = await supabase.from("service_visits").select("hoa_chat, vat_tu").eq("id", id).single();
  if (!visit) throw new Error("Visit not found");

  // Auto xuất kho for chemicals
  const { data: { user } } = await supabase.auth.getUser();
  for (const hc of (visit.hoa_chat || []) as MaterialUsage[]) {
    if (hc.so_luong > 0) {
      await supabase.from("inventory_transactions").insert({
        loai: "chemicals", item_id: hc.id, loai_giao_dich: "Xuất",
        so_luong: hc.so_luong, don_vi: hc.don_vi,
        ghi_chu: `Auto xuất kho - Lần DV`, created_by: user?.id ?? null,
      });
      // Update stock
      const { data: chem } = await supabase.from("chemicals").select("so_luong_ton").eq("id", hc.id).single();
      if (chem) {
        await supabase.from("chemicals").update({ so_luong_ton: Math.max(0, (chem.so_luong_ton || 0) - hc.so_luong) }).eq("id", hc.id);
      }
    }
  }
  // Auto xuất kho for supplies
  for (const vt of (visit.vat_tu || []) as MaterialUsage[]) {
    if (vt.so_luong > 0) {
      await supabase.from("inventory_transactions").insert({
        loai: "supplies", item_id: vt.id, loai_giao_dich: "Xuất",
        so_luong: vt.so_luong, don_vi: vt.don_vi,
        ghi_chu: `Auto xuất kho - Lần DV`, created_by: user?.id ?? null,
      });
      const { data: sup } = await supabase.from("supplies").select("so_luong_ton").eq("id", vt.id).single();
      if (sup) {
        await supabase.from("supplies").update({ so_luong_ton: Math.max(0, (sup.so_luong_ton || 0) - vt.so_luong) }).eq("id", vt.id);
      }
    }
  }

  // Update status
  await supabase.from("service_visits").update({
    trang_thai: "Hoàn thành",
    ngay_thuc_te: new Date().toISOString().split("T")[0],
  }).eq("id", id);

  await logActivity({ hanh_dong: "Hoàn thành DV", module: "service_visits", chi_tiet: "" });
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
}
