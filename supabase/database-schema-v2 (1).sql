-- ============================================
-- GREENSHIELD - Database Schema v2
-- CRM + CMS gộp trong Supabase
-- ============================================

-- ============================================
-- PHẦN 1: CRM TABLES
-- ============================================

-- === NGƯỜI DÙNG / PHÂN QUYỀN ===
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  ho_ten TEXT NOT NULL,
  vai_tro TEXT NOT NULL DEFAULT 'Nhân viên' CHECK (vai_tro IN ('Admin', 'Nhân viên', 'Xem')),
  trang_thai TEXT NOT NULL DEFAULT 'Hoạt động' CHECK (trang_thai IN ('Hoạt động', 'Tạm khóa')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === KHÁCH HÀNG ===
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_kh TEXT UNIQUE NOT NULL,
  ten_kh TEXT NOT NULL,
  sdt TEXT NOT NULL,
  email TEXT,
  dia_chi TEXT NOT NULL,
  loai_kh TEXT NOT NULL DEFAULT 'Hộ gia đình',
  trang_thai TEXT NOT NULL DEFAULT 'Mới',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- === HỢP ĐỒNG ===
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_hd TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  dich_vu TEXT NOT NULL,
  dien_tich NUMERIC,
  gia_tri NUMERIC DEFAULT 0,
  trang_thai TEXT NOT NULL DEFAULT 'Mới',
  ngay_bat_dau DATE,
  ngay_ket_thuc DATE,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- === HÓA CHẤT ===
CREATE TABLE chemicals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_hc TEXT UNIQUE NOT NULL,
  ten_thuong_mai TEXT NOT NULL,
  hoat_chat TEXT NOT NULL,
  doi_tuong TEXT NOT NULL,
  dang_su_dung TEXT,
  don_vi_tinh TEXT,
  nha_cung_cap TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- === VẬT TƯ ===
CREATE TABLE supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_vt TEXT UNIQUE NOT NULL,
  ten_vat_tu TEXT NOT NULL,
  loai_vt TEXT NOT NULL,
  don_vi_tinh TEXT,
  nha_cung_cap TEXT,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- === LỊCH SỬ DỊCH VỤ ===
CREATE TABLE service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_lsdv TEXT UNIQUE NOT NULL,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES customers(id),
  ngay_thuc_hien DATE NOT NULL,
  ktv_thuc_hien TEXT NOT NULL,
  hoa_chat_su_dung JSONB DEFAULT '[]',
  vat_tu_su_dung JSONB DEFAULT '[]',
  ket_qua TEXT DEFAULT 'Chưa hoàn thành',
  ghi_chu TEXT,
  anh_truoc JSONB DEFAULT '[]',
  anh_sau JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- === YÊU CẦU DỊCH VỤ (từ khách hàng, public) ===
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_yc TEXT UNIQUE NOT NULL,
  ten_kh TEXT NOT NULL,
  sdt TEXT NOT NULL,
  email TEXT,
  dia_chi TEXT NOT NULL,
  loai_hinh TEXT,
  loai_con_trung TEXT,
  dien_tich TEXT,
  mo_ta TEXT,
  anh_hien_truong JSONB DEFAULT '[]',
  trang_thai TEXT NOT NULL DEFAULT 'Mới' CHECK (trang_thai IN ('Mới', 'Đã liên hệ', 'Đã tạo HĐ', 'Từ chối')),
  ghi_chu_nv TEXT,
  xu_ly_boi UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === LOG HOẠT ĐỘNG ===
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  email TEXT,
  hanh_dong TEXT NOT NULL,
  module TEXT NOT NULL,
  chi_tiet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHẦN 2: CMS TABLES
-- ============================================

-- === HERO / BANNER ===
CREATE TABLE cms_hero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  sub_headline TEXT,
  description TEXT,
  cta_text TEXT DEFAULT 'Khảo sát miễn phí ngay',
  cta_link TEXT DEFAULT '#contact',
  cta2_text TEXT,
  cta2_link TEXT,
  background_image TEXT,
  badges JSONB DEFAULT '[]',
  stats JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- === DỊCH VỤ HIỂN THỊ TRÊN WEB ===
CREATE TABLE cms_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  image TEXT,
  features JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- === BẢNG GIÁ ===
CREATE TABLE cms_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  loai_goi TEXT NOT NULL CHECK (loai_goi IN ('Đơn lẻ', 'Định kỳ', 'Doanh nghiệp')),
  gia_tham_khao TEXT,
  gia_tu NUMERIC,
  don_vi TEXT DEFAULT 'lần',
  features JSONB DEFAULT '[]',
  is_popular BOOLEAN DEFAULT false,
  ghi_chu TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- === FAQ ===
CREATE TABLE cms_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'Chung',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- === TESTIMONIALS / ĐÁNH GIÁ ===
CREATE TABLE cms_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ten_kh TEXT NOT NULL,
  chuc_vu TEXT,
  cong_ty TEXT,
  noi_dung TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- === BLOG / BÀI VIẾT ===
CREATE TABLE cms_blog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  category TEXT DEFAULT 'Kiến thức',
  tags JSONB DEFAULT '[]',
  author TEXT,
  trang_thai TEXT NOT NULL DEFAULT 'Nháp' CHECK (trang_thai IN ('Nháp', 'Đã xuất bản', 'Ẩn')),
  views INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- === THÔNG TIN CÔNG TY ===
CREATE TABLE cms_company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- === CHỨNG NHẬN / GIẤY PHÉP ===
CREATE TABLE cms_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- === MEDIA / QUẢN LÝ ẢNH ===
CREATE TABLE cms_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  alt_text TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id)
);

