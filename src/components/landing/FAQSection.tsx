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
    question: "Phun thuốc có an toàn cho trẻ nhỏ và thú cưng không?",
    answer:
      "Hoàn toàn an toàn. Chúng tôi sử dụng hóa chất nhập ngoại cao cấp — đều là dòng sản phẩm không mùi, có chứng nhận an toàn cho sức khỏe con người và thú cưng. Ngoài ra, kỹ thuật viên sẽ hướng dẫn bạn thời gian cách ly phù hợp (thường chỉ 2-4 giờ) trước khi quay lại sinh hoạt bình thường.",
  },
  {
    question: "Sau bao lâu thì côn trùng hết hoàn toàn?",
    answer:
      "Tùy thuộc vào loại dịch hại và mức độ nhiễm. Với gián, thường thấy hiệu quả rõ rệt sau 3-5 ngày. Với chuột, sau 1-2 tuần. Với mối, cần 2-4 tuần để hệ thống mồi bả phát huy tác dụng triệt để. Chúng tôi cam kết bảo hành và quay lại xử lý miễn phí nếu chưa đạt hiệu quả.",
  },
  {
    question: "Tôi cần chuẩn bị gì trước khi đội ngũ đến?",
    answer:
      "Kỹ thuật viên sẽ liên hệ trước và hướng dẫn cụ thể. Thông thường, bạn chỉ cần cất thực phẩm hở và vật dụng cá nhân khỏi khu vực xử lý. Đội ngũ chúng tôi sẽ tự che phủ đồ đạc theo quy trình SOP chuẩn, bạn không cần di chuyển nội thất lớn.",
  },
  {
    question: "Chính sách bảo hành như thế nào?",
    answer:
      "Gói đơn lẻ: bảo hành 30 ngày. Gói định kỳ: bảo hành liên tục trong suốt hợp đồng, xử lý khẩn cấp miễn phí. Gói xử lý mối: bảo hành từ 3-5 năm tùy phương pháp. Trong thời gian bảo hành, nếu dịch hại tái phát, chúng tôi quay lại xử lý hoàn toàn miễn phí.",
  },
  {
    question: "Lá Chắn Xanh có phục vụ ngoài Hà Nội không?",
    answer:
      "Hiện tại chúng tôi tập trung phục vụ khu vực Hà Nội và các tỉnh lân cận (Bắc Ninh, Hưng Yên, Hải Dương, Vĩnh Phúc...). Đối với dự án lớn hoặc hợp đồng doanh nghiệp, chúng tôi có thể triển khai tại các tỉnh miền Bắc. Vui lòng liên hệ hotline để được tư vấn cụ thể.",
  },
  {
    question: "IPM khác gì so với phun thuốc truyền thống?",
    answer:
      "Phun thuốc truyền thống chỉ xử lý bề mặt, côn trùng dễ tái phát và kháng thuốc. IPM (Quản trị Dịch hại Tổng hợp) là phương pháp khoa học: phân tích nguyên nhân gốc rễ, chặn đường xâm nhập, ưu tiên biện pháp sinh học, chỉ dùng hóa chất tại điểm nóng. Hiệu quả lâu dài, ít hóa chất hơn, an toàn hơn.",
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
            <h2 className="section-title">Giải Đáp Thắc Mắc</h2>
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
