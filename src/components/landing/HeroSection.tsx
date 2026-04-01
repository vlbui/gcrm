"use client";

import { Check, Shield, Phone } from "lucide-react";

interface HeroBadge {
  icon?: string;
  text: string;
}

interface HeroStat {
  value: string;
  label: string;
}

export interface HeroData {
  headline?: string;
  sub_headline?: string;
  description?: string;
  cta_text?: string;
  cta_link?: string;
  cta2_text?: string;
  cta2_link?: string;
  badges?: HeroBadge[];
  stats?: HeroStat[];
}

interface HeroSectionProps {
  hero?: HeroData | null;
}

const defaultHero: HeroData = {
  headline: "Kiểm Soát Côn Trùng",
  sub_headline: "Chuẩn Chuyên Gia",
  description:
    "Lá Chắn Xanh mang đến tư duy quản trị rủi ro hiện đại, bảo vệ an toàn sức khỏe và tài sản của bạn bằng tri thức khoa học và phương pháp IPM tiên tiến.",
  cta_text: "Khảo sát miễn phí ngay",
  cta_link: "#contact",
  cta2_text: "085 9955 969",
  cta2_link: "tel:0859955969",
  badges: [
    { icon: "check", text: "Chuyên gia IPM" },
    { icon: "shield", text: "An toàn sinh học" },
    { text: "Hóa chất nhập ngoại cao cấp" },
  ],
  stats: [
    { value: "300+", label: "Khách hàng tin tưởng" },
    { value: "10+", label: "Năm kinh nghiệm" },
    { value: "100%", label: "Khách hài lòng" },
  ],
};

function BadgeIcon({ icon }: { icon?: string }) {
  if (icon === "check") return <Check size={16} />;
  if (icon === "shield") return <Shield size={16} />;
  return <span>🏆</span>;
}

export default function HeroSection({ hero }: HeroSectionProps) {
  const data = { ...defaultHero, ...hero };

  return (
    <section className="hero" id="hero">
      <div className="container hero-content">
        <div className="hero-grid">
          <div>
            <div className="hero-badges">
              {(data.badges ?? defaultHero.badges!).map((badge, i) => (
                <span className="hero-badge" key={i}>
                  <BadgeIcon icon={badge.icon} />
                  {badge.text}
                </span>
              ))}
            </div>

            <h1>
              <span style={{ whiteSpace: "nowrap" }}>{data.headline}</span>{" "}
              <span className="text-gradient">{data.sub_headline}</span>
            </h1>

            <p className="hero-desc">{data.description}</p>

            <div className="hero-actions">
              <button
                className="btn-cta btn-accent btn-lg"
                onClick={() => window.dispatchEvent(new Event("open-contact-popup"))}
              >
                <Check size={18} />
                {data.cta_text}
              </button>
              <a
                href={data.cta2_link}
                className="btn-cta btn-outline btn-lg"
                style={{ color: "white", borderColor: "rgba(255,255,255,0.25)" }}
              >
                <Phone size={18} />
                {data.cta2_text}
              </a>
            </div>

            <div className="hero-stats">
              {(data.stats ?? defaultHero.stats!).map((stat, i) => (
                <div key={i}>
                  <div className="hero-stat-num">{stat.value}</div>
                  <div className="hero-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card-stack">
              <div className="hero-card">
                <div className="hero-card-header">
                  <div className="hero-card-icon green">🔬</div>
                  <div>
                    <div className="hero-card-title">Phương pháp IPM</div>
                    <div className="hero-card-subtitle">Integrated Pest Management</div>
                  </div>
                </div>
                <div className="hero-card-body">
                  Kiểm soát dựa trên khoa học — thấu hiểu đặc tính loài, chỉ can thiệp hóa chất khi cần thiết tại điểm nóng.
                </div>
                <div className="hero-card-tags">
                  <span className="hero-card-tag">Khảo sát</span>
                  <span className="hero-card-tag">Phân tích</span>
                  <span className="hero-card-tag">Xử lý</span>
                  <span className="hero-card-tag">Giám sát</span>
                </div>
              </div>
              <div className="hero-card">
                <div className="hero-card-header">
                  <div className="hero-card-icon blue">📋</div>
                  <div>
                    <div className="hero-card-title">Báo cáo chuyên nghiệp</div>
                    <div className="hero-card-subtitle">Minh bạch · Định kỳ · Chi tiết</div>
                  </div>
                </div>
                <div className="hero-card-body">
                  Hệ thống báo cáo &amp; hồ sơ chi tiết, minh bạch, đáp ứng yêu cầu kiểm toán của mọi doanh nghiệp.
                </div>
              </div>
              <div className="hero-card">
                <div className="hero-card-header">
                  <div className="hero-card-icon amber">🛡️</div>
                  <div>
                    <div className="hero-card-title">An toàn tuyệt đối</div>
                    <div className="hero-card-subtitle">Hóa chất nhập ngoại cao cấp</div>
                  </div>
                </div>
                <div className="hero-card-body">
                  Hóa chất cao cấp không mùi, an toàn cho trẻ nhỏ và thú cưng. Bảo hành cam kết.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
