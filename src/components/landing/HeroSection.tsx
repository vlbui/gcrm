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
  headline: "Dịch Vụ Diệt Côn Trùng",
  sub_headline: "Chuyên Nghiệp Tại Hà Nội",
  description:
    "Lá Chắn Xanh — công ty diệt côn trùng hàng đầu Hà Nội. Chuyên diệt mối, gián, chuột, muỗi, kiến, ruồi cho gia đình và doanh nghiệp. Phương pháp IPM an toàn, hóa chất nhập ngoại không mùi. Khảo sát miễn phí — Bảo hành cam kết.",
  cta_text: "Nhận báo giá miễn phí",
  cta_link: "#contact",
  cta2_text: "085 9955 969",
  cta2_link: "tel:0859955969",
  badges: [
    { icon: "check", text: "Phương pháp IPM quốc tế" },
    { icon: "shield", text: "An toàn cho trẻ nhỏ & thú cưng" },
    { text: "Hóa chất nhập ngoại cao cấp" },
  ],
  stats: [
    { value: "300+", label: "Gia đình & doanh nghiệp tin tưởng" },
    { value: "10+", label: "Năm kinh nghiệm thực chiến" },
    { value: "100%", label: "Cam kết hài lòng" },
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
                    <div className="hero-card-title">Phương pháp IPM tiên tiến</div>
                    <div className="hero-card-subtitle">Quản trị dịch hại tổng hợp</div>
                  </div>
                </div>
                <div className="hero-card-body">
                  Kiểm soát côn trùng dựa trên khoa học — phân tích đặc tính loài, chỉ dùng hóa chất tại điểm nóng. Hiệu quả lâu dài, an toàn tuyệt đối.
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
                    <div className="hero-card-subtitle">Minh bạch · Định kỳ · Đáp ứng kiểm toán</div>
                  </div>
                </div>
                <div className="hero-card-body">
                  Hệ thống báo cáo diệt côn trùng chi tiết, đáp ứng yêu cầu kiểm toán VSATTP cho nhà hàng, khách sạn, nhà máy.
                </div>
              </div>
              <div className="hero-card">
                <div className="hero-card-header">
                  <div className="hero-card-icon amber">🛡️</div>
                  <div>
                    <div className="hero-card-title">An toàn cho gia đình</div>
                    <div className="hero-card-subtitle">Hóa chất không mùi, nhập ngoại</div>
                  </div>
                </div>
                <div className="hero-card-body">
                  Thuốc diệt côn trùng nhập khẩu cao cấp, không mùi, an toàn cho trẻ nhỏ và thú cưng. Bảo hành 30 ngày — 5 năm.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
