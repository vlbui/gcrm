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
    title: "Dịch vụ diệt muỗi",
    description: "Diệt muỗi tận gốc cho khu dân cư, trường học, bệnh viện, nhà máy. Phòng chống sốt xuất huyết hiệu quả bằng phương pháp phun ULV và xử lý ổ lăng quăng.",
    features: ["Phun ULV diện rộng không mùi", "Xử lý ổ bọ gậy, lăng quăng", "Đèn bắt muỗi UV chuyên dụng"],
  },
  {
    icon: "🪳",
    title: "Dịch vụ diệt gián Đức & gián Mỹ",
    description: "Chuyên diệt gián Đức (Blattella germanica) bằng gel bả nhập ngoại Maxforce, Advion. Hiệu quả dây chuyền — một con ăn bả, cả tổ diệt vì gián có tập tính ăn xác đồng loại. Diệt sạch gián trong 3–5 ngày, không mùi, an toàn thực phẩm.",
    features: ["Gel bả Maxforce, Advion nhập ngoại chính hãng", "Diệt dây chuyền — 1 con trúng bả, cả tổ diệt", "Hiệu quả 3–5 ngày, bảo hành 30 ngày"],
  },
  {
    icon: "🐀",
    title: "Dịch vụ diệt chuột",
    description: "Diệt chuột chuyên nghiệp bằng hệ thống bẫy và bả sinh học. Phân tích đường đi chuột, bịt kín điểm xâm nhập, ngăn chặn chuột quay lại.",
    features: ["Trạm mồi bả chống xâm nhập", "Phân tích & bịt đường đi chuột", "Bảo hành — xử lý lại miễn phí"],
  },
  {
    icon: "🏠",
    title: "Dịch vụ diệt mối",
    description: "Diệt mối tận gốc bảo vệ nhà ở, biệt thự, công trình xây dựng. Hệ thống trạm mồi mối và khoan phun nền móng với bảo hành lên đến 5 năm.",
    features: ["Hệ thống trạm mồi mối hiện đại", "Khoan phun nền móng chuyên sâu", "Bảo hành 3–5 năm"],
  },
  {
    icon: "🪰",
    title: "Dịch vụ diệt ruồi",
    description: "Kiểm soát ruồi cho nhà hàng, bếp ăn công nghiệp, khu chế biến thực phẩm. Đèn bắt ruồi UV và bẫy pheromone đạt chuẩn VSATTP.",
    features: ["Đèn bắt côn trùng UV", "Bẫy pheromone không độc hại", "Đạt chuẩn vệ sinh ATTP"],
  },
  {
    icon: "🧹",
    title: "Phun khử trùng, khử khuẩn",
    description: "Dịch vụ phun khử trùng diện rộng cho văn phòng, trường học, bệnh viện, nhà máy. Sử dụng chế phẩm y tế chuyên dụng, cấp chứng nhận sau xử lý.",
    features: ["Phun sương ULV công nghệ cao", "Chế phẩm y tế WHO khuyến cáo", "Cấp chứng nhận khử trùng"],
  },
];

export default function ServicesSection({ services }: ServicesSectionProps) {
  const data = services && services.length > 0 ? services : defaultServices;

  return (
    <section className="section" id="services">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <span className="section-label">🐜 Dịch vụ diệt côn trùng</span>
            <h2 className="section-title">Dịch Vụ Diệt Côn Trùng Chuyên Nghiệp Tại Hà Nội</h2>
            <p className="section-desc">
              Mỗi loại côn trùng cần phương pháp xử lý riêng biệt. Lá Chắn Xanh cung cấp giải pháp diệt mối, gián, chuột, muỗi, kiến, ruồi đúng đối tượng, đúng phương pháp — an toàn và hiệu quả lâu dài.
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
