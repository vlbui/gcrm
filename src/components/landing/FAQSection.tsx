"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import FadeUp from "./FadeUp";

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs?: FAQItem[];
}

const defaultFaqs: FAQItem[] = [
  {
    question: "Gián Đức khác gián thường như thế nào?",
    answer: "Gián Đức (Blattella germanica) có kích thước nhỏ 1.3–1.6cm, màu nâu vàng, sinh sản cực nhanh — mỗi con cái đẻ 30–40 trứng mỗi lần. Chúng thường ẩn nấp trong khe tủ bếp, thiết bị điện. Khác với gián Mỹ (3–4cm), gián Đức không bay được nhưng lây lan nhanh hơn và rất khó diệt bằng thuốc phun thông thường.",
  },
  {
    question: "Tại sao phun thuốc không diệt được gián Đức?",
    answer: "Gián Đức đã kháng hầu hết thuốc phun truyền thống (pyrethroid). Phương pháp hiệu quả nhất là gel bả chuyên dụng Maxforce hoặc Advion — gián ăn bả, về tổ chết, đồng loại ăn xác tiếp tục trúng độc (hiệu ứng dây chuyền), diệt cả tổ trong 3–5 ngày.",
  },
  {
    question: "Thuốc có an toàn cho trẻ nhỏ và thú cưng không?",
    answer: "Hoàn toàn an toàn. Chúng tôi sử dụng thuốc nhập ngoại cao cấp từ Đức, Nhật — dòng sản phẩm không mùi, được Bộ Y tế cấp phép. Thời gian cách ly thường chỉ 2–4 giờ.",
  },
  {
    question: "Giá dịch vụ diệt côn trùng tại Hà Nội bao nhiêu?",
    answer: "Chi phí phụ thuộc vào diện tích, loại côn trùng và mức độ nhiễm. Khảo sát miễn phí trước khi báo giá. Gói đơn lẻ từ 300.000đ/lần, gói định kỳ giảm 15–25%. Cam kết không phát sinh.",
  },
  {
    question: "Sau bao lâu thì côn trùng hết hoàn toàn?",
    answer: "Tùy loại: Gián giảm rõ sau 3–5 ngày. Chuột hết sau 1–2 tuần. Mối cần 2–4 tuần. Trong thời gian bảo hành, nếu tái phát sẽ xử lý lại hoàn toàn miễn phí.",
  },
  {
    question: "Chính sách bảo hành như thế nào?",
    answer: "Gói đơn lẻ: bảo hành 30 ngày. Gói định kỳ: bảo hành liên tục, xử lý khẩn cấp miễn phí. Diệt mối: bảo hành 3–5 năm. Tái phát trong bảo hành — xử lý miễn phí, không phát sinh.",
  },
  {
    question: "Lá Chắn Xanh phục vụ khu vực nào?",
    answer: "Hà Nội và các tỉnh lân cận: Bắc Ninh, Hưng Yên, Hải Dương, Vĩnh Phúc, Hải Phòng. Doanh nghiệp lớn — triển khai toàn miền Bắc.",
  },
  {
    question: "Phương pháp IPM khác gì phun thuốc truyền thống?",
    answer: "Phun thuốc truyền thống chỉ xử lý bề mặt — dễ tái phát và kháng thuốc. IPM phân tích nguyên nhân gốc rễ, chặn đường xâm nhập, ưu tiên bẫy bả sinh học. Chỉ dùng hóa chất tại điểm nóng. Hiệu quả lâu dài, ít hóa chất, an toàn hơn.",
  },
];

export default function FAQSection({ faqs }: FAQSectionProps) {
  const data = faqs && faqs.length > 0 ? faqs : defaultFaqs;
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <section className="section" id="faq">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <p className="section-label">FAQ</p>
            <h2 className="section-title">Câu Hỏi Thường Gặp</h2>
          </div>
        </FadeUp>

        <FadeUp>
          <div className="faq-list">
            {data.map((faq, i) => (
              <div className={`faq-item${activeIndex === i ? " active" : ""}`} key={faq.id ?? i}>
                <button className="faq-question" onClick={() => setActiveIndex(activeIndex === i ? -1 : i)}>
                  {faq.question}
                  <ChevronDown size={18} />
                </button>
                <div className="faq-answer" style={activeIndex === i ? { maxHeight: 300 } : undefined}>
                  <div className="faq-answer-inner">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
