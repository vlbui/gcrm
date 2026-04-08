-- Add quy_cach (specification/packaging) to chemicals and supplies
ALTER TABLE chemicals ADD COLUMN IF NOT EXISTS quy_cach TEXT;
ALTER TABLE supplies ADD COLUMN IF NOT EXISTS quy_cach TEXT;
