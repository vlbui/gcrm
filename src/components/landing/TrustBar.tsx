export default function TrustBar() {
  const items = [
    { icon: "🏥", text: "Chuyên gia diệt côn trùng" },
    { icon: "🌍", text: "Hóa chất nhập ngoại không mùi" },
    { icon: "📊", text: "Báo cáo & giám sát định kỳ" },
    { icon: "⏰", text: "Hỗ trợ khẩn cấp 24/7" },
    { icon: "✅", text: "Bảo hành lên đến 5 năm" },
  ];

  return (
    <div className="trust-bar">
      <div className="container">
        <div className="trust-inner">
          {items.map((item, i) => (
            <div className="trust-item" key={i}>
              <div className="trust-icon">{item.icon}</div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
