import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand-name">
              <img
                src="/logo.png"
                alt="Lá Chắn Xanh"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: 10,
                }}
              />
              LÁ CHẮN XANH
            </div>
            <p className="footer-brand-desc">
              Chuyên gia kiểm soát côn trùng IPM — Bảo vệ sức khỏe và tài sản bằng tri thức khoa học.
            </p>
            <p className="footer-mst">MST: 0110328932</p>
          </div>

          <div>
            <h4>Dịch vụ</h4>
            <div className="footer-links">
              <a href="#services">Kiểm soát Muỗi</a>
              <a href="#services">Diệt Gián &amp; Kiến</a>
              <a href="#services">Diệt Chuột</a>
              <a href="#services">Xử lý Mối</a>
              <a href="#services">Phun khử trùng</a>
              <a href="#services">Kiểm soát Ruồi</a>
            </div>
          </div>

          <div>
            <h4>Thông tin</h4>
            <div className="footer-links">
              <a href="#about">Về chúng tôi</a>
              <a href="#ipm">Phương pháp IPM</a>
              <a href="#pricing">Bảng giá</a>
              <a href="#faq">FAQ</a>
              <a href="#contact">Liên hệ</a>
            </div>
          </div>

          <div>
            <h4>Liên hệ</h4>
            <div className="footer-contact-item">
              <MapPin size={16} />
              Số 7, ngõ 125 Trung Kính, Yên Hòa, Cầu Giấy, Hà Nội
            </div>
            <div className="footer-contact-item">
              <Phone size={16} />
              <a href="tel:0859955969" style={{ color: "var(--primary-400)" }}>
                085 9955 969
              </a>
            </div>
            <div className="footer-contact-item">
              <Mail size={16} />
              greenshield.jsc@gmail.com
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 GreenShield JSC — Công ty Cổ phần Lá Chắn Xanh. All rights reserved.</span>
          <span>Thiết kế bởi GreenShield Team</span>
        </div>
      </div>
    </footer>
  );
}
