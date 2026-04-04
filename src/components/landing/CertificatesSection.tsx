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
  { icon: "📋", title: "Giấy phép kinh doanh", description: "MST: 0110328932 — Sở KH&ĐT Hà Nội cấp" },
  { icon: "🧪", title: "Chứng nhận hóa chất", description: "Thuốc nhập ngoại chính hãng, Bộ Y tế cấp phép" },
  { icon: "🏥", title: "Năng lực y tế dự phòng", description: "Kỹ thuật viên đào tạo bài bản về dịch tễ học" },
  { icon: "🌍", title: "Chuẩn quốc tế", description: "Phương pháp IPM theo tiêu chuẩn NPMA (Mỹ)" },
];

export default function CertificatesSection({ certificates }: CertificatesSectionProps) {
  const data = certificates && certificates.length > 0 ? certificates : defaultCerts;

  return (
    <section className="section section-alt" id="certificates">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <p className="section-label">Chứng chỉ & Pháp lý</p>
            <h2 className="section-title">Đầy Đủ Giấy Phép Hành Nghề</h2>
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
