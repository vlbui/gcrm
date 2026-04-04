export default function TrustBar() {
  const items = [
    "Chuyên gia diệt côn trùng",
    "Hóa chất nhập ngoại không mùi",
    "Báo cáo & giám sát định kỳ",
    "Hỗ trợ khẩn cấp 24/7",
    "Bảo hành lên đến 5 năm",
  ];

  return (
    <div className="trust-bar">
      <div className="container">
        <div className="trust-inner">
          {items.map((text, i) => (
            <div className="trust-item" key={i}>
              <span className="trust-dot" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
