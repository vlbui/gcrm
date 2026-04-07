"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchDeals,
  createDeal,
  updateDealStage,
  updateDealField,
  deleteDeal,
  addPayment,
  DEAL_STAGES,
  type Deal,
  type DealStage,
  type PaymentRecord,
  type CreateDealInput,
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
  DollarSign,
  User as UserIcon,
  Bug,
  FileText,
  CreditCard,
  MessageSquare,
  Filter,
  ChevronDown,
} from "lucide-react";

const BUG_OPTIONS = ["Gián", "Chuột", "Mối", "Muỗi", "Kiến", "Ruồi", "Khác"];
const LOAI_HINH_OPTIONS = [
  "Cá nhân / Hộ gia đình",
  "Doanh nghiệp / Khu công nghiệp",
  "Khu chung cư / Văn phòng / Trường học",
  "Trang trại",
];

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

  // New deal form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newFormStage, setNewFormStage] = useState<string>("Khách hỏi");

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setNewFormStage("Khách hỏi"); setShowNewForm(true); }
      if (e.key === "/") { e.preventDefault(); document.querySelector<HTMLInputElement>(".pipeline-search input")?.focus(); }
      if (e.key === "Escape") { setSelectedDeal(null); setShowNewForm(false); }
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
  const handleDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove("pipeline-col-drag-over");
    if (!draggedId) return;
    const deal = deals.find((d) => d.id === draggedId);
    if (!deal || deal.giai_doan === stage) { setDraggedId(null); return; }

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

  // Auto-save field
  const handleFieldSave = async (dealId: string, field: string, value: unknown) => {
    try {
      await updateDealField(dealId, field, value);
      setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, [field]: value } : d));
      if (selectedDeal?.id === dealId) setSelectedDeal((prev) => prev ? { ...prev, [field]: value } : null);
    } catch {
      toast.error("Lỗi lưu");
    }
  };

  const handleNewDeal = async (input: CreateDealInput) => {
    try {
      const deal = await createDeal(input);
      setDeals((prev) => [deal, ...prev]);
      setShowNewForm(false);
      toast.success("Đã thêm deal");
    } catch {
      toast.error("Lỗi thêm deal");
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
          <button className="p-btn p-btn-primary" onClick={() => { setNewFormStage("Khách hỏi"); setShowNewForm(true); }}>
            <Plus size={15} /> Thêm yêu cầu <kbd>N</kbd>
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
                {total > 0 && <div className="pipeline-col-total">{(total / 1000000).toFixed(1)}tr</div>}
                <button className="pipeline-col-add" onClick={() => { setNewFormStage(stage.key); setShowNewForm(true); }} title="Thêm">
                  <Plus size={14} />
                </button>
              </div>

              <div className="pipeline-col-body">
                {colDeals.map((deal) => {
                  const isOverdue = deal.ngay_hen && deal.ngay_hen < today && deal.giai_doan !== "Hoàn thành";
                  const isToday = deal.ngay_hen === today;
                  return (
                    <div
                      key={deal.id}
                      className={`pipeline-card ${draggedId === deal.id ? "dragging" : ""}`}
                      draggable
                      onDragStart={() => setDraggedId(deal.id)}
                      onClick={() => setSelectedDeal(deal)}
                    >
                      <div className="pipeline-card-grip"><GripVertical size={14} /></div>
                      <div className="pipeline-card-name">{deal.ten_kh}</div>
                      <div className="pipeline-card-phone"><Phone size={11} /> {deal.sdt}</div>
                      {deal.loai_con_trung?.length > 0 && (
                        <div className="pipeline-card-tags">
                          {deal.loai_con_trung.map((t) => <span key={t} className="pipeline-card-tag">{t}</span>)}
                        </div>
                      )}
                      <div className="pipeline-card-bottom">
                        {deal.gia_tri > 0 && <span className="pipeline-card-value">{(deal.gia_tri / 1000000).toFixed(1)}tr</span>}
                        {deal.ngay_hen && (
                          <span className={`pipeline-card-date ${isOverdue ? "overdue" : isToday ? "today" : ""}`}>
                            {isOverdue ? "Quá hạn" : isToday ? "Hôm nay" : formatDate(deal.ngay_hen)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {colDeals.length === 0 && <div className="pipeline-col-empty">Kéo thả vào đây</div>}
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
              toast.success("Đã thêm thanh toán");
            } catch { toast.error("Lỗi"); }
          }}
        />
      )}

      {/* New Deal Dialog */}
      {showNewForm && (
        <NewDealDialog
          stage={newFormStage as DealStage}
          users={users}
          technicians={technicians}
          onClose={() => setShowNewForm(false)}
          onSubmit={handleNewDeal}
        />
      )}
    </div>
  );
}

/* =========================================
   NEW DEAL DIALOG — Form đầy đủ
   ========================================= */
function NewDealDialog({
  stage,
  users,
  technicians,
  onClose,
  onSubmit,
}: {
  stage: DealStage;
  users: User[];
  technicians: Technician[];
  onClose: () => void;
  onSubmit: (input: CreateDealInput) => void;
}) {
  const [tenKh, setTenKh] = useState("");
  const [sdt, setSdt] = useState("");
  const [email, setEmail] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [loaiKh, setLoaiKh] = useState("Cá nhân");
  const [tenCongTy, setTenCongTy] = useState("");
  const [loaiHinh, setLoaiHinh] = useState("");
  const [bugs, setBugs] = useState<string[]>([]);
  const [dienTich, setDienTich] = useState("");
  const [giaTri, setGiaTri] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [nguoiPhuTrach, setNguoiPhuTrach] = useState("");
  const [selectedKtv, setSelectedKtv] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleBug = (b: string) => {
    setBugs((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
  };

  const handleSubmit = async () => {
    if (!tenKh.trim()) { toast.error("Nhập tên khách hàng"); return; }
    if (!sdt.trim()) { toast.error("Nhập số điện thoại"); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        ten_kh: tenKh.trim(),
        sdt: sdt.trim(),
        email: email.trim() || undefined,
        dia_chi: diaChi.trim() || undefined,
        loai_kh: loaiKh,
        ten_cong_ty: tenCongTy.trim() || undefined,
        loai_hinh: loaiHinh || undefined,
        loai_con_trung: bugs.length > 0 ? bugs : undefined,
        dich_vu: bugs.length > 0 ? bugs.map((b) => `Dịch vụ ${b}`) : undefined,
        dien_tich: dienTich ? Number(dienTich) : undefined,
        gia_tri: giaTri ? Number(giaTri) : undefined,
        ghi_chu: ghiChu.trim() || undefined,
        nguoi_phu_trach: nguoiPhuTrach || undefined,
        ktv_phu_trach: selectedKtv.length > 0 ? selectedKtv : undefined,
        giai_doan: stage,
      } as CreateDealInput);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-dialog-overlay" onClick={onClose}>
      <div className="admin-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="admin-dialog-header">
          <h2>Thêm yêu cầu mới</h2>
          <button className="admin-dialog-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="admin-dialog-body">
          {/* Loại KH */}
          <div className="new-deal-type-row">
            <button className={`new-deal-type-btn ${loaiKh === "Cá nhân" ? "active" : ""}`} onClick={() => setLoaiKh("Cá nhân")}>
              Cá nhân
            </button>
            <button className={`new-deal-type-btn ${loaiKh === "Tổ chức" ? "active" : ""}`} onClick={() => setLoaiKh("Tổ chức")}>
              Tổ chức
            </button>
          </div>

          {loaiKh === "Tổ chức" && (
            <div className="admin-form-group">
              <label className="admin-label">Tên công ty</label>
              <input className="p-input" value={tenCongTy} onChange={(e) => setTenCongTy(e.target.value)} placeholder="Công ty TNHH..." />
            </div>
          )}

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Họ tên {loaiKh === "Tổ chức" ? "người liên hệ" : ""} *</label>
              <input className="p-input" value={tenKh} onChange={(e) => setTenKh(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Số điện thoại *</label>
              <input className="p-input" value={sdt} onChange={(e) => setSdt(e.target.value)} placeholder="085 9955 969" />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Email</label>
              <input className="p-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Địa chỉ</label>
              <input className="p-input" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} placeholder="Số nhà, đường, quận..." />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Loại hình</label>
            <select className="p-select" value={loaiHinh} onChange={(e) => setLoaiHinh(e.target.value)}>
              <option value="">— Chọn —</option>
              {LOAI_HINH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Bug chips */}
          <div className="admin-form-group">
            <label className="admin-label">Loại côn trùng</label>
            <div className="new-deal-bug-chips">
              {BUG_OPTIONS.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`new-deal-bug-chip ${bugs.includes(b) ? "active" : ""}`}
                  onClick={() => toggleBug(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Diện tích (m²)</label>
              <input className="p-input" type="number" value={dienTich} onChange={(e) => setDienTich(e.target.value)} placeholder="80" />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Giá trị dự kiến (VNĐ)</label>
              <input className="p-input" type="number" value={giaTri} onChange={(e) => setGiaTri(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Người phụ trách</label>
            <select className="p-select" value={nguoiPhuTrach} onChange={(e) => setNguoiPhuTrach(e.target.value)}>
              <option value="">— Tự động —</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.ho_ten}</option>)}
            </select>
          </div>

          {/* KTV Selection — Dropdown multi-select */}
          <div className="admin-form-group">
            <label className="admin-label">Kỹ thuật viên phụ trách</label>
            {technicians.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--neutral-500)" }}>Chưa có KTV. Thêm tại mục Kỹ thuật viên.</p>
            ) : (
              <>
                <select
                  className="p-select"
                  value=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (id && !selectedKtv.includes(id)) setSelectedKtv((prev) => [...prev, id]);
                  }}
                >
                  <option value="">— Chọn KTV —</option>
                  {technicians.filter((t) => !selectedKtv.includes(t.id)).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ho_ten} — {t.sdt}{t.chuyen_mon?.length ? ` (${t.chuyen_mon.join(", ")})` : ""}
                    </option>
                  ))}
                </select>
                {selectedKtv.length > 0 && (
                  <div className="multi-select-tags">
                    {selectedKtv.map((id) => {
                      const t = technicians.find((x) => x.id === id);
                      if (!t) return null;
                      return (
                        <div key={id} className="multi-select-tag">
                          <span className="multi-select-tag-avatar">{t.ho_ten.charAt(0)}</span>
                          <span>{t.ho_ten}</span>
                          <button type="button" className="multi-select-tag-remove" onClick={() => setSelectedKtv((prev) => prev.filter((x) => x !== id))}>
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Ghi chú / Mô tả</label>
            <textarea className="p-textarea" rows={3} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} placeholder="Mô tả tình trạng, thời gian mong muốn..." />
          </div>
        </div>
        <div className="admin-dialog-footer">
          <button className="p-btn p-btn-ghost" onClick={onClose}>Hủy</button>
          <button className="p-btn p-btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Đang lưu..." : `Thêm vào "${stage}"`}
          </button>
        </div>
      </div>
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
        <div className="side-panel-header">
          <div>
            <div className="side-panel-deal-code">{deal.ma_deal}</div>
            <div className="side-panel-deal-stage" style={{ background: stageInfo?.color }}>{deal.giai_doan}</div>
          </div>
          <div className="side-panel-actions">
            <a href={`tel:${deal.sdt}`} className="sp-action-btn" title="Gọi"><Phone size={16} /></a>
            <button className="sp-action-btn sp-delete" onClick={() => onDelete(deal.id)} title="Xóa"><Trash2 size={16} /></button>
            <button className="sp-action-btn" onClick={onClose} title="Đóng (Esc)"><X size={18} /></button>
          </div>
        </div>

        <div className="side-panel-tabs">
          {tabs.map((t) => (
            <button key={t.key} className={`sp-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

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
                <select className="p-select" value={deal.loai_kh || "Cá nhân"} onChange={(e) => onFieldSave(deal.id, "loai_kh", e.target.value)}>
                  <option>Cá nhân</option>
                  <option>Tổ chức</option>
                </select>
              </div>

              <div className="sp-divider" />

              <InlineField label="Côn trùng" value={(deal.loai_con_trung || []).join(", ")}
                onSave={(v) => onFieldSave(deal.id, "loai_con_trung", v.split(",").map((s) => s.trim()).filter(Boolean))} />
              <InlineField label="Diện tích" value={String(deal.dien_tich || "")} type="number"
                onSave={(v) => onFieldSave(deal.id, "dien_tich", v ? Number(v) : null)} />
              <InlineField label="Giá trị" value={String(deal.gia_tri || "")} type="number"
                onSave={(v) => onFieldSave(deal.id, "gia_tri", Number(v) || 0)} />

              <div className="sp-divider" />

              <div className="sp-field">
                <label>Ngày hẹn</label>
                <input type="date" className="p-input" defaultValue={deal.ngay_hen || ""} onChange={(e) => onFieldSave(deal.id, "ngay_hen", e.target.value || null)} />
              </div>
              <div className="sp-field">
                <label>Ngày TH</label>
                <input type="date" className="p-input" defaultValue={deal.ngay_thuc_hien || ""} onChange={(e) => onFieldSave(deal.id, "ngay_thuc_hien", e.target.value || null)} />
              </div>
              <div className="sp-field">
                <label>Phụ trách</label>
                <select className="p-select" value={deal.nguoi_phu_trach || ""} onChange={(e) => onFieldSave(deal.id, "nguoi_phu_trach", e.target.value || null)}>
                  <option value="">— Chọn —</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.ho_ten}</option>)}
                </select>
              </div>
            </div>
          )}

          {tab === "ktv" && (
            <div className="sp-ktv">
              {technicians.length === 0 ? (
                <p className="sp-hint">Chưa có KTV. Thêm tại mục Kỹ thuật viên.</p>
              ) : (
                <>
                  <select
                    className="p-select"
                    value=""
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) return;
                      const current = deal.ktv_phu_trach || [];
                      if (!current.includes(id)) {
                        onFieldSave(deal.id, "ktv_phu_trach", [...current, id]);
                      }
                    }}
                  >
                    <option value="">— Thêm KTV —</option>
                    {technicians.filter((t) => !(deal.ktv_phu_trach || []).includes(t.id)).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.ho_ten} — {t.sdt}{t.chuyen_mon?.length ? ` (${t.chuyen_mon.join(", ")})` : ""}
                      </option>
                    ))}
                  </select>
                  {(deal.ktv_phu_trach || []).length > 0 && (
                    <div className="multi-select-tags" style={{ marginTop: 10 }}>
                      {(deal.ktv_phu_trach || []).map((id) => {
                        const t = technicians.find((x) => x.id === id);
                        if (!t) return null;
                        return (
                          <div key={id} className="multi-select-tag">
                            <span className="multi-select-tag-avatar">{t.ho_ten.charAt(0)}</span>
                            <div>
                              <div>{t.ho_ten}</div>
                              <div style={{ fontSize: 11, color: "var(--neutral-500)" }}>{t.sdt}</div>
                            </div>
                            <button
                              type="button"
                              className="multi-select-tag-remove"
                              onClick={() => {
                                const next = (deal.ktv_phu_trach || []).filter((x) => x !== id);
                                onFieldSave(deal.id, "ktv_phu_trach", next);
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {(deal.ktv_phu_trach || []).length === 0 && (
                    <p className="sp-hint" style={{ marginTop: 8 }}>Chưa phân công KTV nào</p>
                  )}
                </>
              )}
            </div>
          )}

          {tab === "payment" && (
            <div className="sp-payment">
              <div className="sp-payment-summary">
                <div className="sp-payment-row"><span>Giá trị</span><strong>{(deal.gia_tri || 0).toLocaleString("vi-VN")}đ</strong></div>
                <div className="sp-payment-row"><span>Đã TT</span><strong style={{ color: "var(--primary-700)" }}>{totalPaid.toLocaleString("vi-VN")}đ</strong></div>
                <div className="sp-payment-row"><span>Còn lại</span><strong style={{ color: "var(--danger-500)" }}>{((deal.gia_tri || 0) - totalPaid).toLocaleString("vi-VN")}đ</strong></div>
              </div>
              <div className="sp-payment-add">
                <input className="p-input" type="number" placeholder="Số tiền" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                <select className="p-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option>Chuyển khoản</option>
                  <option>Tiền mặt</option>
                  <option>Thẻ</option>
                </select>
                <button className="p-btn p-btn-primary" disabled={!payAmount} onClick={() => {
                  onPayment(deal.id, { so_tien: Number(payAmount), ngay_tt: new Date().toISOString().split("T")[0], hinh_thuc: payMethod });
                  setPayAmount("");
                }}>
                  <Plus size={14} />
                </button>
              </div>
              {(deal.thanh_toan || []).length > 0 && (
                <div className="sp-payment-list">
                  {(deal.thanh_toan || []).map((p, i) => (
                    <div key={p.id || i} className="sp-payment-item">
                      <div><strong>{p.so_tien.toLocaleString("vi-VN")}đ</strong> <span className="sp-payment-method">{p.hinh_thuc}</span></div>
                      <span className="sp-payment-date">{formatDate(p.ngay_tt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "notes" && (
            <div className="sp-notes">
              <textarea className="p-textarea" rows={8} defaultValue={deal.ghi_chu || ""} placeholder="Ghi chú..."
                onBlur={(e) => {
                  if (e.target.value !== (deal.ghi_chu || "")) {
                    onFieldSave(deal.id, "ghi_chu", e.target.value || null);
                    toast.success("Đã lưu");
                  }
                }}
              />
              <div className="sp-meta">Tạo: {formatDate(deal.created_at)} · Cập nhật: {formatDate(deal.updated_at)}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================
   INLINE FIELD
   ========================================= */
function InlineField({ label, value, type = "text", onSave }: {
  label: string; value: string; type?: string; onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(value); }, [value]);

  const save = () => { setEditing(false); if (val !== value) onSave(val); };

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
      <input ref={inputRef} className="p-input" type={type} value={val} onChange={(e) => setVal(e.target.value)}
        onBlur={save} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setVal(value); setEditing(false); } }} />
    </div>
  );
}
