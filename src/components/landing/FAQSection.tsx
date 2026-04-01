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
    answer:
      "Gián Đức (Blattella germanica) có kích thước nhỏ 1.3–1.6cm, màu nâu vàng, sinh sản cực nhanh — mỗi con cái đẻ 30–40 trứng mỗi lần và sống được 6–9 tháng. Chúng thường ẩn nấp trong khe tủ bếp, thiết bị điện, hộp carton. Khác với gián Mỹ (gián bay, 3–4cm), gián Đức không bay được nhưng lây lan nhanh hơn nhiều và rất khó diệt bằng thuốc phun thông thường.",
  },
  {
    question: "Tại sao phun thuốc không diệt được gián Đức?",
    answer:
      "Gián Đức đã kháng hầu hết thuốc phun truyền thống (pyrethroid). Khi phun, gián trốn sâu vào khe kẽ tủ bếp, thiết bị điện và quay lại sau 1–2 tuần. Phương pháp hiệu quả nhất là gel bả chuyên dụng Maxforce (Bayer) hoặc Advion (Syngenta) — gián ăn bả, về tổ chết, đồng loại ăn xác tiếp tục trúng độc. Đây gọi là hiệu ứng dây chuyền (cascade effect), diệt được cả tổ gián chỉ trong 3–5 ngày.",
  },
  {
    question: "Thuốc diệt côn trùng có an toàn cho trẻ nhỏ và thú cưng không?",
    answer:
      "Hoàn toàn an toàn. Lá Chắn Xanh sử dụng thuốc diệt côn trùng nhập ngoại cao cấp từ Đức, Nhật — dòng sản phẩm không mùi, được Bộ Y tế cấp phép. Kỹ thuật viên sẽ hướng dẫn thời gian cách ly phù hợp (thường chỉ 2–4 giờ). Sau đó gia đình có thể sinh hoạt bình thường.",
  },
  {
    question: "Giá dịch vụ diệt côn trùng tại Hà Nội bao nhiêu?",
    answer:
      "Chi phí phụ thuộc vào diện tích, loại côn trùng và mức độ nhiễm. Lá Chắn Xanh khảo sát miễn phí tại nhà trước khi báo giá chính xác. Giá gói đơn lẻ từ 300.000đ/lần, gói định kỳ hàng tháng tiết kiệm 15–25% so với đơn lẻ. Cam kết không phát sinh chi phí.",
  },
  {
    question: "Sau bao lâu thì côn trùng hết hoàn toàn?",
    answer:
      "Tùy loại côn trùng và mức độ: Gián giảm rõ sau 3–5 ngày. Chuột hết sau 1–2 tuần. Mối cần 2–4 tuần để hệ thống mồi bả phát huy triệt để. Trong thời gian bảo hành, nếu côn trùng tái phát, chúng tôi quay lại xử lý hoàn toàn miễn phí.",
  },
  {
    question: "Tôi cần chuẩn bị gì trước khi diệt côn trùng?",
    answer:
      "Kỹ thuật viên sẽ gọi điện hướng dẫn trước khi đến. Thông thường bạn chỉ cần cất thực phẩm hở và vật dụng cá nhân. Đội ngũ Lá Chắn Xanh sẽ tự che phủ đồ đạc theo quy trình SOP chuẩn. Bạn không cần di chuyển nội thất lớn.",
  },
  {
    question: "Chính sách bảo hành dịch vụ diệt côn trùng như thế nào?",
    answer:
      "Gói đơn lẻ: bảo hành 30 ngày. Gói định kỳ: bảo hành liên tục, xử lý khẩn cấp miễn phí. Diệt mối: bảo hành 3–5 năm. Nếu côn trùng tái phát trong thời gian bảo hành, Lá Chắn Xanh quay lại xử lý hoàn toàn miễn phí — không phát sinh chi phí.",
  },
  {
    question: "Lá Chắn Xanh phục vụ khu vực nào?",
    answer:
      "Lá Chắn Xanh cung cấp dịch vụ diệt côn trùng tại Hà Nội và các tỉnh lân cận: Bắc Ninh, Hưng Yên, Hải Dương, Vĩnh Phúc, Hải Phòng. Đối với doanh nghiệp lớn, chúng tôi triển khai toàn miền Bắc. Gọi 085 9955 969 để được tư vấn.",
  },
  {
    question: "Phương pháp IPM khác gì phun thuốc truyền thống?",
    answer:
      "Phun thuốc truyền thống chỉ xử lý bề mặt — côn trùng dễ tái phát và kháng thuốc. IPM (Quản trị Dịch hại Tổng hợp) phân tích nguyên nhân gốc rễ, chặn đường xâm nhập, ưu tiên bẫy bả sinh học. Chỉ dùng hóa chất tại điểm nóng. Kết quả: hiệu quả lâu dài, ít hóa chất hơn, an toàn hơn cho gia đình.",
  },
];

export default function FAQSection({ faqs }: FAQSectionProps) {
  const data = faqs && faqs.length > 0 ? faqs : defaultFaqs;
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const toggleFaq = (index: number) => {
    setActiveIndex(activeIndex === index ? -1 : index);
  };

  return (
    <section className="section section-alt" id="faq">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <span className="section-label">❓ Câu hỏi thường gặp</span>
            <h2 className="section-title">Câu Hỏi Thường Gặp Về Dịch Vụ Diệt Côn Trùng</h2>
          </div>
        </FadeUp>

        <FadeUp>
          <div className="faq-list">
            {data.map((faq, i) => (
              <div className={`faq-item${activeIndex === i ? " active" : ""}`} key={faq.id ?? i}>
                <button className="faq-question" onClick={() => toggleFaq(i)}>
                  {faq.question}
                  <ChevronDown size={20} />
                </button>
                <div
                  className="faq-answer"
                  style={activeIndex === i ? { maxHeight: 300 } : undefined}
                >
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
