import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface Payment {
  id: string;
  ma_tt: string;
  contract_id: string;
  so_tien: number;
  ngay_tt: string;
  hinh_thuc: string;
  ghi_chu: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  contracts?: {
    ma_hd: string;
    gia_tri: number;
    customers: { ten_kh: string; ma_kh: string };
  };
}

export type CreatePaymentInput = {
  contract_id: string;
  so_tien: number;
  ngay_tt: string;
  hinh_thuc: string;
  ghi_chu?: string;
};

async function generateMaTT(): Promise<string> {
  const supabase = createClient();
  const { count } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true });
  const nextNum = (count ?? 0) + 1;
  return `GS-TT-${String(nextNum).padStart(3, "0")}`;
}

export async function fetchPayments(): Promise<Payment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, contracts(ma_hd, gia_tri, customers(ten_kh, ma_kh))")
    .order("ngay_tt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function fetchPaymentsByContract(contractId: string): Promise<Payment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*, contracts(ma_hd, gia_tri, customers(ten_kh, ma_kh))")
    .eq("contract_id", contractId)
    .order("ngay_tt", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ma_tt = await generateMaTT();

  const { data, error } = await supabase
    .from("payments")
    .insert({ ma_tt, ...input, created_by: user?.id ?? null })
    .select("*, contracts(ma_hd, gia_tri, customers(ten_kh, ma_kh))")
    .single();
  if (error) throw error;

  // Update contract payment status
  await updateContractPaymentStatus(input.contract_id);

  await logActivity({
    hanh_dong: "Thêm thanh toán",
    module: "payments",
    chi_tiet: `${ma_tt} - ${input.so_tien.toLocaleString()}đ`,
  });

  return data as Payment;
}

export async function deletePayment(id: string) {
  const supabase = createClient();
  const { data: payment } = await supabase
    .from("payments")
    .select("ma_tt, contract_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;

  if (payment) {
    await updateContractPaymentStatus(payment.contract_id);
    await logActivity({
      hanh_dong: "Xóa thanh toán",
      module: "payments",
      chi_tiet: payment.ma_tt,
    });
  }
}

async function updateContractPaymentStatus(contractId: string) {
  const supabase = createClient();

  // Get contract value
  const { data: contract } = await supabase
    .from("contracts")
    .select("gia_tri")
    .eq("id", contractId)
    .single();

  // Sum all payments for this contract
  const { data: payments } = await supabase
    .from("payments")
    .select("so_tien")
    .eq("contract_id", contractId);

  const totalPaid = (payments ?? []).reduce((sum, p) => sum + (p.so_tien || 0), 0);
  const contractValue = contract?.gia_tri || 0;

  let trang_thai_thanh_toan = "Chưa TT";
  if (totalPaid >= contractValue && contractValue > 0) {
    trang_thai_thanh_toan = "Đã TT";
  } else if (totalPaid > 0) {
    trang_thai_thanh_toan = "Đã cọc";
  }

  const { error } = await supabase
    .from("contracts")
    .update({ so_tien_da_tra: totalPaid, trang_thai_thanh_toan })
    .eq("id", contractId);

  if (error) throw new Error(`Cập nhật trạng thái HĐ thất bại: ${error.message}`);
}

export interface DebtRecord {
  customer_id: string;
  ten_kh: string;
  ma_kh: string;
  contracts: {
    id: string;
    ma_hd: string;
    gia_tri: number;
    so_tien_da_tra: number;
    con_no: number;
    trang_thai_thanh_toan: string;
  }[];
  tong_gia_tri: number;
  tong_da_tra: number;
  tong_con_no: number;
}

export async function fetchDebts(): Promise<DebtRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, ma_hd, gia_tri, so_tien_da_tra, trang_thai_thanh_toan, customer_id, customers(ten_kh, ma_kh)")
    .neq("trang_thai_thanh_toan", "Đã TT")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const grouped = new Map<string, DebtRecord>();
  for (const c of data ?? []) {
    const cust = c.customers as unknown as { ten_kh: string; ma_kh: string };
    const gia_tri = c.gia_tri || 0;
    const da_tra = c.so_tien_da_tra || 0;
    const con_no = gia_tri - da_tra;

    if (!grouped.has(c.customer_id)) {
      grouped.set(c.customer_id, {
        customer_id: c.customer_id,
        ten_kh: cust.ten_kh,
        ma_kh: cust.ma_kh,
        contracts: [],
        tong_gia_tri: 0,
        tong_da_tra: 0,
        tong_con_no: 0,
      });
    }
    const record = grouped.get(c.customer_id)!;
    record.contracts.push({
      id: c.id,
      ma_hd: c.ma_hd,
      gia_tri,
      so_tien_da_tra: da_tra,
      con_no,
      trang_thai_thanh_toan: c.trang_thai_thanh_toan || "Chưa TT",
    });
    record.tong_gia_tri += gia_tri;
    record.tong_da_tra += da_tra;
    record.tong_con_no += con_no;
  }

  return Array.from(grouped.values()).sort((a, b) => b.tong_con_no - a.tong_con_no);
}
