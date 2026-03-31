import { Check } from "lucide-react";
import FadeUp from "./FadeUp";

export interface PricingItem {
  id?: string;
  title: string;
  subtitle: string;
  loai_goi?: string;
  features?: string[];
  is_popular?: boolean;
  icon?: string;
  cta_text?: string;
}

interface PricingSectionProps {
  pricing?: PricingItem[];
}

const defaultPricing: PricingItem[] = [
  {
    icon: "🏠",
    title: "Xử Lý Đơn Lẻ",
    subtitle: "Cho hộ gia đình, xử lý 1 lần",
    is_popular: false,
    features: [
      "Khảo sát hiện trạng miễn phí",
      "Xử lý 1 loại dịch hại",
      "Bảo hành 30 ngày",
      "Báo cáo sau xử lý",
    ],
    cta_text: "Nhận báo giá",
  },
  {
    icon: "🔄",
    title: "Định Kỳ Hàng Tháng",
    subtitle: "Gói bảo vệ liên tục, hiệu quả cao",
    is_popular: true,
    features: [
      "Xử lý định kỳ 1 lần/tháng",
      "Bao gồm tất cả loại dịch hại",
      "Xử lý khẩn cấp miễn phí",
      "Báo cáo hàng tháng chi tiết",
      "Giảm 15% so với đơn lẻ",
    ],
    cta_text: "Nhận báo giá",
  },
  {
    icon: "🏢",
    title: "Hợp Đồng Năm",
    subtitle: "Cho doanh nghiệp, bao trọn gói",
    is_popular: false,
    features: [
      "Quản lý tài khoản chuyên biệt",
      "Báo cáo chuyên nghiệp, chi tiết",
      "Hỗ trợ kiểm toán doanh nghiệp",
      "Giảm 25% so với đơn lẻ",
    ],
    cta_text: "Liên hệ tư vấn",
  },
];

export default function PricingSection({ pricing }: PricingSectionProps) {
  const data = pricing && pricing.length > 0 ? pricing : defaultPricing;

  return (
    <section className="section" id="pricing">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <span className="section-label">💰 Bảng giá tham khảo</span>
            <h2 className="section-title">Các Gói Dịch Vụ</h2>
            <p className="section-desc">
              Minh bạch về chi phí — bạn biết chính xác mình đang trả cho điều gì. Giá cuối cùng tùy thuộc vào khảo sát thực tế.
            </p>
          </div>
        </FadeUp>

        <div className="pricing-grid">
          {data.map((plan, i) => (
            <FadeUp key={plan.id ?? i}>
              <div className={`pricing-card${plan.is_popular ? " featured" : ""}`}>
                {plan.is_popular && <div className="pricing-badge">⭐ Phổ biến nhất</div>}
                <div className="pricing-icon">{plan.icon}</div>
                <h3>{plan.title}</h3>
                <p className="pricing-subtitle">{plan.subtitle}</p>
                <div className="pricing-divider"></div>
                <div className="pricing-features">
                  {(plan.features ?? []).map((feature, j) => (
                    <div className="pricing-feature" key={j}>
                      <Check size={16} strokeWidth={2.5} />
                      {feature}
                    </div>
                  ))}
                </div>
                <a
                  href="#contact"
                  className={`btn-cta ${plan.is_popular ? "btn-primary" : "btn-outline"}`}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {plan.cta_text ?? "Nhận báo giá"}
                </a>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
