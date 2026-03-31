import FadeUp from "./FadeUp";

export interface CertificateItem {
  id?: string;
  title: string;
  description: string;
  icon: string;
}

interface CertificatesSectionProps {
  certificates?: CertificateItem[];
}

const defaultCerts: CertificateItem[] = [
  {
    icon: "📋",
    title: "Giấy phép kinh doanh",
    description: "MST: 0110328932 — Sở KH&ĐT Hà Nội cấp",
  },
  {
    icon: "🧪",
    title: "Hóa chất nhập ngoại",
    description: "Sản phẩm chính hãng, có đầy đủ chứng nhận an toàn",
  },
  {
    icon: "🏥",
    title: "Năng lực Y tế dự phòng",
    description: "Đội ngũ được đào tạo về dịch tễ và sức khỏe cộng đồng",
  },
  {
    icon: "🌍",
    title: "Tiêu chuẩn chất lượng",
    description: "Quy trình làm việc chuyên nghiệp, đạt chuẩn quốc tế",
  },
];

export default function CertificatesSection({ certificates }: CertificatesSectionProps) {
  const data = certificates && certificates.length > 0 ? certificates : defaultCerts;

  return (
    <section className="section section-green" id="certificates">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <span className="section-label">📜 Chứng chỉ &amp; Pháp lý</span>
            <h2 className="section-title">Đầy Đủ Giấy Phép &amp; Chứng Nhận</h2>
            <p className="section-desc">
              Chúng tôi cam kết hoạt động minh bạch, tuân thủ mọi quy định pháp luật về y tế dự phòng và an toàn hóa chất.
            </p>
          </div>
        </FadeUp>

        <div className="certs-grid">
          {data.map((cert, i) => (
            <FadeUp key={cert.id ?? i}>
              <div className="cert-card">
                <div className="cert-icon">{cert.icon}</div>
                <h4>{cert.title}</h4>
                <p>{cert.description}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
