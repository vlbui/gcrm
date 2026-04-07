-- ============================================
-- PHASE 3: Schedules, Care Tasks, Inventory
-- ============================================

-- === 1. LỊCH CÔNG VIỆC (SCHEDULES) ===
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  service_history_id UUID REFERENCES service_history(id) ON DELETE SET NULL,
  ngay_thuc_hien DATE NOT NULL,
  gio_bat_dau TIME,
  gio_ket_thuc TIME,
  ktv_id UUID REFERENCES users(id) ON DELETE SET NULL,
  dia_diem TEXT,
  ghi_chu TEXT,
  trang_thai TEXT NOT NULL DEFAULT 'Chưa làm' CHECK (trang_thai IN ('Chưa làm', 'Đang làm', 'Hoàn thành', 'Hủy')),
  check_in_time TIMESTAMPTZ,
  check_in_lat NUMERIC,
  check_in_lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- === 2. CHĂM SÓC SAU BÁN (CARE_TASKS) ===
CREATE TABLE care_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_cs TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  loai TEXT NOT NULL DEFAULT 'Hỏi thăm' CHECK (loai IN ('Bảo hành', 'Tái ký', 'Hỏi thăm', 'Khác')),
  ngay_hen DATE NOT NULL,
  noi_dung TEXT,
  trang_thai TEXT NOT NULL DEFAULT 'Chờ' CHECK (trang_thai IN ('Chờ', 'Đã làm', 'Quá hạn', 'Hủy')),
  nguoi_phu_trach UUID REFERENCES users(id) ON DELETE SET NULL,
  ket_qua TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- === 3. GIAO DỊCH KHO (INVENTORY_TRANSACTIONS) ===
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loai TEXT NOT NULL CHECK (loai IN ('chemicals', 'supplies')),
  item_id UUID NOT NULL,
  loai_giao_dich TEXT NOT NULL CHECK (loai_giao_dich IN ('Nhập', 'Xuất', 'Kiểm kê')),
  so_luong NUMERIC NOT NULL DEFAULT 0,
  don_vi TEXT,
  service_history_id UUID REFERENCES service_history(id) ON DELETE SET NULL,
  nha_cung_cap TEXT,
  gia_nhap NUMERIC DEFAULT 0,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- === 4. CẬP NHẬT CHEMICALS + SUPPLIES ===
ALTER TABLE chemicals ADD COLUMN IF NOT EXISTS so_luong_ton NUMERIC DEFAULT 0;
ALTER TABLE chemicals ADD COLUMN IF NOT EXISTS nguong_canh_bao NUMERIC DEFAULT 5;

ALTER TABLE supplies ADD COLUMN IF NOT EXISTS so_luong_ton NUMERIC DEFAULT 0;
ALTER TABLE supplies ADD COLUMN IF NOT EXISTS nguong_canh_bao NUMERIC DEFAULT 5;

-- === 5. INDEXES ===
CREATE INDEX idx_schedules_ngay ON schedules(ngay_thuc_hien);
CREATE INDEX idx_schedules_ktv ON schedules(ktv_id);
CREATE INDEX idx_schedules_contract ON schedules(contract_id);
CREATE INDEX idx_schedules_trang_thai ON schedules(trang_thai);

CREATE INDEX idx_care_tasks_customer ON care_tasks(customer_id);
CREATE INDEX idx_care_tasks_ngay ON care_tasks(ngay_hen);
CREATE INDEX idx_care_tasks_trang_thai ON care_tasks(trang_thai);
CREATE INDEX idx_care_tasks_nguoi ON care_tasks(nguoi_phu_trach);

CREATE INDEX idx_inventory_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_loai ON inventory_transactions(loai);
CREATE INDEX idx_inventory_created ON inventory_transactions(created_at DESC);

-- === 6. ROW LEVEL SECURITY ===
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_schedules" ON schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_schedules" ON schedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_schedules" ON schedules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_schedules" ON schedules FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_care_tasks" ON care_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_care_tasks" ON care_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_care_tasks" ON care_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_care_tasks" ON care_tasks FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_inventory" ON inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_inventory" ON inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_inventory" ON inventory_transactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_inventory" ON inventory_transactions FOR DELETE TO authenticated USING (true);
