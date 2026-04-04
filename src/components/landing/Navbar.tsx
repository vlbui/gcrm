"use client";

import { useState, useEffect } from "react";
import { Phone, Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <a href="#" className="nav-brand">
            <img src="/logo.png" alt="Lá Chắn Xanh" className="nav-logo-img" />
            <div className="nav-brand-text">
              <span className="nav-brand-name">LÁ CHẮN XANH</span>
              <span className="nav-brand-sub">GreenShield JSC</span>
            </div>
          </a>

          <div className="nav-links">
            <a href="#about">Về chúng tôi</a>
            <a href="#ipm">IPM</a>
            <a href="#services">Dịch vụ</a>
            <a href="#pricing">Bảng giá</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="nav-cta-group">
            <a href="tel:0859955969" className="nav-phone">
              <Phone size={16} />
              085 9955 969
            </a>
            <button
              className="btn-cta btn-primary"
              onClick={() => window.dispatchEvent(new Event("open-contact-popup"))}
            >
              Báo giá miễn phí
              <ArrowRight size={15} />
            </button>
          </div>

          <button
            className="hamburger"
            aria-label="Menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${mobileOpen ? " active" : ""}`}>
        <a href="#about" onClick={closeMobile}>Về chúng tôi</a>
        <a href="#ipm" onClick={closeMobile}>IPM</a>
        <a href="#services" onClick={closeMobile}>Dịch vụ</a>
        <a href="#pricing" onClick={closeMobile}>Bảng giá</a>
        <a href="#faq" onClick={closeMobile}>FAQ</a>
        <div className="mobile-cta">
          <a href="tel:0859955969" className="btn-cta btn-primary" style={{ justifyContent: "center", width: "100%" }}>
            <Phone size={16} />
            Gọi ngay: 085 9955 969
          </a>
        </div>
      </div>
    </>
  );
}
