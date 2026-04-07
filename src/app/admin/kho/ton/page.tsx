"use client";

import { useEffect, useState } from "react";
import { fetchStock, type StockItem } from "@/lib/api/inventory.api";
import { toast } from "sonner";
import { Search, AlertTriangle, Package, FlaskConical } from "lucide-react";

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);

  useEffect(() => {
    fetchStock()
      .then(setItems)
      .catch(() => toast.error("Lỗi tải tồn kho"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && i.type !== filterType) return false;
    if (showLowOnly && !i.is_low) return false;
    return true;
  });

  const lowCount = items.filter((i) => i.is_low).length;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tồn kho</h1>
          <p className="admin-page-subtitle">Tồn kho hóa chất và vật tư hiện tại</p>
        </div>
        {lowCount > 0 && (
          <div className="debt-total-badge" style={{ cursor: "pointer" }} onClick={() => setShowLowOnly(!showLowOnly)}>
            <AlertTriangle size={16} />
            {lowCount} mặt hàng dưới ngưỡng
          </div>
        )}
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            placeholder="Tìm tên, mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="admin-input"
          style={{ width: 160 }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="chemicals">Hóa chất</option>
          <option value="supplies">Vật tư</option>
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><p>Đang tải...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} strokeWidth={1} />
          <p>Không có dữ liệu tồn kho</p>
        </div>
      ) : (
        <div className="stock-grid">
          {filtered.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className={`stock-card ${item.is_low ? "low" : ""}`}
            >
              <div className="stock-card-header">
                <div className="stock-card-icon">
                  {item.type === "chemicals" ? <FlaskConical size={18} /> : <Package size={18} />}
                </div>
                <span className={`admin-badge ${item.type === "chemicals" ? "blue" : "amber"}`}>
                  {item.type === "chemicals" ? "Hóa chất" : "Vật tư"}
                </span>
              </div>
              <div className="stock-card-name">{item.name}</div>
              <div className="stock-card-code">{item.code}</div>
              <div className="stock-card-qty">
                <span className={item.is_low ? "stock-low" : "stock-ok"}>
                  {item.so_luong_ton}
                </span>
                <span className="stock-unit">{item.don_vi || "đơn vị"}</span>
              </div>
              {item.is_low && (
                <div className="stock-warning">
                  <AlertTriangle size={12} /> Dưới ngưỡng ({item.nguong_canh_bao})
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
