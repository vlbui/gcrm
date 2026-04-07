"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchDeals,
  createDeal,
  updateDealStage,
  updateDealField,
  updateDeal,
  deleteDeal,
  addPayment,
  DEAL_STAGES,
  type Deal,
  type DealStage,
  type PaymentRecord,
} from "@/lib/api/deals.api";
import { fetchActiveTechnicians, type Technician } from "@/lib/api/technicians.api";
import { fetchUsers, type User } from "@/lib/api/users.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import {
  Phone,
  Search,
  X,
  GripVertical,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  User as UserIcon,
  Bug,
  MapPin,
  Mail,
  Building2,
  FileText,
  Camera,
  CreditCard,
  MessageSquare,
  ChevronDown,
  Filter,
  ExternalLink,
} from "lucide-react";

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Quick add
  const [quickAddCol, setQuickAddCol] = useState<string | null>(null);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const quickNameRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    try {
      const [d, t, u] = await Promise.all([
        fetchDeals(),
        fetchActiveTechnicians(),
        fetchUsers(),
      ]);
      setDeals(d);
      setTechnicians(t);
      setUsers(u);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setQuickAddCol("Khách hỏi");
        setTimeout(() => quickNameRef.current?.focus(), 100);
      }
      if (e.key === "/" ) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>(".pipeline-search input")?.focus();
      }
      if (e.key === "Escape") {
        setSelectedDeal(null);
        setQuickAddCol(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = deals.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      if (!d.ten_kh.toLowerCase().includes(q) && !d.sdt.includes(q) && !d.ma_deal.toLowerCase().includes(q)) return false;
    }
    if (filterUser && d.nguoi_phu_trach !== filterUser) return false;
    return true;
  });

  const getColDeals = (stage: string) => filtered.filter((d) => d.giai_doan === stage);
  const getColTotal = (stage: string) => getColDeals(stage).reduce((s, d) => s + (d.gia_tri || 0), 0);

  // Drag & Drop
  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove("pipeline-col-drag-over");
    if (!draggedId) return;
    const deal = deals.find((d) => d.id === draggedId);
    if (!deal || deal.giai_doan === stage) { setDraggedId(null); return; }

    // Optimistic update
    setDeals((prev) => prev.map((d) => d.id === draggedId ? { ...d, giai_doan: stage as DealStage } : d));
    setDraggedId(null);

    try {
      await updateDealStage(deal.id, stage as DealStage);
      toast.success(`→ ${stage}`);
    } catch {
      setDeals((prev) => prev.map((d) => d.id === deal.id ? { ...d, giai_doan: deal.giai_doan } : d));
      toast.error("Lỗi cập nhật");
    }
  };

  // Quick Add
  const handleQuickAdd = async (stage: string) => {
    if (!quickName.trim() || !quickPhone.trim()) {
      toast.error("Nhập tên và SĐT");
      return;
    }
    try {
      const deal = await createDeal({
        ten_kh: quickName.trim(),
        sdt: quickPhone.trim(),
        giai_doan: stage as DealStage,
      });
      setDeals((prev) => [deal, ...prev]);
      setQuickAddCol(null);
      setQuickName("");
      setQuickPhone("");
      toast.success("Đã thêm");
    } catch {
      toast.error("Lỗi thêm deal");
    }
  };

  // Auto-save field
  const handleFieldSave = async (dealId: string, field: string, value: unknown) => {
    try {
      await updateDealField(dealId, field, value);
      setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, [field]: value } : d));
      if (selectedDeal?.id === dealId) {
        setSelectedDeal((prev) => prev ? { ...prev, [field]: value } : null);
      }
    } catch {
      toast.error("Lỗi lưu");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  if (loading) return <div className="empty-state"><p>Đang tải...</p></div>;

  return (
    <div className="pipeline-page">
      {/* Header */}
      <div className="pipeline-header">
        <div className="pipeline-search">
          <Search size={16} />
          <input placeholder="Tìm deal... (nhấn /)" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="pipeline-header-actions">
          <button className="p-btn p-btn-ghost" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={15} /> Lọc
          </button>
          <button className="p-btn p-btn-primary" onClick={() => { setQuickAddCol("Khách hỏi"); setTimeout(() => quickNameRef.current?.focus(), 100); }}>
            <Plus size={15} /> Deal mới <kbd>N</kbd>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="pipeline-filters">
          <select className="p-select" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
            <option value="">Tất cả NV</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.ho_ten}</option>)}
          </select>
          {filterUser && <button className="p-btn p-btn-ghost" onClick={() => setFilterUser("")}>Xóa lọc</button>}
        </div>
      )}

      {/* Board */}
      <div className="pipeline-board">
        {DEAL_STAGES.map((stage) => {
          const colDeals = getColDeals(stage.key);
          const total = getColTotal(stage.key);
          return (
            <div
              key={stage.key}
              className="pipeline-column"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("pipeline-col-drag-over"); }}
              onDragLeave={(e) => e.currentTarget.classList.remove("pipeline-col-drag-over")}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className="pipeline-col-header">
                <div className="pipeline-col-title">
                  <span className="pipeline-col-dot" style={{ background: stage.color }} />
                  <span>{stage.label}</span>
                  <span className="pipeline-col-count">{colDeals.length}</span>
                </div>
                {total > 0 && (
                  <div className="pipeline-col-total">{(total / 1000000).toFixed(1)}tr</div>
                )}
                <button
                  className="pipeline-col-add"
                  onClick={() => { setQuickAddCol(stage.key); setTimeout(() => quickNameRef.current?.focus(), 100); }}
                  title="Thêm nhanh"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="pipeline-col-body">
                {/* Quick Add Inline */}
                {quickAddCol === stage.key && (
                  <div className="pipeline-quick-add">
                    <input
                      ref={quickNameRef}
                      className="p-input"
                      placeholder="Tên KH"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && document.querySelector<HTMLInputElement>(".qa-phone")?.focus()}
                    />
                    <input
                      className="p-input qa-phone"
                      placeholder="SĐT"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleQuickAdd(stage.key)}
                    />
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="p-btn p-btn-primary" style={{ flex: 1, padding: "6px" }} onClick={() => handleQuickAdd(stage.key)}>Thêm</button>
                      <button className="p-btn p-btn-ghost" style={{ padding: "6px" }} onClick={() => setQuickAddCol(null)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {colDeals.map((deal) => {
                  const isOverdue = deal.ngay_hen && deal.ngay_hen < today && deal.giai_doan !== "Hoàn thành";
                  const isToday = deal.ngay_hen === today;
                  return (
                    <div
                      key={deal.id}
                      className={`pipeline-card ${draggedId === deal.id ? "dragging" : ""}`}
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      onClick={() => setSelectedDeal(deal)}
                    >
                      <div className="pipeline-card-grip"><GripVertical size={14} /></div>
                      <div className="pipeline-card-name">{deal.ten_kh}</div>
                      <div className="pipeline-card-phone">
                        <Phone size={11} /> {deal.sdt}
                      </div>
                      {deal.loai_con_trung?.length > 0 && (
                        <div className="pipeline-card-tags">
                          {deal.loai_con_trung.map((t) => (
                            <span key={t} className="pipeline-card-tag">{t}</span>
                          ))}
                        </div>
                      )}
                      <div className="pipeline-card-bottom">
                        {deal.gia_tri > 0 && (
                          <span className="pipeline-card-value">{(deal.gia_tri / 1000000).toFixed(1)}tr</span>
                        )}
                        {deal.ngay_hen && (
                          <span className={`pipeline-card-date ${isOverdue ? "overdue" : isToday ? "today" : ""}`}>
                            {isOverdue ? "Quá hạn" : isToday ? "Hôm nay" : formatDate(deal.ngay_hen)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {colDeals.length === 0 && !quickAddCol && (
                  <div className="pipeline-col-empty">Kéo thả vào đây</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Side Panel */}
      {selectedDeal && (
        <SidePanel
          deal={selectedDeal}
          users={users}
          technicians={technicians}
          onClose={() => setSelectedDeal(null)}
          onFieldSave={handleFieldSave}
          onDelete={async (id) => {
            if (!confirm("Xóa deal này?")) return;
            try {
              await deleteDeal(id);
              setDeals((prev) => prev.filter((d) => d.id !== id));
              setSelectedDeal(null);
              toast.success("Đã xóa");
            } catch { toast.error("Lỗi xóa"); }
          }}
          onPayment={async (dealId, payment) => {
            try {
              await addPayment(dealId, payment);
              await loadData();
              const updated = deals.find((d) => d.id === dealId);
              if (updated) setSelectedDeal(updated);
              toast.success("Đã thêm thanh toán");
            } catch { toast.error("Lỗi"); }
          }}
        />
      )}
    </div>
  );
}

/* =========================================
   SIDE PANEL
   ========================================= */
function SidePanel({
  deal,
  users,
  technicians,
  onClose,
  onFieldSave,
  onDelete,
  onPayment,
}: {
  deal: Deal;
  users: User[];
  technicians: Technician[];
  onClose: () => void;
  onFieldSave: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
  onPayment: (dealId: string, payment: Omit<PaymentRecord, "id">) => void;
}) {
  const [tab, setTab] = useState("info");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Chuyển khoản");

  const stageInfo = DEAL_STAGES.find((s) => s.key === deal.giai_doan);
  const totalPaid = (deal.thanh_toan || []).reduce((s, p) => s + p.so_tien, 0);

  const tabs = [
    { key: "info", label: "Thông tin", icon: FileText },
    { key: "ktv", label: "KTV", icon: UserIcon },
    { key: "payment", label: "Thanh toán", icon: CreditCard },
    { key: "notes", label: "Ghi chú", icon: MessageSquare },
  ];

  return (
    <>
      <div className="side-panel-overlay" onClick={onClose} />
      <div className="side-panel">
        {/* Header */}
        <div className="side-panel-header">
          <div>
            <div className="side-panel-deal-code">{deal.ma_deal}</div>
            <div className="side-panel-deal-stage" style={{ background: stageInfo?.color }}>{deal.giai_doan}</div>
          </div>
          <div className="side-panel-actions">
            <a href={`tel:${deal.sdt}`} className="sp-action-btn" title="Gọi"><Phone size={16} /></a>
            {deal.email && <a href={`mailto:${deal.email}`} className="sp-action-btn" title="Email"><Mail size={16} /></a>}
            <button className="sp-action-btn sp-delete" onClick={() => onDelete(deal.id)} title="Xóa"><Trash2 size={16} /></button>
            <button className="sp-action-btn" onClick={onClose} title="Đóng (Esc)"><X size={18} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="side-panel-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`sp-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="side-panel-body">
          {tab === "info" && (
            <div className="sp-fields">
              <InlineField label="Tên KH" value={deal.ten_kh} onSave={(v) => onFieldSave(deal.id, "ten_kh", v)} />
              <InlineField label="SĐT" value={deal.sdt} onSave={(v) => onFieldSave(deal.id, "sdt", v)} />
              <InlineField label="Email" value={deal.email || ""} onSave={(v) => onFieldSave(deal.id, "email", v || null)} />
              <InlineField label="Địa chỉ" value={deal.dia_chi || ""} onSave={(v) => onFieldSave(deal.id, "dia_chi", v || null)} />
              <InlineField label="Công ty" value={deal.ten_cong_ty || ""} onSave={(v) => onFieldSave(deal.id, "ten_cong_ty", v || null)} />

              <div className="sp-field">
                <label>Loại KH</label>
                <select
                  className="p-select"
                  value={deal.loai_kh || "Cá nhân"}
                  onChange={(e) => onFieldSave(deal.id, "loai_kh", e.target.value)}
                >
                  <option>Cá nhân</option>
                  <option>Tổ chức</option>
                </select>
              </div>

              <div className="sp-divider" />

              <InlineField label="Dịch vụ" value={(deal.dich_vu || []).join(", ")}
                onSave={(v) => onFieldSave(deal.id, "dich_vu", v.split(",").map((s) => s.trim()).filter(Boolean))} />
              <InlineField label="Côn trùng" value={(deal.loai_con_trung || []).join(", ")}
                onSave={(v) => onFieldSave(deal.id, "loai_con_trung", v.split(",").map((s) => s.trim()).filter(Boolean))} />
              <InlineField label="Diện tích (m²)" value={String(deal.dien_tich || "")} type="number"
                onSave={(v) => onFieldSave(deal.id, "dien_tich", v ? Number(v) : null)} />
              <InlineField label="Giá trị (VNĐ)" value={String(deal.gia_tri || "")} type="number"
                onSave={(v) => onFieldSave(deal.id, "gia_tri", Number(v) || 0)} />

              <div className="sp-divider" />

              <div className="sp-field">
                <label>Ngày hẹn</label>
                <input
                  type="date"
                  className="p-input"
                  defaultValue={deal.ngay_hen || ""}
                  onChange={(e) => onFieldSave(deal.id, "ngay_hen", e.target.value || null)}
                />
              </div>
              <div className="sp-field">
                <label>Ngày thực hiện</label>
                <input
                  type="date"
                  className="p-input"
                  defaultValue={deal.ngay_thuc_hien || ""}
                  onChange={(e) => onFieldSave(deal.id, "ngay_thuc_hien", e.target.value || null)}
                />
              </div>
              <div className="sp-field">
                <label>Người phụ trách</label>
                <select
                  className="p-select"
                  value={deal.nguoi_phu_trach || ""}
                  onChange={(e) => onFieldSave(deal.id, "nguoi_phu_trach", e.target.value || null)}
                >
                  <option value="">— Chọn —</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.ho_ten}</option>)}
                </select>
              </div>
            </div>
          )}

          {tab === "ktv" && (
            <div className="sp-ktv">
              <p className="sp-hint">Chọn KTV phụ trách deal này:</p>
              <div className="sp-ktv-grid">
                {technicians.map((t) => {
                  const isAssigned = (deal.ktv_phu_trach || []).includes(t.id);
                  return (
                    <div
                      key={t.id}
                      className={`sp-ktv-card ${isAssigned ? "assigned" : ""}`}
                      onClick={() => {
                        const current = deal.ktv_phu_trach || [];
                        const next = isAssigned ? current.filter((id) => id !== t.id) : [...current, t.id];
                        onFieldSave(deal.id, "ktv_phu_trach", next);
                      }}
                    >
                      <div className="sp-ktv-avatar">{t.ho_ten.charAt(0)}</div>
                      <div>
                        <div className="sp-ktv-name">{t.ho_ten}</div>
                        <div className="sp-ktv-phone">{t.sdt}</div>
                        {t.chuyen_mon?.length > 0 && (
                          <div className="sp-ktv-tags">{t.chuyen_mon.join(", ")}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {technicians.length === 0 && (
                <p className="sp-hint">Chưa có KTV. Thêm tại mục Kỹ thuật viên.</p>
              )}
            </div>
          )}

          {tab === "payment" && (
            <div className="sp-payment">
              <div className="sp-payment-summary">
                <div className="sp-payment-row">
                  <span>Giá trị deal</span>
                  <strong>{(deal.gia_tri || 0).toLocaleString("vi-VN")}đ</strong>
                </div>
                <div className="sp-payment-row">
                  <span>Đã thanh toán</span>
                  <strong style={{ color: "var(--primary-700)" }}>{totalPaid.toLocaleString("vi-VN")}đ</strong>
                </div>
                <div className="sp-payment-row">
                  <span>Còn lại</span>
                  <strong style={{ color: "var(--danger-500)" }}>
                    {((deal.gia_tri || 0) - totalPaid).toLocaleString("vi-VN")}đ
                  </strong>
                </div>
              </div>

              {/* Quick add payment */}
              <div className="sp-payment-add">
                <input
                  className="p-input"
                  type="number"
                  placeholder="Số tiền"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
                <select className="p-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option>Chuyển khoản</option>
                  <option>Tiền mặt</option>
                  <option>Thẻ</option>
                </select>
                <button
                  className="p-btn p-btn-primary"
                  disabled={!payAmount}
                  onClick={() => {
                    onPayment(deal.id, {
                      so_tien: Number(payAmount),
                      ngay_tt: new Date().toISOString().split("T")[0],
                      hinh_thuc: payMethod,
                    });
                    setPayAmount("");
                  }}
                >
                  <Plus size={14} /> Thêm
                </button>
              </div>

              {/* History */}
              {(deal.thanh_toan || []).length > 0 && (
                <div className="sp-payment-list">
                  {(deal.thanh_toan || []).map((p, i) => (
                    <div key={p.id || i} className="sp-payment-item">
                      <div>
                        <strong>{p.so_tien.toLocaleString("vi-VN")}đ</strong>
                        <span className="sp-payment-method">{p.hinh_thuc}</span>
                      </div>
                      <span className="sp-payment-date">{formatDate(p.ngay_tt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="sp-notes">
              <textarea
                className="p-textarea"
                rows={6}
                defaultValue={deal.ghi_chu || ""}
                placeholder="Ghi chú về deal..."
                onBlur={(e) => {
                  if (e.target.value !== (deal.ghi_chu || "")) {
                    onFieldSave(deal.id, "ghi_chu", e.target.value || null);
                    toast.success("Đã lưu ghi chú");
                  }
                }}
              />
              <div className="sp-meta">
                Tạo: {formatDate(deal.created_at)} · Cập nhật: {formatDate(deal.updated_at)}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================
   INLINE FIELD COMPONENT
   ========================================= */
function InlineField({
  label,
  value,
  type = "text",
  onSave,
}: {
  label: string;
  value: string;
  type?: string;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(value); }, [value]);

  const save = () => {
    setEditing(false);
    if (val !== value) onSave(val);
  };

  if (!editing) {
    return (
      <div className="sp-field" onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
        <label>{label}</label>
        <span className="sp-field-value">{value || "—"}</span>
      </div>
    );
  }

  return (
    <div className="sp-field editing">
      <label>{label}</label>
      <input
        ref={inputRef}
        className="p-input"
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setVal(value); setEditing(false); } }}
      />
    </div>
  );
}
