import FadeUp from "./FadeUp";

const steps = [
  {
    num: 1,
    icon: "🔍",
    title: "Khảo sát & Chẩn đoán",
    desc: "Xác định chính xác đối tượng, mật độ và nguồn gốc phát sinh côn trùng trước khi đưa ra phác đồ xử lý.",
  },
  {
    num: 2,
    icon: "🧱",
    title: "Ngăn chặn từ gốc",
    desc: "Tư vấn lấp kín kẽ hở hạ tầng và vệ sinh môi trường để triệt tiêu điều kiện sinh tồn của dịch hại.",
  },
  {
    num: 3,
    icon: "🧬",
    title: "Xử lý An toàn",
    desc: "Ưu tiên bẫy bả và chế phẩm sinh học không mùi. Chỉ can thiệp hóa chất khi cần thiết tại điểm nóng.",
  },
  {
    num: 4,
    icon: "📊",
    title: "Giám sát liên tục",
    desc: "Theo dõi diễn biến và cung cấp báo cáo định kỳ, đảm bảo mật độ côn trùng luôn ở mức an toàn.",
  },
];

export default function IPMSection() {
  return (
    <section className="section section-alt" id="ipm">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <span className="section-label">🔬 Phương pháp IPM</span>
            <h2 className="section-title">Hệ Tư Duy IPM — Quản Trị Tổng Hợp</h2>
            <p className="section-desc">
              Thay vì phun hóa chất tràn lan, IPM (Integrated Pest Management) là chiến lược kiểm soát dựa trên sự thấu hiểu về đặc tính loài và điều kiện môi trường thực tế.
            </p>
          </div>
        </FadeUp>

        <div className="ipm-steps">
          {steps.map((step) => (
            <FadeUp key={step.num}>
              <div className="ipm-step">
                <div className="ipm-step-num">{step.num}</div>
                <div className="ipm-step-icon">{step.icon}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
