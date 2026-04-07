-- ============================================
-- Deal Services: Lịch sử thực hiện DV theo deal
-- 1 deal có nhiều lần thực hiện
-- ============================================

CREATE TABLE deal_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  lan_thu INTEGER DEFAULT 1,
  ngay_thuc_hien DATE,
  gio_bat_dau TIME,
  gio_ket_thuc TIME,
  ktv_ids UUID[] DEFAULT '{}',
  hoa_chat JSONB DEFAULT '[]',
  vat_tu JSONB DEFAULT '[]',
  anh_truoc JSONB DEFAULT '[]',
  anh_sau JSONB DEFAULT '[]',
  ket_qua TEXT DEFAULT 'Chưa thực hiện'
    CHECK (ket_qua IN ('Chưa thực hiện','Đang làm','Hoàn thành','Hủy')),
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_deal_services_deal ON deal_services(deal_id);
CREATE INDEX idx_deal_services_ngay ON deal_services(ngay_thuc_hien);

ALTER TABLE deal_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_deal_services" ON deal_services FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_deal_services" ON deal_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_deal_services" ON deal_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_deal_services" ON deal_services FOR DELETE TO authenticated USING (true);
