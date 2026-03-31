// Re-export Supabase clients for convenience
// This file exists so that when migrating to AWS, only this file needs to change

export { createClient } from "@/lib/supabase/client";
export { createClient as createServerClient } from "@/lib/supabase/server";
