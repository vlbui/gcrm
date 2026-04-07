"use client";

import { useEffect, useState } from "react";
import {
  fetchStock,
  createTransaction,
  fetchTransactions,
  type StockItem,
  type InventoryTransaction,
} from "@/lib/api/inventory.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import {
  Search,
  AlertTriangle,
  Package,
  FlaskConical,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardCheck,
  X,
  History,
} from "lucide-react";

type TransactionType = "Nhập" | "Xuất" | "Kiểm kê";

export default function KhoPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | "chemicals" | "supplies">("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Transaction form
  const [showTxForm, setShowTxForm] = useState(false);
  const [txType, setTxType] = useState<TransactionType>("Nhập");
  const [txItemId, setTxItemId] = useState("");
  const [txItemType, setTxItemType] = useState<"chemicals" | "supplies">("chemicals");
  const [txQty, setTxQty] = useState("");
  const [txSupplier, setTxSupplier] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txNote, setTxNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [s, t] = await Promise.all([fetchStock(), fetchTransactions()]);
      setItems(s);
      setTransactions(t);
    } catch {
      toast.error("Lỗi tải kho");
    } finally {
      setLoading(false);
    }
  }

  const filtered = items.filter((i) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && i.type !== filterType) return false;
    if (showLowOnly && !i.is_low) return false;
    return true;
  });

  const lowCount = items.filter((i) => i.is_low).length;

  const openTxForm = (type: TransactionType, item?: StockItem) => {
    setTxType(type);
    if (item) {
      setTxItemId(item.id);
      setTxItemType(item.type);
    } else {
      setTxItemId("");
      setTxItemType("chemicals");
    }
    setTxQty("");
    setTxSupplier("");
    setTxPrice("");
    setTxNote("");
    setShowTxForm(true);
  };

  const handleTransaction = async () => {
    if (!txItemId || !txQty || Number(txQty) <= 0) {
      toast.error("Chọn mặt hàng và nhập số lượng");
      return;
    }
    if (txType === "Xuất") {
      const item = items.find((i) => i.id === txItemId);
      if (item && Number(txQty) > item.so_luong_ton) {
        toast.error(`Tồn kho chỉ còn ${item.so_luong_ton}`);
        return;
      }
    }
    setSaving(true);
    try {
      await createTransaction({
        loai: txItemType,
        item_id: txItemId,
        loai_giao_dich: txType,
        so_luong: Number(txQty),
        nha_cung_cap: txSupplier || undefined,
        gia_nhap: Number(txPrice) || undefined,
        ghi_chu: txNote || undefined,
      });
      toast.success(`${txType} kho thành công`);
      setShowTxForm(false);
      await loadData();
    } catch {
      toast.error("Lỗi");
    } finally {
      setSaving(false);
    }
  };

  const filteredForSelect = items.filter((i) => i.type === txItemType);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Kho</h1>
          <p className="admin-page-subtitle">Quản lý hóa chất & vật tư</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="p-btn p-btn-ghost" onClick={() => setShowHistory(!showHistory)}>
            <History size={15} /> Lịch sử
          </button>
          <button className="p-btn p-btn-primary" style={{ background: "#10B981" }} onClick={() => openTxForm("Nhập")}>
            <ArrowDownCircle size={15} /> Nhập
          </button>
          <button className="p-btn p-btn-primary" style={{ background: "#EF4444" }} onClick={() => openTxForm("Xuất")}>
            <ArrowUpCircle size={15} /> Xuất
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input placeholder="Tìm hóa chất, vật tư..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`p-btn ${!filterType ? "p-btn-primary" : "p-btn-ghost"}`} onClick={() => setFilterType("")}>Tất cả</button>
          <button className={`p-btn ${filterType === "chemicals" ? "p-btn-primary" : "p-btn-ghost"}`} onClick={() => setFilterType("chemicals")}>
            <FlaskConical size={14} /> Hóa chất
          </button>
          <button className={`p-btn ${filterType === "supplies" ? "p-btn-primary" : "p-btn-ghost"}`} onClick={() => setFilterType("supplies")}>
            <Package size={14} /> Vật tư
          </button>
          {lowCount > 0 && (
            <button className={`p-btn ${showLowOnly ? "p-btn-primary" : "p-btn-ghost"}`} style={{ color: showLowOnly ? "#fff" : "#E65100", background: showLowOnly ? "#E65100" : "transparent" }} onClick={() => setShowLowOnly(!showLowOnly)}>
              <AlertTriangle size={14} /> {lowCount} cảnh báo
            </button>
          )}
        </div>
      </div>

      {/* Stock Grid */}
      {loading ? <div className="empty-state"><p>Đang tải...</p></div> : (
        <div className="stock-grid">
          {filtered.map((item) => (
            <div key={`${item.type}-${item.id}`} className={`stock-card ${item.is_low ? "low" : ""} ${item.so_luong_ton === 0 ? "empty" : ""}`}>
              <div className="stock-card-header">
                <div className="stock-card-icon">
                  {item.type === "chemicals" ? <FlaskConical size={16} /> : <Package size={16} />}
                </div>
                <span className={`admin-badge ${item.type === "chemicals" ? "blue" : "amber"}`}>
                  {item.type === "chemicals" ? "HC" : "VT"}
                </span>
              </div>
              <div className="stock-card-name">{item.name}</div>
              <div className="stock-card-code">{item.code}</div>
              {item.cong_dung && (
                <div className="stock-card-usage">{item.cong_dung}</div>
              )}
              <div className="stock-card-qty">
                <span className={item.is_low ? "stock-low" : "stock-ok"}>{item.so_luong_ton}</span>
                <span className="stock-unit">{item.don_vi || ""}</span>
              </div>
              {item.is_low && item.so_luong_ton > 0 && (
                <div className="stock-warning"><AlertTriangle size={12} /> Dưới ngưỡng</div>
              )}
              {item.so_luong_ton === 0 && (
                <div className="stock-warning" style={{ color: "#EF4444" }}><AlertTriangle size={12} /> Hết hàng</div>
              )}
              <div className="stock-card-actions">
                <button className="stock-action-btn" onClick={(e) => { e.stopPropagation(); openTxForm("Nhập", item); }} title="Nhập">
                  <ArrowDownCircle size={14} />
                </button>
                <button className="stock-action-btn" onClick={(e) => { e.stopPropagation(); openTxForm("Xuất", item); }} title="Xuất">
                  <ArrowUpCircle size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transaction History Panel */}
      {showHistory && (
        <div className="kho-history">
          <div className="kho-history-header">
            <h3>Lịch sử giao dịch</h3>
            <button className="p-btn p-btn-ghost" onClick={() => setShowHistory(false)}><X size={16} /></button>
          </div>
          <div className="kho-history-list">
            {transactions.slice(0, 20).map((t) => (
              <div key={t.id} className="kho-history-item">
                <span className={`admin-badge ${t.loai_giao_dich === "Nhập" ? "green" : t.loai_giao_dich === "Xuất" ? "red" : "blue"}`}>
                  {t.loai_giao_dich}
                </span>
                <span className="kho-history-name">{t.item_name}</span>
                <span className="kho-history-qty">x{t.so_luong}</span>
                <span className="kho-history-date">{formatDate(t.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Form Dialog */}
      {showTxForm && (
        <div className="admin-dialog-overlay" onClick={() => setShowTxForm(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="admin-dialog-header">
              <h2>{txType} kho</h2>
              <button className="admin-dialog-close" onClick={() => setShowTxForm(false)}><X size={20} /></button>
            </div>
            <div className="admin-dialog-body">
              <div className="admin-form-group">
                <label className="admin-label">Loại</label>
                <select className="p-select" value={txItemType} onChange={(e) => { setTxItemType(e.target.value as "chemicals" | "supplies"); setTxItemId(""); }}>
                  <option value="chemicals">Hóa chất</option>
                  <option value="supplies">Vật tư</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">{txItemType === "chemicals" ? "Tên hóa chất" : "Tên vật tư"} *</label>
                <select className="p-select" value={txItemId} onChange={(e) => setTxItemId(e.target.value)}>
                  <option value="">— Chọn —</option>
                  {filteredForSelect.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} ({i.code}) — Tồn: {i.so_luong_ton} {i.don_vi || ""}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Số lượng *</label>
                  <input className="p-input" type="number" min={1} value={txQty} onChange={(e) => setTxQty(e.target.value)} />
                </div>
                {txType === "Nhập" && (
                  <div className="admin-form-group">
                    <label className="admin-label">Giá nhập</label>
                    <input className="p-input" type="number" min={0} value={txPrice} onChange={(e) => setTxPrice(e.target.value)} />
                  </div>
                )}
              </div>
              {txType === "Nhập" && (
                <div className="admin-form-group">
                  <label className="admin-label">Nhà cung cấp</label>
                  <input className="p-input" value={txSupplier} onChange={(e) => setTxSupplier(e.target.value)} />
                </div>
              )}
              <div className="admin-form-group">
                <label className="admin-label">Ghi chú</label>
                <input className="p-input" value={txNote} onChange={(e) => setTxNote(e.target.value)} />
              </div>
            </div>
            <div className="admin-dialog-footer">
              <button className="p-btn p-btn-ghost" onClick={() => setShowTxForm(false)}>Hủy</button>
              <button className="p-btn p-btn-primary" onClick={handleTransaction} disabled={saving}>
                {saving ? "Đang lưu..." : `${txType} kho`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