-- ============================================
-- PHẦN 3: INDEXES
-- ============================================

-- CRM indexes
CREATE INDEX idx_customers_ma ON customers(ma_kh);
CREATE INDEX idx_customers_sdt ON customers(sdt);
CREATE INDEX idx_customers_trang_thai ON customers(trang_thai);
CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_trang_thai ON contracts(trang_thai);
CREATE INDEX idx_service_history_contract ON service_history(contract_id);
CREATE INDEX idx_service_history_customer ON service_history(customer_id);
CREATE INDEX idx_service_requests_trang_thai ON service_requests(trang_thai);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- CMS indexes
CREATE INDEX idx_cms_services_sort ON cms_services(sort_order);
CREATE INDEX idx_cms_pricing_sort ON cms_pricing(sort_order);
CREATE INDEX idx_cms_faq_sort ON cms_faq(sort_order);
CREATE INDEX idx_cms_testimonials_sort ON cms_testimonials(sort_order);
CREATE INDEX idx_cms_blog_slug ON cms_blog(slug);
CREATE INDEX idx_cms_blog_status ON cms_blog(trang_thai);
CREATE INDEX idx_cms_blog_published ON cms_blog(published_at DESC);
CREATE INDEX idx_cms_company_key ON cms_company_info(key);

-- ============================================
-- PHẦN 4: ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemicals ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_blog ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_media ENABLE ROW LEVEL SECURITY;

-- === CRM: Authenticated users full access ===
CREATE POLICY "auth_read_users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_users" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_users" ON users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_users" ON users FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_customers" ON customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_customers" ON customers FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_contracts" ON contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_contracts" ON contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_contracts" ON contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_contracts" ON contracts FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_chemicals" ON chemicals FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_chemicals" ON chemicals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_chemicals" ON chemicals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_chemicals" ON chemicals FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_supplies" ON supplies FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_supplies" ON supplies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_supplies" ON supplies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_supplies" ON supplies FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_service_history" ON service_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_service_history" ON service_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_service_history" ON service_history FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_service_history" ON service_history FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_service_requests" ON service_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_update_service_requests" ON service_requests FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_service_requests" ON service_requests FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_read_activity_log" ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_activity_log" ON activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- === SERVICE REQUESTS: Public (khách hàng gửi không cần login) ===
CREATE POLICY "public_insert_service_requests" ON service_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "public_read_service_requests" ON service_requests FOR SELECT TO anon USING (true);

