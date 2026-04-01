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
    title: "Kiểm soát Muỗi",
    description: "Phòng chống sốt xuất huyết, diệt muỗi cho khu dân cư, trường học, bệnh viện.",
    features: ["Phun ULV diện rộng", "Xử lý ổ bọ gậy", "Đèn bắt muỗi chuyên dụng"],
  },
  {
    icon: "🪳",
    title: "Diệt Gián & Kiến",
    description: "Xử lý triệt để gián Đức, gián Mỹ, kiến đen, kiến lửa tại nhà bếp, nhà hàng.",
    features: ["Gel bả diệt gián nhập ngoại", "Không mùi, an toàn thực phẩm", "Hiệu quả dây chuyền"],
  },
  {
    icon: "🐀",
    title: "Diệt Chuột",
    description: "Hệ thống bẫy chuột chuyên nghiệp, bả sinh học, chặn đường xâm nhập.",
    features: ["Trạm mồi bả chuyên dụng", "Phân tích đường đi chuột", "Tư vấn ngăn chặn tái xâm nhập"],
  },
  {
    icon: "🏠",
    title: "Xử lý Mối",
    description: "Bảo vệ công trình xây dựng, nhà gỗ khỏi mối xâm hại bằng hàng rào hóa học.",
    features: ["Hệ thống trạm mồi mối", "Khoan phun nền móng", "Bảo hành 3-5 năm"],
  },
  {
    icon: "🪰",
    title: "Kiểm soát Ruồi",
    description: "Giải pháp đèn bắt ruồi, bẫy pheromone cho nhà hàng, khu chế biến thực phẩm.",
    features: ["Đèn bắt côn trùng UV", "Bẫy pheromone không độc", "Phù hợp chuẩn vệ sinh ATTP"],
  },
  {
    icon: "🧹",
    title: "Phun khử trùng",
    description: "Khử khuẩn diện rộng cho văn phòng, trường học, bệnh viện, khu công nghiệp.",
    features: ["Phun sương ULV", "Chế phẩm y tế chuyên dụng", "Chứng nhận sau xử lý"],
  },
];

export default function ServicesSection({ services }: ServicesSectionProps) {
  const data = services && services.length > 0 ? services : defaultServices;

  return (
    <section className="section" id="services">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <span className="section-label">🐜 Dịch vụ</span>
            <h2 className="section-title">Giải Pháp Kiểm Soát Từng Loại Dịch Hại</h2>
            <p className="section-desc">
              Mỗi loài có đặc tính riêng, cần phác đồ xử lý chuyên biệt. Chúng tôi cung cấp giải pháp đúng đối tượng, đúng phương pháp.
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
                        <Check size={16} />
                        {feature}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <button
            className="btn-cta btn-accent btn-lg"
            onClick={() => window.dispatchEvent(new Event("open-contact-popup"))}
          >
            Nhận tư vấn & báo giá miễn phí
          </button>
        </div>
      </div>
    </section>
  );
}
