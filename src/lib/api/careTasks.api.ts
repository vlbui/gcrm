import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface CareTask {
  id: string;
  ma_cs: string;
  customer_id: string;
  contract_id: string | null;
  loai: string;
  ngay_hen: string;
  noi_dung: string | null;
  trang_thai: string;
  nguoi_phu_trach: string | null;
  ket_qua: string | null;
  created_at: string;
  completed_at: string | null;
  // Joined
  customers?: { ten_kh: string; ma_kh: string; sdt: string } | null;
  contracts?: { ma_hd: string } | null;
  users?: { ho_ten: string } | null;
}

export type CreateCareTaskInput = {
  customer_id: string;
  contract_id?: string | null;
  loai: string;
  ngay_hen: string;
  noi_dung?: string;
  nguoi_phu_trach?: string | null;
};

const SELECT_QUERY = "*, customers(ten_kh, ma_kh, sdt), contracts(ma_hd), users:nguoi_phu_trach(ho_ten)";

async function generateMaCS(): Promise<string> {
  const supabase = createClient();
  const { count } = await supabase
    .from("care_tasks")
    .select("*", { count: "exact", head: true });
  return `GS-CS-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function fetchCareTasks(filters?: {
  trang_thai?: string;
  nguoi_phu_trach?: string;
}): Promise<CareTask[]> {
  const supabase = createClient();
  let query = supabase
    .from("care_tasks")
    .select(SELECT_QUERY)
    .order("ngay_hen", { ascending: true });

  if (filters?.trang_thai) query = query.eq("trang_thai", filters.trang_thai);
  if (filters?.nguoi_phu_trach) query = query.eq("nguoi_phu_trach", filters.nguoi_phu_trach);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((d) => ({
    ...d,
    users: Array.isArray(d.users) ? d.users[0] ?? null : d.users,
  })) as CareTask[];
}

export async function createCareTask(input: CreateCareTaskInput): Promise<CareTask> {
  const supabase = createClient();
  const ma_cs = await generateMaCS();

  const { data, error } = await supabase
    .from("care_tasks")
    .insert({ ma_cs, ...input })
    .select(SELECT_QUERY)
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Tạo task chăm sóc",
    module: "care_tasks",
    chi_tiet: `${ma_cs} - ${input.loai}`,
  });

  return {
    ...data,
    users: Array.isArray(data.users) ? data.users[0] ?? null : data.users,
  } as CareTask;
}

export async function updateCareTask(id: string, updates: Partial<CreateCareTaskInput & { trang_thai: string; ket_qua: string; completed_at: string }>): Promise<CareTask> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("care_tasks")
    .update(updates)
    .eq("id", id)
    .select(SELECT_QUERY)
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật chăm sóc",
    module: "care_tasks",
    chi_tiet: data.ma_cs,
  });

  return {
    ...data,
    users: Array.isArray(data.users) ? data.users[0] ?? null : data.users,
  } as CareTask;
}

export async function deleteCareTask(id: string) {
  const supabase = createClient();
  const { data: task } = await supabase.from("care_tasks").select("ma_cs").eq("id", id).single();
  const { error } = await supabase.from("care_tasks").delete().eq("id", id);
  if (error) throw error;

  if (task) {
    await logActivity({
      hanh_dong: "Xóa task chăm sóc",
      module: "care_tasks",
      chi_tiet: task.ma_cs,
    });
  }
}
