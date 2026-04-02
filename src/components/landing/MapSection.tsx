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
    </section>
  );
}
