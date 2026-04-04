"use client";

import { Check } from "lucide-react";
import FadeUp from "./FadeUp";

export interface ServiceItem {
  id?: string;
  title: string;
  description: string;
  icon: string;
  features?: string[];
}

interface ServicesSectionProps {
  services?: ServiceItem[];
}

const defaultServices: ServiceItem[] = [
  {
    icon: "🦟",
    title: "Diệt muỗi",
    description: "Diệt muỗi tận gốc cho khu dân cư, trường học, bệnh viện. Phòng chống sốt xuất huyết hiệu quả.",
    features: ["Phun ULV không mùi", "Xử lý ổ bọ gậy", "Đèn bắt muỗi UV"],
  },
  {
    icon: "🪳",
    title: "Diệt gián Đức & gián Mỹ",
    description: "Gel bả nhập ngoại Maxforce, Advion. Hiệu quả dây chuyền — diệt sạch trong 3–5 ngày.",
    features: ["Gel bả chính hãng nhập ngoại", "Diệt dây chuyền cả tổ", "Bảo hành 30 ngày"],
  },
  {
    icon: "🐀",
    title: "Diệt chuột",
    description: "Hệ thống bẫy và bả sinh học. Phân tích đường đi chuột, bịt kín điểm xâm nhập.",
    features: ["Trạm mồi bả chống xâm nhập", "Bịt đường đi chuột", "Xử lý lại miễn phí"],
  },
  {
    icon: "🏠",
    title: "Diệt mối",
    description: "Diệt mối tận gốc bảo vệ nhà ở, công trình. Trạm mồi mối và khoan phun nền móng.",
    features: ["Trạm mồi mối hiện đại", "Khoan phun nền móng", "Bảo hành 3–5 năm"],
  },
  {
    icon: "🪰",
    title: "Diệt ruồi",
    description: "Kiểm soát ruồi cho nhà hàng, bếp ăn công nghiệp. Đèn bắt ruồi UV và bẫy pheromone.",
    features: ["Đèn côn trùng UV", "Bẫy pheromone", "Đạt chuẩn VSATTP"],
  },
  {
    icon: "🧹",
    title: "Phun khử trùng",
    description: "Phun khử trùng diện rộng cho văn phòng, trường học, bệnh viện, nhà máy.",
    features: ["Phun sương ULV", "Chế phẩm WHO", "Cấp chứng nhận"],
  },
];

export default function ServicesSection({ services }: ServicesSectionProps) {
  const data = services && services.length > 0 ? services : defaultServices;

  return (
    <section className="section" id="services">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <p className="section-label">Dịch vụ</p>
            <h2 className="section-title">Dịch Vụ Diệt Côn Trùng Chuyên Nghiệp</h2>
            <p className="section-desc">
              Mỗi loại côn trùng cần phương pháp xử lý riêng biệt. Giải pháp đúng đối tượng, đúng phương pháp — an toàn và hiệu quả lâu dài.
            </p>
          </div>
        </FadeUp>

        <div className="services-grid">
          {data.map((service, i) => (
            <FadeUp key={service.id ?? i}>
              <div className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                {service.features && service.features.length > 0 && (
                  <div className="service-features">
                    {service.features.map((feature, j) => (
                      <div className="service-feature" key={j}>
                        <Check size={14} />
                        {feature}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button
            className="btn-cta btn-primary btn-lg"
            onClick={() => window.dispatchEvent(new Event("open-contact-popup"))}
          >
            Nhận tư vấn & báo giá miễn phí
          </button>
        </div>
      </div>
    </section>
  );
}
