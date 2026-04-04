import { Check } from "lucide-react";
import FadeUp from "./FadeUp";

const b2bFeatures = [
  "Nhà hàng, khách sạn, nhà máy, kho bãi",
  "Báo cáo chuyên nghiệp đáp ứng kiểm toán VSATTP",
  "Xử lý ngoài giờ hành chính",
  "Hồ sơ năng lực đầy đủ, chứng chỉ hợp lệ",
  "Quản lý tài khoản chuyên biệt 1-1",
];

const b2cFeatures = [
  "Căn hộ chung cư, biệt thự, nhà phố",
  "Hóa chất không mùi, an toàn cho trẻ nhỏ",
  "Che phủ đồ đạc chuẩn SOP",
  "Bảo hành — xử lý lại miễn phí nếu tái phát",
  "Phục vụ cả thứ 7 & chủ nhật",
];

export default function SolutionsSection() {
  return (
    <section className="section section-alt" id="solutions">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <p className="section-label">Giải pháp</p>
            <h2 className="section-title">Doanh Nghiệp & Hộ Gia Đình</h2>
          </div>
        </FadeUp>

        <div className="solutions-grid">
          <FadeUp>
            <div className="solution-card">
              <div className="solution-card-header">
                <p className="solution-label">Dành cho doanh nghiệp</p>
                <h3>Gói B2B Enterprise</h3>
              </div>
              <div className="solution-card-body">
                <ul className="solution-list">
                  {b2bFeatures.map((f, i) => (
                    <li key={i}><Check size={16} />{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeUp>

          <FadeUp>
            <div className="solution-card">
              <div className="solution-card-header">
                <p className="solution-label">Dành cho gia đình</p>
                <h3>Gói Gia Đình</h3>
              </div>
              <div className="solution-card-body">
                <ul className="solution-list">
                  {b2cFeatures.map((f, i) => (
                    <li key={i}><Check size={16} />{f}</li>
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
