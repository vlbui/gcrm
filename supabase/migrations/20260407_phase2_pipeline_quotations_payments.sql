-- ============================================
-- PHASE 2: Sales Pipeline, Quotations, Payments
-- ============================================

-- === 1. UPDATE SERVICE_REQUESTS STATUSES ===
-- Mở rộng trạng thái để phục vụ Pipeline
ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS service_requests_trang_thai_check;
ALTER TABLE service_requests ADD CONSTRAINT service_requests_trang_thai_check
  CHECK (trang_thai IN ('Mới', 'Đã liên hệ', 'Đang tư vấn', 'Đã báo giá', 'Chốt đơn', 'Đang triển khai', 'Hoàn thành', 'Từ chối'));

-- Thêm cột giá trị dự kiến cho pipeline
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS gia_tri NUMERIC DEFAULT 0;

-- === 2. BẢNG BÁO GIÁ (QUOTATIONS) ===
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_bg TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  service_request_id UUID REFERENCES service_requests(id) ON DELETE SET NULL,
  noi_dung JSONB DEFAULT '[]',
  tong_tien NUMERIC DEFAULT 0,
  vat NUMERIC DEFAULT 0,
  tong_thanh_toan NUMERIC DEFAULT 0,
  ghi_chu TEXT,
  dieu_khoan TEXT,
  trang_thai TEXT NOT NULL DEFAULT 'Nháp' CHECK (trang_thai IN ('Nháp', 'Đã gửi', 'Khách đồng ý', 'Từ chối', 'Hết hạn')),
  ngay_tao DATE DEFAULT CURRENT_DATE,
  ngay_hieu_luc DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === 3. CẬP NHẬT BẢNG CONTRACTS ===
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS trang_thai_thanh_toan TEXT DEFAULT 'Chưa TT'
  CHECK (trang_thai_thanh_toan IN ('Chưa TT', 'Đã cọc', 'Đã TT', 'Quá hạn'));
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS so_tien_da_tra NUMERIC DEFAULT 0;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS ngay_thanh_toan DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL;

-- === 4. BẢNG THANH TOÁN (PAYMENTS) ===
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_tt TEXT UNIQUE NOT NULL,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  so_tien NUMERIC NOT NULL DEFAULT 0,
  ngay_tt DATE DEFAULT CURRENT_DATE,
  hinh_thuc TEXT NOT NULL DEFAULT 'Chuyển khoản' CHECK (hinh_thuc IN ('Tiền mặt', 'Chuyển khoản', 'Thẻ')),
  ghi_chu TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === 5. INDEXES ===
CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_quotations_service_request ON quotations(service_request_id);
CREATE INDEX idx_quotations_trang_thai ON quotations(trang_thai);
CREATE INDEX idx_payments_contract ON payments(contract_id);
CREATE INDEX idx_payments_ngay ON payments(ngay_tt DESC);
CREATE INDEX idx_contracts_thanh_toan ON contracts(trang_thai_thanh_toan);

-- === 6. ROW LEVEL SECURITY ===
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_quotations" ON quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_quotations" ON quotations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_quotations" ON quotations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_quotations" ON quotations FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_payments" ON payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_payments" ON payments FOR DELETE TO authenticated USING (true);
