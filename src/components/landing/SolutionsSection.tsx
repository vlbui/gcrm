import { Check } from "lucide-react";
import FadeUp from "./FadeUp";

const b2bFeatures = [
  "Đầy đủ hồ sơ năng lực & Chứng chỉ hóa chất",
  "Hệ thống báo cáo chuyên nghiệp, minh bạch, chi tiết",
  "Xử lý ngoài giờ, không gián đoạn kinh doanh",
  "Quản trị rủi ro thương hiệu toàn diện",
  "Đội ngũ kỹ thuật riêng, quản lý tài khoản 1-1",
];

const b2cFeatures = [
  "Quy trình che phủ đồ đạc chuẩn SOP nghiêm ngặt",
  "Hóa chất nhập ngoại cao cấp, không mùi",
  "An toàn tuyệt đối cho trẻ nhỏ và vật nuôi",
  "Bảo hành uy tín, hỗ trợ 24/7",
  "Linh hoạt thời gian, phục vụ cả cuối tuần",
];

export default function SolutionsSection() {
  return (
    <section className="section section-alt" id="solutions">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <span className="section-label">💼 Giải pháp</span>
            <h2 className="section-title">
              Doanh Nghiệp hay Gia Đình — Chúng Tôi Đều Bảo Vệ
            </h2>
          </div>
        </FadeUp>

        <div className="solutions-grid">
          <FadeUp>
            <div className="solution-card">
              <div className="solution-card-header b2b">
                <div className="solution-label">Dành cho doanh nghiệp</div>
                <h3>Gói B2B Enterprise</h3>
                <p>Nhà hàng, Khách sạn, Kho bãi, Tòa nhà văn phòng, Nhà máy sản xuất</p>
              </div>
              <div className="solution-card-body">
                <ul className="solution-list">
                  {b2bFeatures.map((f, i) => (
                    <li key={i}>
                      <Check size={16} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeUp>

          <FadeUp>
            <div className="solution-card">
              <div className="solution-card-header b2c">
                <div className="solution-label">Dành cho gia đình</div>
                <h3>Gói Gia Đình</h3>
                <p>Căn hộ chung cư, Biệt thự, Nhà phố, Nhà mới xây</p>
              </div>
              <div className="solution-card-body">
                <ul className="solution-list">
                  {b2cFeatures.map((f, i) => (
                    <li key={i}>
                      <Check size={16} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
