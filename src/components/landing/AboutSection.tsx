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
  about_title: "Tâm thế của những người làm chuyên môn",
  about_description:
    "Lá Chắn Xanh (GreenShield JSC) không chỉ là một đơn vị cung cấp dịch vụ vệ sinh. Chúng tôi là tập hợp của đội ngũ chuyên gia có kinh nghiệm sâu sắc trong lĩnh vực <strong>dịch tễ và kiểm soát sinh vật gây hại</strong>.",
  about_description2:
    "Với chúng tôi, mỗi khách hàng là một hệ sinh thái cần được bảo vệ. Chúng tôi đặt sự minh bạch, an toàn pháp lý và hiệu quả bền vững lên hàng đầu trong mọi hành động.",
};

const highlights = [
  {
    icon: "🎓",
    title: "Đội ngũ chuyên gia",
    desc: "Kỹ thuật viên được đào tạo bài bản về dịch tễ học",
  },
  {
    icon: "🔬",
    title: "Khoa học dẫn đường",
    desc: "Phương pháp IPM quốc tế, không phun tràn lan",
  },
  {
    icon: "📑",
    title: "Minh bạch pháp lý",
    desc: "Đầy đủ hồ sơ năng lực, giấy phép hành nghề",
  },
  {
    icon: "🤝",
    title: "Đồng hành lâu dài",
    desc: "Hợp đồng định kỳ, báo cáo & giám sát liên tục",
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
