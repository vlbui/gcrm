import { ExternalLink } from "lucide-react";

export default function MapSection() {
  return (
    <section className="map-section" id="map">
      <div className="map-header">
        <div className="container">
          <div className="map-header-inner">
            <div className="map-info">
              <span className="section-label">📍 Bản đồ</span>
              <h3
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--primary-900)",
                  marginBottom: 6,
                }}
              >
                Văn Phòng Lá Chắn Xanh
              </h3>
              <p style={{ fontSize: 14, color: "var(--neutral-600)" }}>
                Số 7, ngõ 125 Trung Kính, Yên Hòa, Cầu Giấy, Hà Nội
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=Số+7+ngõ+125+Trung+Kính+Yên+Hòa+Cầu+Giấy+Hà+Nội"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta btn-outline"
              style={{ flexShrink: 0 }}
            >
              <ExternalLink size={16} />
              Mở Google Maps
            </a>
          </div>
        </div>
      </div>
      <div className="map-embed">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.0!2d105.7962!3d21.0135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab4cd0c0c1f1%3A0x1234567890abcdef!2zU-G7kSA3LCBuZ8O1IDEyNSBUcnVuZyBLw61uaCwgWcOqbiBIb8OgLCBD4bqndSBHaeG6pXksIEjDoCBO4buZaQ!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn"
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Bản đồ Lá Chắn Xanh - Số 7, ngõ 125 Trung Kính, Cầu Giấy, Hà Nội"
        />
      </div>
    </section>
  );
}
