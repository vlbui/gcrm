import { createClient } from "@/lib/supabase/client";

export interface ServiceReview {
  id: string;
  service_visit_id: string;
  contract_id: string;
  customer_id: string | null;
  rating: number;
  noi_dung: string | null;
  created_at: string;
}

export async function fetchReviewsByContract(contractId: string): Promise<ServiceReview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_reviews")
    .select("*")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchReviewByVisit(visitId: string): Promise<ServiceReview | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("service_reviews")
    .select("*")
    .eq("service_visit_id", visitId)
    .maybeSingle();
  return data;
}

export async function createReview(input: {
  service_visit_id: string;
  contract_id: string;
  customer_id?: string;
  rating: number;
  noi_dung?: string;
}): Promise<ServiceReview> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_reviews")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAverageRating(contractId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("service_reviews")
    .select("rating")
    .eq("contract_id", contractId);
  if (!data || data.length === 0) return 0;
  return data.reduce((s, r) => s + r.rating, 0) / data.length;
}
