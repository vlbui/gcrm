import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface Customer {
  id: string;
  ma_kh: string;
  ten_kh: string;
  sdt: string;
  email: string | null;
  dia_chi: string | null;
  loai_kh: string;
  trang_thai: string;
  ghi_chu: string | null;
  created_at: string;
  created_by: string | null;
}

export type CreateCustomerInput = Omit<Customer, "id" | "ma_kh" | "created_at" | "created_by">;

function getLoaiPrefix(loaiKh: string): string {
  if (loaiKh.includes("Doanh nghiệp") || loaiKh.includes("Khu công nghiệp")) return "DN";
  if (loaiKh.includes("chung cư") || loaiKh.includes("Văn phòng") || loaiKh.includes("Trường học")) return "VP";
  if (loaiKh.includes("Trang trại")) return "TT";
  return "CN";
}

async function generateMaKH(loaiKh: string): Promise<string> {
  const prefix = `GS-${getLoaiPrefix(loaiKh)}`;
  const supabase = createClient();
  const { data } = await supabase
    .from("customers")
    .select("ma_kh")
    .like("ma_kh", `${prefix}%`)
    .order("ma_kh", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return `${prefix}001`;

  const lastNum = parseInt(data[0].ma_kh.replace(prefix, "")) || 0;
  return `${prefix}${String(lastNum + 1).padStart(3, "0")}`;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCustomer(id: string): Promise<Customer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const ma_kh = await generateMaKH(input.loai_kh);
  const { data, error } = await supabase
    .from("customers")
    .insert({
      ma_kh,
      ...input,
      created_by: user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Thêm khách hàng",
    module: "customers",
    chi_tiet: `${ma_kh} - ${input.ten_kh}`,
  });

  return data;
}

export async function updateCustomer(
  id: string,
  updates: Partial<CreateCustomerInput>
): Promise<Customer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật khách hàng",
    module: "customers",
    chi_tiet: `${data.ma_kh} - ${data.ten_kh}`,
  });

  return data;
}

export async function deleteCustomer(id: string) {
  const supabase = createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("ma_kh, ten_kh")
    .eq("id", id)
    .single();

  // Delete dependent records that have ON DELETE RESTRICT
  const { data: contracts } = await supabase.from("contracts").select("id").eq("customer_id", id);
  for (const c of contracts ?? []) {
    await supabase.from("service_history").delete().eq("contract_id", c.id);
    await supabase.from("payments").delete().eq("contract_id", c.id);
  }
  await supabase.from("contracts").delete().eq("customer_id", id);
  await supabase.from("customer_care").delete().eq("customer_id", id);

  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;

  if (customer) {
    await logActivity({
      hanh_dong: "Xóa khách hàng",
      module: "customers",
      chi_tiet: `${customer.ma_kh} - ${customer.ten_kh}`,
    });
  }
}
