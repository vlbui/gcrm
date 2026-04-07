import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface InventoryTransaction {
  id: string;
  loai: "chemicals" | "supplies";
  item_id: string;
  loai_giao_dich: string;
  so_luong: number;
  don_vi: string | null;
  service_history_id: string | null;
  nha_cung_cap: string | null;
  gia_nhap: number;
  ghi_chu: string | null;
  created_at: string;
  created_by: string | null;
  // Virtual - populated in code
  item_name?: string;
  item_code?: string;
}

export type CreateTransactionInput = {
  loai: "chemicals" | "supplies";
  item_id: string;
  loai_giao_dich: string;
  so_luong: number;
  don_vi?: string;
  service_history_id?: string | null;
  nha_cung_cap?: string;
  gia_nhap?: number;
  ghi_chu?: string;
};

export interface StockItem {
  id: string;
  code: string;
  name: string;
  type: "chemicals" | "supplies";
  don_vi: string | null;
  so_luong_ton: number;
  nguong_canh_bao: number;
  is_low: boolean;
}

export async function fetchTransactions(filters?: {
  loai?: string;
  loai_giao_dich?: string;
}): Promise<InventoryTransaction[]> {
  const supabase = createClient();
  let query = supabase
    .from("inventory_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.loai) query = query.eq("loai", filters.loai);
  if (filters?.loai_giao_dich) query = query.eq("loai_giao_dich", filters.loai_giao_dich);

  const { data, error } = await query;
  if (error) throw error;

  // Enrich with item names
  const transactions = data ?? [];
  const chemIds = transactions.filter((t) => t.loai === "chemicals").map((t) => t.item_id);
  const supplyIds = transactions.filter((t) => t.loai === "supplies").map((t) => t.item_id);

  const [chemsRes, suppliesRes] = await Promise.all([
    chemIds.length > 0
      ? supabase.from("chemicals").select("id, ma_hc, ten_thuong_mai").in("id", chemIds)
      : { data: [] },
    supplyIds.length > 0
      ? supabase.from("supplies").select("id, ma_vt, ten_vat_tu").in("id", supplyIds)
      : { data: [] },
  ]);

  const chemMap = new Map((chemsRes.data ?? []).map((c) => [c.id, { name: c.ten_thuong_mai, code: c.ma_hc }]));
  const supplyMap = new Map((suppliesRes.data ?? []).map((s) => [s.id, { name: s.ten_vat_tu, code: s.ma_vt }]));

  return transactions.map((t) => {
    const info = t.loai === "chemicals" ? chemMap.get(t.item_id) : supplyMap.get(t.item_id);
    return { ...t, item_name: info?.name ?? "—", item_code: info?.code ?? "—" };
  });
}

export async function createTransaction(input: CreateTransactionInput): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("inventory_transactions")
    .insert({ ...input, created_by: user?.id ?? null });
  if (error) throw error;

  // Update stock
  const table = input.loai === "chemicals" ? "chemicals" : "supplies";
  const { data: current } = await supabase
    .from(table)
    .select("so_luong_ton")
    .eq("id", input.item_id)
    .single();

  const currentQty = current?.so_luong_ton ?? 0;
  let newQty = currentQty;

  if (input.loai_giao_dich === "Nhập") {
    newQty = currentQty + input.so_luong;
  } else if (input.loai_giao_dich === "Xuất") {
    newQty = Math.max(0, currentQty - input.so_luong);
  } else {
    // Kiểm kê - set trực tiếp
    newQty = input.so_luong;
  }

  await supabase
    .from(table)
    .update({ so_luong_ton: newQty })
    .eq("id", input.item_id);

  await logActivity({
    hanh_dong: `${input.loai_giao_dich} kho`,
    module: "inventory",
    chi_tiet: `${input.loai === "chemicals" ? "Hóa chất" : "Vật tư"} x${input.so_luong}`,
  });
}

export async function fetchStock(): Promise<StockItem[]> {
  const supabase = createClient();
  const [chemsRes, suppliesRes] = await Promise.all([
    supabase.from("chemicals").select("id, ma_hc, ten_thuong_mai, don_vi_tinh, so_luong_ton, nguong_canh_bao"),
    supabase.from("supplies").select("id, ma_vt, ten_vat_tu, don_vi_tinh, so_luong_ton, nguong_canh_bao"),
  ]);

  const items: StockItem[] = [];

  for (const c of chemsRes.data ?? []) {
    const ton = c.so_luong_ton ?? 0;
    const nguong = c.nguong_canh_bao ?? 5;
    items.push({
      id: c.id,
      code: c.ma_hc,
      name: c.ten_thuong_mai,
      type: "chemicals",
      don_vi: c.don_vi_tinh,
      so_luong_ton: ton,
      nguong_canh_bao: nguong,
      is_low: ton <= nguong,
    });
  }

  for (const s of suppliesRes.data ?? []) {
    const ton = s.so_luong_ton ?? 0;
    const nguong = s.nguong_canh_bao ?? 5;
    items.push({
      id: s.id,
      code: s.ma_vt,
      name: s.ten_vat_tu,
      type: "supplies",
      don_vi: s.don_vi_tinh,
      so_luong_ton: ton,
      nguong_canh_bao: nguong,
      is_low: ton <= nguong,
    });
  }

  return items;
}
