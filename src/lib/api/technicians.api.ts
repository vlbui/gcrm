import { createClient } from "@/lib/supabase/client";
import { logActivity } from "./activityLog.api";

export interface Technician {
  id: string;
  ma_ktv: string;
  ho_ten: string;
  sdt: string;
  email: string | null;
  cccd: string | null;
  ngay_sinh: string | null;
  dia_chi: string | null;
  chuyen_mon: string[];
  kinh_nghiem_nam: number;
  chung_chi: Record<string, unknown>[];
  ngay_vao_lam: string | null;
  trang_thai: string;
  avatar_url: string | null;
  ghi_chu: string | null;
  created_at: string;
  created_by: string | null;
}

export type CreateTechnicianInput = {
  ho_ten: string;
  sdt: string;
  email?: string;
  cccd?: string;
  ngay_sinh?: string;
  dia_chi?: string;
  chuyen_mon?: string[];
  kinh_nghiem_nam?: number;
  ngay_vao_lam?: string;
  trang_thai?: string;
  ghi_chu?: string;
};

async function generateMaKTV(): Promise<string> {
  const supabase = createClient();
  const { count } = await supabase
    .from("technicians")
    .select("*", { count: "exact", head: true });
  return `KTV-${String((count ?? 0) + 1).padStart(3, "0")}`;
}

export async function fetchTechnicians(): Promise<Technician[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("technicians")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveTechnicians(): Promise<Technician[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("technicians")
    .select("*")
    .eq("trang_thai", "Đang làm")
    .order("ho_ten");
  if (error) throw error;
  return data ?? [];
}

export async function createTechnician(input: CreateTechnicianInput): Promise<Technician> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ma_ktv = await generateMaKTV();

  const { data, error } = await supabase
    .from("technicians")
    .insert({ ma_ktv, ...input, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Thêm KTV",
    module: "technicians",
    chi_tiet: `${ma_ktv} - ${input.ho_ten}`,
  });
  return data;
}

export async function updateTechnician(id: string, updates: Partial<CreateTechnicianInput>): Promise<Technician> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("technicians")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  await logActivity({
    hanh_dong: "Cập nhật KTV",
    module: "technicians",
    chi_tiet: `${data.ma_ktv} - ${data.ho_ten}`,
  });
  return data;
}

export async function deleteTechnician(id: string) {
  const supabase = createClient();
  const { data: t } = await supabase.from("technicians").select("ma_ktv, ho_ten").eq("id", id).single();
  const { error } = await supabase.from("technicians").delete().eq("id", id);
  if (error) throw error;

  if (t) {
    await logActivity({
      hanh_dong: "Xóa KTV",
      module: "technicians",
      chi_tiet: `${t.ma_ktv} - ${t.ho_ten}`,
    });
  }
}
