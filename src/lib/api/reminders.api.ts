import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface Reminder {
  id: string;
  customer_id: string | null;
  contract_id: string | null;
  service_visit_id: string | null;
  loai: string;
  ngay_nhac: string;
  noi_dung: string | null;
  trang_thai: string;
  nguoi_phu_trach: string | null;
  created_at: string;
  // Joined
  customers?: { ten_kh: string; ma_kh: string } | null;
  contracts?: { ma_hd: string; dich_vu: string } | null;
  users?: { ho_ten: string } | null;
}

export type CreateReminderInput = {
  customer_id?: string;
  contract_id?: string;
  service_visit_id?: string;
  loai: string;
  ngay_nhac: string;
  noi_dung?: string;
  nguoi_phu_trach?: string;
};

const SELECT = "*, customers(ten_kh, ma_kh), contracts(ma_hd, dich_vu), users:nguoi_phu_trach(ho_ten)";

export async function fetchReminders(filters?: {
  trang_thai?: string;
  from?: string;
  to?: string;
}): Promise<Reminder[]> {
  const supabase = createClient();
  let query = supabase.from("reminders").select(SELECT).order("ngay_nhac", { ascending: true });
  if (filters?.trang_thai) query = query.eq("trang_thai", filters.trang_thai);
  if (filters?.from) query = query.gte("ngay_nhac", filters.from);
  if (filters?.to) query = query.lte("ngay_nhac", filters.to);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((d) => ({
    ...d,
    users: Array.isArray(d.users) ? d.users[0] ?? null : d.users,
  })) as Reminder[];
}

export async function fetchTodayReminders(): Promise<Reminder[]> {
  const today = new Date().toISOString().split("T")[0];
  return fetchReminders({ trang_thai: "Chờ", from: today, to: today });
}

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const supabase = createClient();
  const { data, error } = await supabase.from("reminders").insert(input).select(SELECT).single();
  if (error) throw error;
  await logActivity({ hanh_dong: "Tạo nhắc nhở", module: "reminders", chi_tiet: input.loai });
  return { ...data, users: Array.isArray(data.users) ? data.users[0] ?? null : data.users } as Reminder;
}

export async function updateReminder(id: string, updates: Partial<{ trang_thai: string; noi_dung: string }>): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reminders").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteReminder(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
}

// Auto-create reminders when completing a service visit
export async function autoCreateReminders(contractId: string, customerId: string): Promise<void> {
  const supabase = createClient();
  const today = new Date();

  // 7 days after: "Hỏi thăm"
  const hoiTham = new Date(today);
  hoiTham.setDate(hoiTham.getDate() + 7);

  await supabase.from("reminders").insert({
    customer_id: customerId,
    contract_id: contractId,
    loai: "Hỏi thăm",
    ngay_nhac: hoiTham.toISOString().split("T")[0],
    noi_dung: "Hỏi thăm sau dịch vụ - kiểm tra hiệu quả",
  });
}

// Auto-create for expiring contracts (call from dashboard/cron)
export async function createExpiryReminders(): Promise<number> {
  const supabase = createClient();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const today = new Date().toISOString().split("T")[0];
  const in30Str = in30.toISOString().split("T")[0];

  // Contracts expiring in 30 days without existing "Tái ký" reminder
  const { data: expiring } = await supabase
    .from("contracts")
    .select("id, customer_id, ma_hd, ngay_ket_thuc")
    .gte("ngay_ket_thuc", today)
    .lte("ngay_ket_thuc", in30Str)
    .in("trang_thai", ["Đang phục vụ"]);

  let created = 0;
  for (const c of expiring ?? []) {
    const { count } = await supabase
      .from("reminders")
      .select("*", { count: "exact", head: true })
      .eq("contract_id", c.id)
      .eq("loai", "Tái ký")
      .eq("trang_thai", "Chờ");

    if ((count ?? 0) === 0) {
      await supabase.from("reminders").insert({
        customer_id: c.customer_id,
        contract_id: c.id,
        loai: "Tái ký",
        ngay_nhac: today,
        noi_dung: `HĐ ${c.ma_hd} hết hạn ${c.ngay_ket_thuc}`,
      });
      created++;
    }
  }
  return created;
}
