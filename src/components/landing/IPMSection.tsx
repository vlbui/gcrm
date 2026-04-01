import FadeUp from "./FadeUp";

const steps = [
  {
    num: 1,
    icon: "🔍",
    title: "Khảo sát miễn phí tại nhà",
    desc: "Kỹ thuật viên đến tận nơi khảo sát, xác định chính xác loại côn trùng, mật độ và nguồn phát sinh trước khi đưa ra phương án diệt côn trùng phù hợp.",
  },
  {
    num: 2,
    icon: "🧱",
    title: "Ngăn chặn & phòng ngừa",
    desc: "Tư vấn bịt kín đường xâm nhập của chuột, gián, mối. Hướng dẫn vệ sinh môi trường để triệt tiêu điều kiện sinh sôi của côn trùng gây hại.",
  },
  {
    num: 3,
    icon: "🧬",
    title: "Xử lý bằng hóa chất an toàn",
    desc: "Sử dụng thuốc diệt côn trùng nhập ngoại không mùi, an toàn cho trẻ nhỏ và thú cưng. Ưu tiên bẫy bả sinh học, chỉ phun hóa chất tại điểm nóng.",
  },
  {
    num: 4,
    icon: "📊",
    title: "Giám sát & bảo hành",
    desc: "Theo dõi diễn biến sau xử lý, cung cấp báo cáo định kỳ. Bảo hành cam kết — quay lại xử lý miễn phí nếu côn trùng tái phát.",
  },
];

export default function IPMSection() {
  return (
    <section className="section section-alt" id="ipm">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <span className="section-label">🔬 Quy trình diệt côn trùng</span>
            <h2 className="section-title">Phương Pháp IPM — Diệt Côn Trùng An Toàn, Hiệu Quả Lâu Dài</h2>
            <p className="section-desc">
              IPM (Integrated Pest Management) là phương pháp kiểm soát côn trùng khoa học được áp dụng toàn cầu. Thay vì phun thuốc tràn lan, chúng tôi phân tích nguyên nhân gốc rễ và xử lý đúng mục tiêu — an toàn hơn, hiệu quả hơn, tiết kiệm hơn.
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
