import { createClient } from "@/lib/supabase/client";

export interface ServiceRequest {
  id: string;
  ma_yc: string;
  ten_kh: string;
  sdt: string;
  email: string | null;
  dia_chi: string | null;
  loai_hinh: string | null;
  loai_con_trung: string | null;
  dien_tich: string | null;
  mo_ta: string | null;
  anh_hien_truong: string[] | null;
  trang_thai: string;
  ghi_chu_nv: string | null;
  xu_ly_boi: string | null;
  created_at: string;
}

export interface CreateServiceRequestInput {
  ten_kh: string;
  sdt: string;
  email?: string;
  dia_chi?: string;
  loai_hinh?: string;
  loai_con_trung?: string;
  dien_tich?: string;
  mo_ta?: string;
}

export async function createServiceRequest(input: CreateServiceRequestInput) {
  const supabase = createClient();

  // Generate mã yêu cầu
  const { count } = await supabase
    .from("service_requests")
    .select("*", { count: "exact", head: true });

  const nextNum = (count ?? 0) + 1;
  const ma_yc = `GS-YC${String(nextNum).padStart(3, "0")}`;

  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      ma_yc,
      ...input,
      trang_thai: "Mới",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchServiceRequests(): Promise<ServiceRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateServiceRequest(
  id: string,
  updates: Partial<ServiceRequest>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_requests")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
