-- Add organization fields to service_requests for multi-step smart form
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS loai_kh TEXT DEFAULT 'Cá nhân';
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS ten_cong_ty TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS nguoi_lien_he TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS so_chi_nhanh INTEGER;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS nhu_cau TEXT;

-- Make dia_chi nullable (personal form doesn't always require it)
ALTER TABLE service_requests ALTER COLUMN dia_chi DROP NOT NULL;
