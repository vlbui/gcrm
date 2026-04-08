-- Add VAT percentage to chemicals and supplies
ALTER TABLE chemicals ADD COLUMN IF NOT EXISTS vat_pct NUMERIC DEFAULT 0;
ALTER TABLE supplies ADD COLUMN IF NOT EXISTS vat_pct NUMERIC DEFAULT 0;

-- Add labor cost to service visits
ALTER TABLE service_visits ADD COLUMN IF NOT EXISTS tien_cong NUMERIC DEFAULT 0;
