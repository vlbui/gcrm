import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface Chemical {
  id: string;
  ma_hc: string;
  ten_thuong_mai: string;
  hoat_chat: string | null;
  doi_tuong: string | null;
  dang_su_dung: string | null;
  don_vi_tinh: string | null;
  nha_cung_cap: string | null;
  supplier_id?: string | null;
  don_gia?: number;
  so_luong_ton?: number;
  nguong_canh_bao?: number;
  han_su_dung?: string | null;
  xuat_xu?: string | null;
  ghi_chu: string | null;
  created_at: string;
  created_by: string | null;
  // Joined
  suppliers?: { ten_ncc: string } | null;
}

export type CreateChemicalInput = Omit<Chemical, "id" | "ma_hc" | "created_at" | "created_by">;

async function generateMaHC(): Promise<string> {
  const supabase = createClient();
  const { count } = await supabase
    .from("chemicals")
    .select("*", { count: "exact", head: true });
  const nextNum = (count ?? 0) + 1;
  return `GS-HC${String(nextNum).padStart(3, "0")}`;
}

export async function fetchChemicals(): Promise<Chemical[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chemicals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchChemical(id: string): Promise<Chemical> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chemicals")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createChemical(input: CreateChemicalInput): Promise<Chemical> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ma_hc = await generateMaHC();
  const { data, error } = await supabase
    .from("chemicals")
    .insert({
      ma_hc,
      ...input,
      created_by: user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Thêm hóa chất",
    module: "chemicals",
    chi_tiet: `${ma_hc} - ${input.ten_thuong_mai}`,
  });

  return data;
}

export async function updateChemical(
  id: string,
  updates: Partial<CreateChemicalInput>
): Promise<Chemical> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chemicals")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật hóa chất",
    module: "chemicals",
    chi_tiet: `${data.ma_hc} - ${data.ten_thuong_mai}`,
  });

  return data;
}

export async function deleteChemical(id: string) {
  const supabase = createClient();
  const { data: chemical } = await supabase
    .from("chemicals")
    .select("ma_hc, ten_thuong_mai")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("chemicals").delete().eq("id", id);
  if (error) throw error;

  if (chemical) {
    await logActivity({
      hanh_dong: "Xóa hóa chất",
      module: "chemicals",
      chi_tiet: `${chemical.ma_hc} - ${chemical.ten_thuong_mai}`,
    });
  }
}
