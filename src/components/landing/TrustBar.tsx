export default function TrustBar() {
  const items = [
    { icon: "🏥", text: "Chuyên gia Dịch tễ" },
    { icon: "🌍", text: "Hóa chất nhập ngoại" },
    { icon: "📊", text: "Báo cáo định kỳ" },
    { icon: "⏰", text: "Hỗ trợ 24/7" },
    { icon: "✅", text: "Bảo hành cam kết" },
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
