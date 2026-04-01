import { Check } from "lucide-react";
import FadeUp from "./FadeUp";

const b2bFeatures = [
  "Dịch vụ diệt côn trùng cho nhà hàng, khách sạn, nhà máy",
  "Báo cáo chuyên nghiệp đáp ứng kiểm toán VSATTP",
  "Xử lý ngoài giờ hành chính, không gián đoạn kinh doanh",
  "Hồ sơ năng lực đầy đủ, chứng chỉ hóa chất hợp lệ",
  "Đội ngũ kỹ thuật riêng, quản lý tài khoản 1-1",
];

const b2cFeatures = [
  "Dịch vụ diệt côn trùng tại nhà an toàn, chuyên nghiệp",
  "Hóa chất nhập ngoại không mùi, an toàn cho trẻ nhỏ",
  "Che phủ đồ đạc chuẩn SOP, không cần di chuyển nội thất",
  "Bảo hành cam kết — xử lý lại miễn phí nếu tái phát",
  "Linh hoạt thời gian, phục vụ cả thứ 7 & chủ nhật",
];

export default function SolutionsSection() {
  return (
    <section className="section section-alt" id="solutions">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <span className="section-label">💼 Giải pháp diệt côn trùng</span>
            <h2 className="section-title">
              Diệt Côn Trùng Cho Doanh Nghiệp &amp; Hộ Gia Đình
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
