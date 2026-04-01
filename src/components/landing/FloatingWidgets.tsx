"use client";

import { useState, useEffect } from "react";
import { Phone, ArrowUp } from "lucide-react";

export default function FloatingWidgets() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Desktop floating widgets */}
      <div className="floating-widgets">
        <a
          href="https://zalo.me/0859955969"
          target="_blank"
          rel="noopener noreferrer"
          className="widget-zalo"
          aria-label="Chat Zalo"
        >
          <span className="widget-zalo-label">Chat Zalo ngay</span>
          <div className="widget-zalo-btn">Zalo</div>
        </a>
        <a href="tel:0859955969" className="widget-phone" aria-label="Gọi điện">
          <span className="widget-phone-label">Gọi ngay: 085 9955 969</span>
          <div className="widget-phone-btn">
            <Phone size={24} />
          </div>
        </a>
      </div>

      {/* Mobile bottom bar */}
      <div className="mobile-bottom-bar">
        <div className="mobile-bottom-inner">
          <a href="tel:0859955969" className="mobile-bottom-btn phone-btn">
            <Phone size={18} />
            Gọi ngay
          </a>
          <a
            href="https://zalo.me/0859955969"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-bottom-btn zalo-btn"
          >
            💬 Chat Zalo
          </a>
        </div>
      </div>

      {/* Back to top */}
      <button
        className={`back-to-top${showBackToTop ? " visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Lên đầu trang"
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>
    </>
  );
}
