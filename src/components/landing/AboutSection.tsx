import FadeUp from "./FadeUp";

export interface CompanyInfo {
  name?: string;
  about_title?: string;
  about_description?: string;
  about_description2?: string;
}

interface AboutSectionProps {
  companyInfo?: CompanyInfo | null;
}

const defaultInfo: CompanyInfo = {
  name: "GreenShield JSC",
  about_title: "Công ty diệt côn trùng uy tín tại Hà Nội",
  about_description:
    "<strong>Lá Chắn Xanh (GreenShield JSC)</strong> là công ty chuyên cung cấp <strong>dịch vụ diệt côn trùng chuyên nghiệp</strong> tại Hà Nội và các tỉnh phía Bắc. Đội ngũ kỹ thuật viên được đào tạo bài bản về <strong>dịch tễ học và kiểm soát sinh vật gây hại</strong>, áp dụng phương pháp IPM (Quản trị Dịch hại Tổng hợp) theo tiêu chuẩn quốc tế.",
  about_description2:
    "Với hơn 10 năm kinh nghiệm phục vụ 300+ gia đình và doanh nghiệp, chúng tôi cam kết mang đến giải pháp diệt mối, gián, chuột, muỗi hiệu quả lâu dài, an toàn cho sức khỏe và tài sản của bạn.",
};

const highlights = [
  {
    icon: "🎓",
    title: "10+ năm kinh nghiệm",
    desc: "Đội ngũ chuyên gia diệt côn trùng được đào tạo bài bản về dịch tễ học",
  },
  {
    icon: "🔬",
    title: "Phương pháp IPM",
    desc: "Kiểm soát côn trùng khoa học, không phun hóa chất tràn lan",
  },
  {
    icon: "📑",
    title: "Đầy đủ giấy phép",
    desc: "Hồ sơ năng lực, giấy phép hành nghề, chứng nhận hóa chất",
  },
  {
    icon: "🤝",
    title: "Bảo hành cam kết",
    desc: "Bảo hành 30 ngày — 5 năm, xử lý lại miễn phí nếu tái phát",
  },
];

export default function AboutSection({ companyInfo }: AboutSectionProps) {
  const data = { ...defaultInfo, ...companyInfo };

  return (
    <section className="section" id="about">
      <div className="container">
        <div className="about-grid" style={{ gridTemplateColumns: "1fr" }}>
          <FadeUp>
            <div className="about-content" style={{ maxWidth: 900, margin: "0 auto" }}>
              <span className="section-label">🏢 Về chúng tôi</span>
              <h2>{data.about_title}</h2>
              <p dangerouslySetInnerHTML={{ __html: data.about_description! }} />
              <p>{data.about_description2}</p>

              <div className="about-highlights" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                {highlights.map((h, i) => (
                  <div className="about-highlight" key={i}>
                    <div className="about-highlight-icon">{h.icon}</div>
                    <h4>{h.title}</h4>
                    <p>{h.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
