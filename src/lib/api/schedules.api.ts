import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface Schedule {
  id: string;
  contract_id: string | null;
  service_history_id: string | null;
  ngay_thuc_hien: string;
  gio_bat_dau: string | null;
  gio_ket_thuc: string | null;
  ktv_id: string | null;
  dia_diem: string | null;
  ghi_chu: string | null;
  trang_thai: string;
  check_in_time: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  created_at: string;
  created_by: string | null;
  // Joined
  users?: { ho_ten: string } | null;
  contracts?: { ma_hd: string; dich_vu: string; customers: { ten_kh: string } } | null;
}

export type CreateScheduleInput = {
  contract_id?: string | null;
  ngay_thuc_hien: string;
  gio_bat_dau?: string | null;
  gio_ket_thuc?: string | null;
  ktv_id?: string | null;
  dia_diem?: string;
  ghi_chu?: string;
  trang_thai?: string;
};

const SELECT_QUERY = "*, users:ktv_id(ho_ten), contracts(ma_hd, dich_vu, customers(ten_kh))";

export async function fetchSchedules(filters?: {
  from?: string;
  to?: string;
  ktv_id?: string;
}): Promise<Schedule[]> {
  const supabase = createClient();
  let query = supabase
    .from("schedules")
    .select(SELECT_QUERY)
    .order("ngay_thuc_hien", { ascending: true });

  if (filters?.from) query = query.gte("ngay_thuc_hien", filters.from);
  if (filters?.to) query = query.lte("ngay_thuc_hien", filters.to);
  if (filters?.ktv_id) query = query.eq("ktv_id", filters.ktv_id);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((d) => ({
    ...d,
    users: Array.isArray(d.users) ? d.users[0] ?? null : d.users,
  })) as Schedule[];
}

export async function createSchedule(input: CreateScheduleInput): Promise<Schedule> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("schedules")
    .insert({ ...input, created_by: user?.id ?? null })
    .select(SELECT_QUERY)
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Tạo lịch công việc",
    module: "schedules",
    chi_tiet: `${input.ngay_thuc_hien} - ${input.dia_diem || ""}`,
  });

  return {
    ...data,
    users: Array.isArray(data.users) ? data.users[0] ?? null : data.users,
  } as Schedule;
}

export async function updateSchedule(id: string, updates: Partial<CreateScheduleInput>): Promise<Schedule> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedules")
    .update(updates)
    .eq("id", id)
    .select(SELECT_QUERY)
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật lịch",
    module: "schedules",
    chi_tiet: data.ngay_thuc_hien,
  });

  return {
    ...data,
    users: Array.isArray(data.users) ? data.users[0] ?? null : data.users,
  } as Schedule;
}

export async function deleteSchedule(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw error;

  await logActivity({
    hanh_dong: "Xóa lịch công việc",
    module: "schedules",
    chi_tiet: "",
  });
}