-- === CMS: Public đọc (hiển thị trên web), Authenticated ghi (admin quản lý) ===
CREATE POLICY "public_read_cms_hero" ON cms_hero FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_cms_hero" ON cms_hero FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cms_hero" ON cms_hero FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_cms_hero" ON cms_hero FOR DELETE TO authenticated USING (true);

CREATE POLICY "public_read_cms_services" ON cms_services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_cms_services" ON cms_services FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cms_services" ON cms_services FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_cms_services" ON cms_services FOR DELETE TO authenticated USING (true);

CREATE POLICY "public_read_cms_pricing" ON cms_pricing FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_cms_pricing" ON cms_pricing FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cms_pricing" ON cms_pricing FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_cms_pricing" ON cms_pricing FOR DELETE TO authenticated USING (true);

CREATE POLICY "public_read_cms_faq" ON cms_faq FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_cms_faq" ON cms_faq FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cms_faq" ON cms_faq FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_cms_faq" ON cms_faq FOR DELETE TO authenticated USING (true);

CREATE POLICY "public_read_cms_testimonials" ON cms_testimonials FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_cms_testimonials" ON cms_testimonials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cms_testimonials" ON cms_testimonials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_cms_testimonials" ON cms_testimonials FOR DELETE TO authenticated USING (true);

CREATE POLICY "public_read_cms_blog" ON cms_blog FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_cms_blog" ON cms_blog FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cms_blog" ON cms_blog FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_cms_blog" ON cms_blog FOR DELETE TO authenticated USING (true);

CREATE POLICY "public_read_cms_company" ON cms_company_info FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_cms_company" ON cms_company_info FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cms_company" ON cms_company_info FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_cms_company" ON cms_company_info FOR DELETE TO authenticated USING (true);

CREATE POLICY "public_read_cms_certs" ON cms_certificates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_cms_certs" ON cms_certificates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_cms_certs" ON cms_certificates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_cms_certs" ON cms_certificates FOR DELETE TO authenticated USING (true);

CREATE POLICY "public_read_cms_media" ON cms_media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "auth_write_cms_media" ON cms_media FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_cms_media" ON cms_media FOR DELETE TO authenticated USING (true);

-- ============================================
-- PHẦN 5: STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('cms', 'cms', true);

CREATE POLICY "public_read_photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'photos');
CREATE POLICY "auth_upload_photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');
CREATE POLICY "auth_delete_photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos');

CREATE POLICY "public_read_cms_files" ON storage.objects FOR SELECT TO public USING (bucket_id = 'cms');
CREATE POLICY "auth_upload_cms_files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cms');
CREATE POLICY "auth_delete_cms_files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'cms');

-- Public upload ảnh hiện trường (service requests)
CREATE POLICY "anon_upload_photos" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'photos');

-- ============================================
-- PHẦN 6: DỮ LIỆU MẪU CMS (từ landing page hiện tại)
-- ============================================

-- Thông tin công ty
INSERT INTO cms_company_info (key, value, category) VALUES
  ('company_name', 'Lá Chắn Xanh', 'general'),
  ('company_name_en', 'GreenShield JSC', 'general'),
  ('mst', '0110328932', 'general'),
  ('hotline', '085 9955 969', 'contact'),
  ('email', 'info@greenshield.com.vn', 'contact'),
  ('address', 'Số 7, ngõ 125 Trung Kính, Yên Hòa, Cầu Giấy, Hà Nội', 'contact'),
  ('working_hours', 'Thứ 2 — Thứ 7: 8:00 — 18:00 | Chủ nhật: Theo hẹn', 'contact'),
  ('zalo', '085 9955 969', 'social'),
  ('website', 'https://greenshield.com.vn', 'general'),
  ('google_maps_url', 'https://maps.google.com/?q=Số+7+ngõ+125+Trung+Kính+Yên+Hòa+Cầu+Giấy+Hà+Nội', 'contact'),
  ('stat_customers', '300+', 'stats'),
  ('stat_experience', '10+', 'stats'),
  ('stat_satisfaction', '100%', 'stats');

