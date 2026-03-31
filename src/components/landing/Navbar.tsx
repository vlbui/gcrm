"use client";

import { useState, useEffect } from "react";
import { Phone, Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`} id="navbar">
        <div className="nav-inner">
          <a href="#" className="nav-brand">
            <img src="/logo.png" alt="Logo Lá Chắn Xanh" className="nav-logo-img" />
            <div className="nav-brand-text">
              <span className="nav-brand-name">LÁ CHẮN XANH</span>
              <span className="nav-brand-sub">GreenShield JSC</span>
            </div>
          </a>

          <div className="nav-links">
            <a href="#about">Về chúng tôi</a>
            <a href="#ipm">Giải pháp IPM</a>
            <a href="#services">Dịch vụ</a>
            <a href="#pricing">Bảng giá</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="nav-cta-group">
            <a href="tel:0859955969" className="nav-phone">
              <Phone size={18} />
              085 9955 969
            </a>
            <a href="#contact" className="btn-cta btn-primary">
              Báo giá miễn phí
            </a>
          </div>

          <button
            className={`hamburger${mobileOpen ? " active" : ""}`}
            aria-label="Menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${mobileOpen ? " active" : ""}`}>
        <a href="#about" onClick={closeMobile}>Về chúng tôi</a>
        <a href="#ipm" onClick={closeMobile}>Giải pháp IPM</a>
        <a href="#services" onClick={closeMobile}>Dịch vụ</a>
        <a href="#pricing" onClick={closeMobile}>Bảng giá</a>
        <a href="#faq" onClick={closeMobile}>FAQ</a>
        <a href="#contact" onClick={closeMobile}>Liên hệ</a>
        <div className="mobile-cta">
          <a
            href="tel:0859955969"
            className="btn-cta btn-primary btn-lg"
            style={{ justifyContent: "center" }}
          >
            <Phone size={18} />
            Gọi ngay: 085 9955 969
          </a>
        </div>
      </div>
    </>
  );
}
