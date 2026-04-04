import FadeUp from "./FadeUp";

const steps = [
  { num: 1, title: "Khảo sát miễn phí tại nhà", desc: "Kỹ thuật viên đến tận nơi khảo sát, xác định chính xác loại côn trùng, mật độ và nguồn phát sinh." },
  { num: 2, title: "Ngăn chặn & phòng ngừa", desc: "Tư vấn bịt kín đường xâm nhập, hướng dẫn vệ sinh môi trường để triệt tiêu điều kiện sinh sôi." },
  { num: 3, title: "Xử lý bằng hóa chất an toàn", desc: "Thuốc diệt côn trùng nhập ngoại không mùi, ưu tiên bẫy bả sinh học, chỉ phun hóa chất tại điểm nóng." },
  { num: 4, title: "Giám sát & bảo hành", desc: "Theo dõi diễn biến sau xử lý, cung cấp báo cáo định kỳ. Bảo hành cam kết — quay lại miễn phí nếu tái phát." },
];

export default function IPMSection() {
  return (
    <section className="section section-alt" id="ipm">
      <div className="container">
        <FadeUp>
          <div className="section-header">
            <p className="section-label">Quy trình</p>
            <h2 className="section-title">Phương Pháp IPM — An Toàn, Hiệu Quả Lâu Dài</h2>
            <p className="section-desc">
              IPM (Integrated Pest Management) là phương pháp kiểm soát côn trùng khoa học được áp dụng toàn cầu. Phân tích nguyên nhân gốc rễ, xử lý đúng mục tiêu — an toàn hơn, hiệu quả hơn.
            </p>
          </div>
        </FadeUp>

        <div className="ipm-steps">
          {steps.map((step) => (
            <FadeUp key={step.num}>
              <div className="ipm-step">
                <div className="ipm-step-num">{step.num}</div>
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