-- Hero
INSERT INTO cms_hero (headline, sub_headline, description, cta_text, cta_link, badges, stats) VALUES
  ('Kiểm Soát Côn Trùng Chuẩn Chuyên Gia',
   'Lá Chắn Xanh',
   'Lá Chắn Xanh mang đến tư duy quản trị rủi ro hiện đại, bảo vệ an toàn sức khỏe và tài sản của bạn bằng tri thức khoa học và phương pháp IPM tiên tiến.',
   'Khảo sát miễn phí ngay',
   '#contact',
   '[{"icon": "✅", "text": "Chuyên gia IPM"}, {"icon": "🛡️", "text": "An toàn sinh học"}, {"icon": "🏆", "text": "Hóa chất nhập ngoại cao cấp"}]',
   '[{"number": "300+", "label": "Khách hàng tin tưởng"}, {"number": "10+", "label": "Năm kinh nghiệm"}, {"number": "100%", "label": "Khách hài lòng"}]'
  );

-- Dịch vụ
INSERT INTO cms_services (title, description, icon, features, sort_order) VALUES
  ('Kiểm soát Muỗi', 'Phòng chống sốt xuất huyết, diệt muỗi cho khu dân cư, trường học, bệnh viện.', '🦟', '["Phun ULV diện rộng", "Xử lý ổ bọ gậy", "Đèn bắt muỗi chuyên dụng"]', 1),
  ('Diệt Gián & Kiến', 'Xử lý triệt để gián Đức, gián Mỹ, kiến đen, kiến lửa tại nhà bếp, nhà hàng.', '🪳', '["Gel bả diệt gián nhập ngoại", "Không mùi, an toàn thực phẩm", "Hiệu quả dây chuyền"]', 2),
  ('Diệt Chuột', 'Hệ thống bẫy chuột chuyên nghiệp, bả sinh học, chặn đường xâm nhập.', '🐀', '["Bẫy cơ học thông minh", "Bả sinh học an toàn", "Bít đường xâm nhập"]', 3),
  ('Xử lý Mối', 'Kiểm soát và diệt mối tận gốc cho nhà ở, công trình xây dựng.', '🏠', '["Hệ thống mồi bả Sentricon", "Phòng mối nền móng", "Bảo hành 3-5 năm"]', 4),
  ('Phun Khử Trùng', 'Khử trùng không gian, diệt khuẩn bề mặt, phòng chống dịch bệnh.', '🧴', '["Khử trùng y tế", "Diệt khuẩn không gian", "An toàn WHO"]', 5),
  ('Kiểm soát Ruồi', 'Hệ thống đèn bắt ruồi, bẫy pheromone, vệ sinh nguồn phát sinh.', '🪰', '["Đèn bắt ruồi UV", "Bẫy pheromone chuyên dụng", "Tư vấn vệ sinh"]', 6);

