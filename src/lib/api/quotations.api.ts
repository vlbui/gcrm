import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface QuotationItem {
  dich_vu: string;
  mo_ta: string;
  don_vi: string;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
}

export interface Quotation {
  id: string;
  ma_bg: string;
  customer_id: string | null;
  service_request_id: string | null;
  noi_dung: QuotationItem[];
  tong_tien: number;
  vat: number;
  tong_thanh_toan: number;
  ghi_chu: string | null;
  dieu_khoan: string | null;
  trang_thai: string;
  ngay_tao: string;
  ngay_hieu_luc: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  customers?: { ten_kh: string; ma_kh: string; sdt: string; email: string | null; dia_chi: string | null } | null;
  service_requests?: { ma_yc: string; ten_kh: string } | null;
}

export type CreateQuotationInput = {
  customer_id?: string | null;
  service_request_id?: string | null;
  noi_dung: QuotationItem[];
  tong_tien: number;
  vat: number;
  tong_thanh_toan: number;
  ghi_chu?: string;
  dieu_khoan?: string;
  trang_thai?: string;
  ngay_hieu_luc?: string;
};

async function generateMaBG(): Promise<string> {
  const year = new Date().getFullYear();
  const supabase = createClient();
  const { count } = await supabase
    .from("quotations")
    .select("*", { count: "exact", head: true });
  const nextNum = (count ?? 0) + 1;
  return `GS-BG-${year}-${String(nextNum).padStart(3, "0")}`;
}

export async function fetchQuotations(): Promise<Quotation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("*, customers(ten_kh, ma_kh, sdt, email, dia_chi), service_requests(ma_yc, ten_kh)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Quotation[];
}

export async function fetchQuotation(id: string): Promise<Quotation> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("*, customers(ten_kh, ma_kh, sdt, email, dia_chi), service_requests(ma_yc, ten_kh)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Quotation;
}

export async function createQuotation(input: CreateQuotationInput): Promise<Quotation> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ma_bg = await generateMaBG();

  const { data, error } = await supabase
    .from("quotations")
    .insert({
      ma_bg,
      ...input,
      created_by: user?.id ?? null,
    })
    .select("*, customers(ten_kh, ma_kh, sdt, email, dia_chi), service_requests(ma_yc, ten_kh)")
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Tạo báo giá",
    module: "quotations",
    chi_tiet: ma_bg,
  });

  return data as Quotation;
}

export async function updateQuotation(id: string, updates: Partial<CreateQuotationInput>): Promise<Quotation> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("quotations")
    .update(updates)
    .eq("id", id)
    .select("*, customers(ten_kh, ma_kh, sdt, email, dia_chi), service_requests(ma_yc, ten_kh)")
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật báo giá",
    module: "quotations",
    chi_tiet: data.ma_bg,
  });

  return data as Quotation;
}

export async function deleteQuotation(id: string) {
  const supabase = createClient();
  const { data: q } = await supabase.from("quotations").select("ma_bg").eq("id", id).single();
  const { error } = await supabase.from("quotations").delete().eq("id", id);
  if (error) throw error;

  if (q) {
    await logActivity({
      hanh_dong: "Xóa báo giá",
      module: "quotations",
      chi_tiet: q.ma_bg,
    });
  }
}
