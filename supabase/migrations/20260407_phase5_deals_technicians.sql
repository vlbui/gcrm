-- ============================================
-- PHASE 5: Deals + Technicians (Simplified CRM)
-- ============================================

-- === 1. DEALS — Bảng hợp nhất ===
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_deal TEXT UNIQUE NOT NULL,
  giai_doan TEXT NOT NULL DEFAULT 'Khách hỏi'
    CHECK (giai_doan IN ('Khách hỏi','Tư vấn','Báo giá','Chốt','Triển khai','Hoàn thành','Chăm sóc')),
  loai_kh TEXT DEFAULT 'Cá nhân' CHECK (loai_kh IN ('Cá nhân','Tổ chức')),
  ten_kh TEXT NOT NULL,
  sdt TEXT NOT NULL,
  email TEXT,
  dia_chi TEXT,
  ten_cong_ty TEXT,
  nguoi_lien_he TEXT,
  loai_hinh TEXT,
  dich_vu TEXT[] DEFAULT '{}',
  loai_con_trung TEXT[] DEFAULT '{}',
  dien_tich NUMERIC,
  gia_tri NUMERIC DEFAULT 0,
  ngay_hen DATE,
  ngay_thuc_hien DATE,
  ngay_hoan_thanh DATE,
  ktv_phu_trach UUID[] DEFAULT '{}',
  hoa_chat_su_dung JSONB DEFAULT '[]',
  vat_tu_su_dung JSONB DEFAULT '[]',
  anh_truoc JSONB DEFAULT '[]',
  anh_sau JSONB DEFAULT '[]',
  thanh_toan JSONB DEFAULT '[]',
  trang_thai_thanh_toan TEXT DEFAULT 'Chưa TT'
    CHECK (trang_thai_thanh_toan IN ('Chưa TT','Đã cọc','Đã TT')),
  ghi_chu TEXT,
  uu_tien INTEGER DEFAULT 0,
  nguoi_phu_trach UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_giai_doan ON deals(giai_doan);
CREATE INDEX idx_deals_sdt ON deals(sdt);
CREATE INDEX idx_deals_created ON deals(created_at DESC);
CREATE INDEX idx_deals_nguoi ON deals(nguoi_phu_trach);

-- === 2. TECHNICIANS ===
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_ktv TEXT UNIQUE NOT NULL,
  ho_ten TEXT NOT NULL,
  sdt TEXT NOT NULL,
  email TEXT,
  cccd TEXT,
  ngay_sinh DATE,
  dia_chi TEXT,
  chuyen_mon TEXT[] DEFAULT '{}',
  kinh_nghiem_nam INTEGER DEFAULT 0,
  chung_chi JSONB DEFAULT '[]',
  ngay_vao_lam DATE,
  trang_thai TEXT DEFAULT 'Đang làm' CHECK (trang_thai IN ('Đang làm','Nghỉ phép','Nghỉ việc')),
  avatar_url TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_technicians_trang_thai ON technicians(trang_thai);

-- === 3. Cập nhật chemicals + supplies thêm don_gia ===
ALTER TABLE chemicals ADD COLUMN IF NOT EXISTS don_gia NUMERIC DEFAULT 0;
ALTER TABLE supplies ADD COLUMN IF NOT EXISTS don_gia NUMERIC DEFAULT 0;

-- Update nguong_canh_bao default
-- (columns already exist from Phase 3 migration)

-- === 4. RLS ===
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_deals" ON deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_deals" ON deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_deals" ON deals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_deals" ON deals FOR DELETE TO authenticated USING (true);

-- Public insert for deals (from landing page forms)
CREATE POLICY "public_insert_deals" ON deals FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_read_technicians" ON technicians FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_technicians" ON technicians FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_technicians" ON technicians FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_technicians" ON technicians FOR DELETE TO authenticated USING (true);

-- === 5. Auto-update updated_at ===
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
