-- ============================================
-- V3: service_visits, service_reviews, reminders
-- + Update suppliers, contracts
-- ============================================

-- === 1. UPDATE SUPPLIERS — thêm fields ===
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS ten_viet_tat TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS loai_ncc TEXT[] DEFAULT '{}';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS nguoi_lien_he TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS ma_so_thue TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS ngan_hang TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS so_tai_khoan TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS trang_thai TEXT DEFAULT 'Đang hợp tác'
  CHECK (trang_thai IN ('Đang hợp tác', 'Tạm dừng', 'Ngừng hợp tác'));

-- === 2. UPDATE CONTRACTS — thêm fields ===
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS loai_hd TEXT DEFAULT 'Một lần'
  CHECK (loai_hd IN ('Một lần', 'Định kỳ'));
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tan_suat TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS so_lan_du_kien INTEGER DEFAULT 1;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS giai_doan TEXT DEFAULT 'Mới'
  CHECK (giai_doan IN ('Lead', 'Tư vấn', 'Báo giá', 'Đã ký', 'Đang triển khai', 'Hoàn thành', 'Tái ký'));

-- === 3. UPDATE CHEMICALS — thêm fields ===
ALTER TABLE chemicals ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE chemicals ADD COLUMN IF NOT EXISTS han_su_dung DATE;
ALTER TABLE chemicals ADD COLUMN IF NOT EXISTS xuat_xu TEXT;

-- === 4. UPDATE SUPPLIES — thêm fields ===
ALTER TABLE supplies ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- === 5. SERVICE_VISITS — thay thế deal_services cho contracts ===
CREATE TABLE IF NOT EXISTS service_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  lan_thu INTEGER DEFAULT 1,
  ngay_du_kien DATE,
  ngay_thuc_te DATE,
  gio_bat_dau TIME,
  gio_ket_thuc TIME,
  ktv_ids UUID[] DEFAULT '{}',
  hoa_chat JSONB DEFAULT '[]',
  vat_tu JSONB DEFAULT '[]',
  anh_truoc JSONB DEFAULT '[]',
  anh_sau JSONB DEFAULT '[]',
  trang_thai TEXT DEFAULT 'Đã lên lịch'
    CHECK (trang_thai IN ('Đã lên lịch', 'Đang làm', 'Hoàn thành', 'Hủy', 'Hoãn')),
  ghi_chu_truoc TEXT,
  ghi_chu_sau TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sv_contract ON service_visits(contract_id);
CREATE INDEX IF NOT EXISTS idx_sv_ngay ON service_visits(ngay_du_kien);
CREATE INDEX IF NOT EXISTS idx_sv_trang_thai ON service_visits(trang_thai);

-- === 6. SERVICE_REVIEWS ===
CREATE TABLE IF NOT EXISTS service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_visit_id UUID NOT NULL REFERENCES service_visits(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  noi_dung TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sr_visit ON service_reviews(service_visit_id);
CREATE INDEX IF NOT EXISTS idx_sr_contract ON service_reviews(contract_id);

-- === 7. REMINDERS ===
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  service_visit_id UUID REFERENCES service_visits(id) ON DELETE CASCADE,
  loai TEXT NOT NULL CHECK (loai IN ('Lần DV tiếp theo', 'Bảo hành', 'Tái ký', 'Hỏi thăm', 'Thanh toán', 'Khác')),
  ngay_nhac DATE NOT NULL,
  noi_dung TEXT,
  trang_thai TEXT DEFAULT 'Chờ' CHECK (trang_thai IN ('Chờ', 'Đã làm', 'Bỏ qua')),
  nguoi_phu_trach UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rem_ngay ON reminders(ngay_nhac);
CREATE INDEX IF NOT EXISTS idx_rem_trang_thai ON reminders(trang_thai);
CREATE INDEX IF NOT EXISTS idx_rem_contract ON reminders(contract_id);

-- === 8. RLS ===
ALTER TABLE service_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_sv" ON service_visits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_sr" ON service_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_rem" ON reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- === 9. VIEW: contract_payment_summary ===
CREATE OR REPLACE VIEW contract_payment_summary AS
SELECT
  c.id AS contract_id,
  c.ma_hd,
  c.customer_id,
  cu.ten_kh,
  cu.ma_kh,
  c.dich_vu,
  c.gia_tri,
  COALESCE(c.so_tien_da_tra, 0) AS da_tra,
  COALESCE(c.gia_tri, 0) - COALESCE(c.so_tien_da_tra, 0) AS con_no,
  c.trang_thai_thanh_toan,
  c.ngay_ket_thuc,
  c.trang_thai
FROM contracts c
JOIN customers cu ON c.customer_id = cu.id;
