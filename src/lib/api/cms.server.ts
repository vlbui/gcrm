import { createClient } from "@/lib/supabase/server";
import type {
  CmsHero,
  CmsService,
  CmsPricing,
  CmsFaq,
  CmsTestimonial,
  CmsCompanyInfo,
  CmsCertificate,
} from "./cms.api";

export async function fetchHeroServer(): Promise<CmsHero | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_hero")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(1)
    .single();
  return data;
}

export async function fetchServicesServer(): Promise<CmsService[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function fetchPricingServer(): Promise<CmsPricing[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_pricing")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function fetchFaqsServer(): Promise<CmsFaq[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_faq")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function fetchTestimonialsServer(): Promise<CmsTestimonial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_testimonials")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}

export async function fetchCompanyInfoServer(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data } = await supabase.from("cms_company_info").select("*");
  const map: Record<string, string> = {};
  data?.forEach((item: CmsCompanyInfo) => {
    map[item.key] = item.value;
  });
  return map;
}

export async function fetchCertificatesServer(): Promise<CmsCertificate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_certificates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return data ?? [];
}
