"use client";

import { Phone, ArrowRight } from "lucide-react";

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
    "Lá Chắn Xanh — công ty diệt côn trùng hàng đầu Hà Nội. Chuyên diệt gián Đức bằng gel bả nhập ngoại, diệt mối, chuột, muỗi cho gia đình và doanh nghiệp. Phương pháp IPM an toàn, hóa chất không mùi. Khảo sát miễn phí — Bảo hành cam kết.",
  cta_text: "Nhận báo giá miễn phí",
  cta_link: "#contact",
  cta2_text: "085 9955 969",
  cta2_link: "tel:0859955969",
  badges: [
    { text: "Phương pháp IPM quốc tế" },
    { text: "An toàn cho trẻ nhỏ & thú cưng" },
    { text: "Hóa chất nhập ngoại cao cấp" },
  ],
  stats: [
    { value: "300+", label: "Khách hàng tin tưởng" },
    { value: "10+", label: "Năm kinh nghiệm" },
    { value: "100%", label: "Cam kết hài lòng" },
  ],
};

export default function HeroSection({ hero }: HeroSectionProps) {
  const data = { ...defaultHero, ...hero };

  return (
    <section className="hero" id="hero">
      <div className="container">
        <div className="hero-inner">
          <div className="hero-badges">
            {(data.badges ?? defaultHero.badges!).map((badge, i) => (
              <span className="hero-badge" key={i}>{badge.text}</span>
            ))}
          </div>

          <h1>
            {data.headline}{" "}
            <span className="text-accent">{data.sub_headline}</span>
          </h1>

          <p className="hero-desc">{data.description}</p>

          <div className="hero-actions">
            <button
              className="btn-cta btn-primary btn-lg"
              onClick={() => window.dispatchEvent(new Event("open-contact-popup"))}
            >
              {data.cta_text}
              <ArrowRight size={18} />
            </button>
            <a href={data.cta2_link} className="btn-cta btn-outline-light btn-lg">
              <Phone size={18} />
              {data.cta2_text}
            </a>
          </div>

          <div className="hero-stats">
            {(data.stats ?? defaultHero.stats!).map((stat, i) => (
              <div className="hero-stat" key={i}>
                <div className="hero-stat-num">{stat.value}</div>
                <div className="hero-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
