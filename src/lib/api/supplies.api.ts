import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface Supply {
  id: string;
  ma_vt: string;
  ten_vat_tu: string;
  loai_vt: string | null;
  don_vi_tinh: string | null;
  nha_cung_cap: string | null;
  supplier_id?: string | null;
  quy_cach?: string | null;
  don_gia?: number;
  vat_pct?: number;
  so_luong_ton?: number;
  nguong_canh_bao?: number;
  ghi_chu: string | null;
  created_at: string;
  created_by: string | null;
  // Joined
  suppliers?: { ten_ncc: string } | null;
}

export type CreateSupplyInput = Omit<Supply, "id" | "ma_vt" | "created_at" | "created_by">;

async function generateMaVT(): Promise<string> {
  const supabase = createClient();
  const { count } = await supabase
    .from("supplies")
    .select("*", { count: "exact", head: true });
  const nextNum = (count ?? 0) + 1;
  return `GS-VT${String(nextNum).padStart(3, "0")}`;
}

export async function fetchSupplies(): Promise<Supply[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supplies")
    .select("*, suppliers(ten_ncc)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSupply(id: string): Promise<Supply> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supplies")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createSupply(input: CreateSupplyInput): Promise<Supply> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ma_vt = await generateMaVT();
  const { data, error } = await supabase
    .from("supplies")
    .insert({
      ma_vt,
      ...input,
      created_by: user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Thêm vật tư",
    module: "supplies",
    chi_tiet: `${ma_vt} - ${input.ten_vat_tu}`,
  });

  return data;
}

export async function updateSupply(
  id: string,
  updates: Partial<CreateSupplyInput>
): Promise<Supply> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("supplies")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật vật tư",
    module: "supplies",
    chi_tiet: `${data.ma_vt} - ${data.ten_vat_tu}`,
  });

  return data;
}

export async function deleteSupply(id: string) {
  const supabase = createClient();
  const { data: supply } = await supabase
    .from("supplies")
    .select("ma_vt, ten_vat_tu")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("supplies").delete().eq("id", id);
  if (error) throw error;

  if (supply) {
    await logActivity({
      hanh_dong: "Xóa vật tư",
      module: "supplies",
      chi_tiet: `${supply.ma_vt} - ${supply.ten_vat_tu}`,
    });
  }
}
