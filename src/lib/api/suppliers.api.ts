import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface Supplier {
  id: string;
  ma_ncc: string;
  ten_ncc: string;
  sdt: string | null;
  email: string | null;
  dia_chi: string | null;
  ghi_chu: string | null;
  created_at: string;
  created_by: string | null;
}

export type CreateSupplierInput = Omit<Supplier, "id" | "ma_ncc" | "created_at" | "created_by">;

async function generateMaNCC(): Promise<string> {
  const supabase = createClient();
  const { count } = await supabase
    .from("suppliers")
    .select("*", { count: "exact", head: true });
  const nextNum = (count ?? 0) + 1;
  return `GS-NCC${String(nextNum).padStart(3, "0")}`;
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ma_ncc = await generateMaNCC();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      ma_ncc,
      ...input,
      created_by: user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Thêm nhà cung cấp",
    module: "suppliers",
    chi_tiet: `${ma_ncc} - ${input.ten_ncc}`,
  });

  return data;
}

export async function updateSupplier(
  id: string,
  updates: Partial<CreateSupplierInput>
): Promise<Supplier> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật nhà cung cấp",
    module: "suppliers",
    chi_tiet: `${data.ma_ncc} - ${data.ten_ncc}`,
  });

  return data;
}

export async function deleteSupplier(id: string) {
  const supabase = createClient();
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("ma_ncc, ten_ncc")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw error;

  if (supplier) {
    await logActivity({
      hanh_dong: "Xóa nhà cung cấp",
      module: "suppliers",
      chi_tiet: `${supplier.ma_ncc} - ${supplier.ten_ncc}`,
    });
  }
}
