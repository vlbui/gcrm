import { createClient } from "@/lib/supabase/client";

// ==================== TYPES ====================

export interface CmsHero {
  id: string;
  headline: string;
  sub_headline: string;
  description: string;
  cta_text: string;
  cta_link: string;
  cta2_text: string;
  cta2_link: string;
  background_image: string | null;
  badges: { text: string; icon?: string }[];
  stats: { value: string; label: string }[];
  is_active: boolean;
  sort_order: number;
  updated_at: string;
  updated_by: string | null;
}

export interface CmsService {
  id: string;
  title: string;
  description: string;
  icon: string;
  image: string | null;
  features: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_by: string | null;
}

export interface CmsPricing {
  id: string;
  title: string;
  subtitle: string;
  loai_goi: string;
  gia_tham_khao: string | null;
  gia_tu: number | null;
  don_vi: string | null;
  features: string[];
  is_popular: boolean;
  ghi_chu: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_by: string | null;
}

export interface CmsFaq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_by: string | null;
}

export interface CmsTestimonial {
  id: string;
  ten_kh: string;
  chuc_vu: string | null;
  cong_ty: string | null;
  noi_dung: string;
  rating: number;
  avatar_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_by: string | null;
}

export interface CmsBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  tags: string[];
  author: string | null;
  trang_thai: string;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CmsCompanyInfo {
  id: string;
  key: string;
  value: string;
  category: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface CmsCertificate {
  id: string;
  title: string;
  description: string;
  icon: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_by: string | null;
}

export interface CmsMedia {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  alt_text: string | null;
  category: string | null;
  created_at: string;
  uploaded_by: string | null;
}

// ==================== FETCH FUNCTIONS (Public) ====================

export async function fetchHero(): Promise<CmsHero | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cms_hero")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(1)
    .single();
  return data;
}

export async function fetchServices(): Promise<CmsService[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cms_services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function fetchPricing(): Promise<CmsPricing[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cms_pricing")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function fetchFaqs(): Promise<CmsFaq[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cms_faq")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function fetchTestimonials(): Promise<CmsTestimonial[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cms_testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function fetchCompanyInfo(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.from("cms_company_info").select("*");
  const map: Record<string, string> = {};
  data?.forEach((item: CmsCompanyInfo) => {
    map[item.key] = item.value;
  });
  return map;
}

export async function fetchCertificates(): Promise<CmsCertificate[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cms_certificates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function fetchBlogs(
  limit = 10
): Promise<CmsBlog[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cms_blog")
    .select("*")
    .eq("trang_thai", "Đã xuất bản")
    .order("published_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ==================== ADMIN CRUD ====================

export async function createCmsRecord<T extends Record<string, unknown>>(
  table: string,
  record: T
) {
  const supabase = createClient();
  const { data, error } = await supabase.from(table).insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function updateCmsRecord<T extends Record<string, unknown>>(
  table: string,
  id: string,
  updates: T
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCmsRecord(table: string, id: string) {
  const supabase = createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function fetchCmsTable<T>(
  table: string,
  options?: { orderBy?: string; ascending?: boolean }
): Promise<T[]> {
  const supabase = createClient();
  const query = supabase.from(table).select("*");
  if (options?.orderBy) {
    query.order(options.orderBy, { ascending: options.ascending ?? true });
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data as T[]) ?? [];
}