-- FAQ
INSERT INTO cms_faq (question, answer, sort_order) VALUES
  ('Phun thuốc có an toàn cho trẻ nhỏ và thú cưng không?', 'Hoàn toàn an toàn. Chúng tôi sử dụng hóa chất nhập ngoại cao cấp — đều là dòng sản phẩm không mùi, có chứng nhận an toàn cho sức khỏe con người và thú cưng. Ngoài ra, kỹ thuật viên sẽ hướng dẫn bạn thời gian cách ly phù hợp (thường chỉ 2-4 giờ) trước khi quay lại sinh hoạt bình thường.', 1),
  ('Sau bao lâu thì côn trùng hết hoàn toàn?', 'Tùy thuộc vào loại dịch hại và mức độ nhiễm. Với gián, thường thấy hiệu quả rõ rệt sau 3-5 ngày. Với chuột, sau 1-2 tuần. Với mối, cần 2-4 tuần để hệ thống mồi bả phát huy tác dụng triệt để. Chúng tôi cam kết bảo hành và quay lại xử lý miễn phí nếu chưa đạt hiệu quả.', 2),
  ('Tôi cần chuẩn bị gì trước khi đội ngũ đến?', 'Kỹ thuật viên sẽ liên hệ trước và hướng dẫn cụ thể. Thông thường, bạn chỉ cần cất thực phẩm hở và vật dụng cá nhân khỏi khu vực xử lý. Đội ngũ chúng tôi sẽ tự che phủ đồ đạc theo quy trình SOP chuẩn, bạn không cần di chuyển nội thất lớn.', 3),
  ('Chính sách bảo hành như thế nào?', 'Gói đơn lẻ: bảo hành 30 ngày. Gói định kỳ: bảo hành liên tục trong suốt hợp đồng, xử lý khẩn cấp miễn phí. Gói xử lý mối: bảo hành từ 3-5 năm tùy phương pháp. Trong thời gian bảo hành, nếu dịch hại tái phát, chúng tôi quay lại xử lý hoàn toàn miễn phí.', 4),
  ('Lá Chắn Xanh có phục vụ ngoài Hà Nội không?', 'Hiện tại chúng tôi tập trung phục vụ khu vực Hà Nội và các tỉnh lân cận (Bắc Ninh, Hưng Yên, Hải Dương, Vĩnh Phúc...). Đối với dự án lớn hoặc hợp đồng doanh nghiệp, chúng tôi có thể triển khai tại các tỉnh miền Bắc.', 5),
  ('IPM khác gì so với phun thuốc truyền thống?', 'Phun thuốc truyền thống chỉ xử lý bề mặt, côn trùng dễ tái phát và kháng thuốc. IPM (Quản trị Dịch hại Tổng hợp) là phương pháp khoa học: phân tích nguyên nhân gốc rễ, chặn đường xâm nhập, ưu tiên biện pháp sinh học, chỉ dùng hóa chất tại điểm nóng.', 6);

-- Chứng nhận
INSERT INTO cms_certificates (title, description, icon, sort_order) VALUES
  ('Giấy phép kinh doanh', 'MST: 0110328932 — Sở KH&ĐT Hà Nội cấp', '📋', 1),
  ('Hóa chất nhập ngoại', 'Sản phẩm chính hãng, có đầy đủ chứng nhận an toàn', '🧪', 2),
  ('Năng lực Y tế dự phòng', 'Đội ngũ được đào tạo về dịch tễ và sức khỏe cộng đồng', '🏥', 3),
  ('Tiêu chuẩn chất lượng', 'Quy trình làm việc chuyên nghiệp, đạt chuẩn quốc tế', '🌍', 4);

-- Testimonials mẫu
INSERT INTO cms_testimonials (ten_kh, chuc_vu, cong_ty, noi_dung, rating, sort_order) VALUES
  ('Anh Minh', 'Quản lý', 'Nhà hàng Hải Sản Biển Đông', 'Dịch vụ rất chuyên nghiệp, đội ngũ đến đúng giờ và xử lý sạch sẽ. Sau 1 tuần không còn thấy gián trong bếp.', 5, 1),
  ('Chị Hương', 'Chủ nhà', 'Biệt thự Ciputra', 'Mối đã được xử lý triệt để, đội ngũ tư vấn rất tận tâm. Bảo hành 5 năm nên rất yên tâm.', 5, 2),
  ('Anh Tuấn', 'Giám đốc', 'Công ty TNHH Thực phẩm Sạch', 'Lá Chắn Xanh là đối tác đáng tin cậy. Báo cáo định kỳ rõ ràng, đáp ứng tốt yêu cầu kiểm toán ATTP.', 5, 3);
