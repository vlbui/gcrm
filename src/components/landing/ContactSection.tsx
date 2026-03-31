import FadeUp from "./FadeUp";
import ContactForm from "./ContactForm";
import type { CompanyInfo } from "./AboutSection";

interface ContactSectionProps {
  companyInfo?: CompanyInfo | null;
}

export default function ContactSection({ companyInfo }: ContactSectionProps) {
  return (
    <section className="section contact-section" id="contact">
      <div className="container">
        <div className="contact-grid">
          <FadeUp>
            <div className="contact-info">
              <span
                className="section-label"
                style={{ background: "rgba(255,255,255,0.1)", color: "var(--primary-300)" }}
              >
                📞 Liên hệ
              </span>
              <h2>Nhận Khảo Sát &amp; Báo Giá Miễn Phí</h2>
              <p>
                Gửi thông tin để nhận tư vấn từ chuyên gia. Chúng tôi sẽ phản hồi trong vòng 30 phút trong giờ hành chính.
              </p>

              <div className="contact-details">
                <div className="contact-detail">
                  <div className="contact-detail-icon">📍</div>
                  <div className="contact-detail-text">
                    <h4>Địa chỉ</h4>
                    <p>Số 7, ngõ 125 Trung Kính, Yên Hòa, Cầu Giấy, Hà Nội</p>
                  </div>
                </div>
                <div className="contact-detail">
                  <div className="contact-detail-icon">📞</div>
                  <div className="contact-detail-text">
                    <h4>Hotline</h4>
                    <p>
                      <a href="tel:0859955969">085 9955 969</a>
                    </p>
                  </div>
                </div>
                <div className="contact-detail">
                  <div className="contact-detail-icon">✉️</div>
                  <div className="contact-detail-text">
                    <h4>Email</h4>
                    <p>
                      <a href="mailto:greenshield.jsc@gmail.com">greenshield.jsc@gmail.com</a>
                    </p>
                  </div>
                </div>
                <div className="contact-detail">
                  <div className="contact-detail-icon">🕐</div>
                  <div className="contact-detail-text">
                    <h4>Giờ làm việc</h4>
                    <p>
                      Thứ 2 — Thứ 7: 8:00 — 18:00
                      <br />
                      Chủ nhật: Theo hẹn
                    </p>
                  </div>
                </div>
              </div>

              <div className="contact-social-proof">
                <div className="contact-sp-avatars">
                  <div className="contact-sp-avatar a">T</div>
                  <div className="contact-sp-avatar b">M</div>
                  <div className="contact-sp-avatar c">H</div>
                  <div className="contact-sp-avatar d">N</div>
                </div>
                <div className="contact-sp-text">
                  <strong>300+ doanh nghiệp &amp; gia đình</strong> đã tin tưởng sử dụng dịch vụ
                </div>
              </div>
            </div>
          </FadeUp>

          <FadeUp>
            <ContactForm />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
