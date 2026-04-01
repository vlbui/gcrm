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
    title: "Giấy phép kinh doanh hợp lệ",
    description: "MST: 0110328932 — Sở KH&ĐT Hà Nội cấp. Đăng ký ngành nghề diệt côn trùng, khử trùng",
  },
  {
    icon: "🧪",
    title: "Chứng nhận hóa chất an toàn",
    description: "Thuốc diệt côn trùng nhập ngoại chính hãng, có phiếu kiểm nghiệm và chứng nhận Bộ Y tế",
  },
  {
    icon: "🏥",
    title: "Năng lực y tế dự phòng",
    description: "Kỹ thuật viên được đào tạo bài bản về dịch tễ học, kiểm soát sinh vật gây hại",
  },
  {
    icon: "🌍",
    title: "Quy trình chuẩn quốc tế",
    description: "Áp dụng phương pháp IPM theo tiêu chuẩn NPMA (Mỹ) trong mọi dự án diệt côn trùng",
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
            <h2 className="section-title">Công Ty Diệt Côn Trùng Có Đầy Đủ Giấy Phép</h2>
            <p className="section-desc">
              Lá Chắn Xanh hoạt động minh bạch, tuân thủ mọi quy định pháp luật về y tế dự phòng và an toàn hóa chất. Đây là cơ sở để bạn yên tâm lựa chọn dịch vụ diệt côn trùng uy tín.
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
