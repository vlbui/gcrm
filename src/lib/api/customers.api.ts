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

  // Debug: check auth
  const { data: { session } } = await supabase.auth.getSession();
  console.log("Auth session:", session ? "YES" : "NO");
  console.log("Token:", session?.access_token?.substring(0, 20));

  const ma_kh = await generateMaKH(input.loai_kh);
  const { data, error } = await supabase
    .from("customers")
    .insert({
      ma_kh,
      ...input,
      created_by: session?.user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert error:", JSON.stringify(error));
    throw error;
  }

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
