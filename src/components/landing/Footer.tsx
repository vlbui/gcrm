import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <img src="/logo.png" alt="Lá Chắn Xanh" className="footer-logo" />
              <span className="footer-brand-name">LÁ CHẮN XANH</span>
            </div>
            <p className="footer-desc">
              Công ty dịch vụ diệt côn trùng chuyên nghiệp tại Hà Nội. Phương pháp IPM an toàn.
            </p>
            <p className="footer-mst">MST: 0110328932</p>
          </div>

          <div>
            <h4>Dịch vụ</h4>
            <div className="footer-links">
              <a href="#services">Diệt muỗi</a>
              <a href="#services">Diệt gián</a>
              <a href="#services">Diệt chuột</a>
              <a href="#services">Diệt mối</a>
              <a href="#services">Diệt ruồi</a>
              <a href="#services">Phun khử trùng</a>
            </div>
          </div>

          <div>
            <h4>Thông tin</h4>
            <div className="footer-links">
              <a href="#about">Về chúng tôi</a>
              <a href="#ipm">Phương pháp IPM</a>
              <a href="#pricing">Bảng giá</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>

          <div>
            <h4>Liên hệ</h4>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <MapPin size={15} />
                <span>Số 7, ngõ 125 Trung Kính, Yên Hòa, Cầu Giấy, Hà Nội</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={15} />
                <a href="tel:0859955969">085 9955 969</a>
              </div>
              <div className="footer-contact-item">
                <Mail size={15} />
                <span>greenshield.jsc@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; 2026 GreenShield JSC &mdash; Công ty Cổ phần Lá Chắn Xanh</span>
        </div>
      </div>
    </footer>
  );
}
