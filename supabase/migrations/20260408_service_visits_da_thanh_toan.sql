-- Add da_thanh_toan (amount paid) to service_visits
ALTER TABLE service_visits ADD COLUMN IF NOT EXISTS da_thanh_toan NUMERIC DEFAULT 0;
