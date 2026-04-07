"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search, Plus, X, Eye, ArrowRightLeft, Phone, Mail, MapPin, Bug, Ruler,
} from "lucide-react";
import {
  fetchServiceRequests,
  updateServiceRequest,
  createServiceRequest,
  type ServiceRequest,
} from "@/lib/api/serviceRequests.api";
import { createCustomer, fetchCustomers, type Customer } from "@/lib/api/customers.api";
import { createContract } from "@/lib/api/contracts.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { sanitizePhone, sanitizeEmail } from "@/lib/utils/sanitize";
import { formatDate } from "@/lib/utils/date";
import Pagination from "@/components/admin/Pagination";

const BUG_OPTIONS = ["Gián", "Chuột", "Mối", "Muỗi", "Kiến", "Ruồi", "Khác"];
const LOAI_HINH_OPTIONS = [
  "Cá nhân / Hộ gia đình",
  "Doanh nghiệp / Khu công nghiệp",
  "Khu chung cư / Văn phòng / Trường học",
  "Trang trại",
];
const STATUS_OPTIONS = [
  { value: "Mới", label: "Mới", color: "amber" },
  { value: "Đã liên hệ", label: "Đã liên hệ", color: "blue" },
  { value: "Đang tư vấn", label: "Đang tư vấn", color: "blue" },
  { value: "Đã báo giá", label: "Đã báo giá", color: "blue" },
  { value: "Chốt đơn", label: "Chốt đơn", color: "green" },
  { value: "Đang triển khai", label: "Đang triển khai", color: "green" },
  { value: "Hoàn thành", label: "Hoàn thành", color: "green" },
  { value: "Từ chối", label: "Từ chối", color: "red" },
];

export default function YeuCauPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // View/Edit dialog
  const [selected, setSelected] = useState<ServiceRequest | null>(null);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({
    ten_kh: "", sdt: "", email: "", dia_chi: "", loai_hinh: "",
    loai_con_trung: "", dien_tich: "", mo_ta: "",
  });
  const [creating, setCreating] = useState(false);

  // Convert dialog
  const [showConvert, setShowConvert] = useState(false);
  const [convertDichVu, setConvertDichVu] = useState("");
  const [converting, setConverting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [reqs, custs] = await Promise.all([fetchServiceRequests(), fetchCustomers()]);
      setData(reqs);
      setCustomers(custs);
    } catch { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }

  const filtered = data.filter((item) => {
    if (filterStatus === "active" && (item.trang_thai === "Hoàn thành" || item.trang_thai === "Từ chối" || item.trang_thai === "Chốt đơn")) return false;
    if (filterStatus !== "active" && filterStatus !== "all" && item.trang_thai !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!item.ten_kh.toLowerCase().includes(q) && !item.sdt.includes(q) && !item.ma_yc.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Status update
  const handleStatusChange = async (id: string, trang_thai: string) => {
    try {
      await updateServiceRequest(id, { trang_thai });
      setData((prev) => prev.map((r) => r.id === id ? { ...r, trang_thai } : r));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, trang_thai } : null);
      toast.success(`Trạng thái → ${trang_thai}`);
    } catch { toast.error("Lỗi cập nhật"); }
  };

  // Notes update
  const handleNotesUpdate = async (id: string, ghi_chu_nv: string) => {
    try {
      await updateServiceRequest(id, { ghi_chu_nv });
      setData((prev) => prev.map((r) => r.id === id ? { ...r, ghi_chu_nv } : r));
    } catch { toast.error("Lỗi lưu ghi chú"); }
  };

  // Create request
  const handleCreate = async () => {
    if (!newForm.ten_kh.trim() || !newForm.sdt.trim()) { toast.error("Nhập tên và SĐT"); return; }
    setCreating(true);
    try {
      await createServiceRequest({
        ten_kh: newForm.ten_kh.trim(),
        sdt: sanitizePhone(newForm.sdt),
        email: newForm.email ? sanitizeEmail(newForm.email) : undefined,
        dia_chi: newForm.dia_chi.trim() || undefined,
        loai_hinh: newForm.loai_hinh || undefined,
        loai_con_trung: newForm.loai_con_trung || undefined,
        dien_tich: newForm.dien_tich || undefined,
        mo_ta: newForm.mo_ta.trim() || undefined,
      });
      toast.success("Đã tạo yêu cầu");
      setShowCreate(false);
      setNewForm({ ten_kh: "", sdt: "", email: "", dia_chi: "", loai_hinh: "", loai_con_trung: "", dien_tich: "", mo_ta: "" });
      await loadData();
    } catch { toast.error("Lỗi tạo yêu cầu"); }
    finally { setCreating(false); }
  };

  // Convert to customer + contract
  const handleConvert = async () => {
    if (!selected) return;
    setConverting(true);
    try {
      const phone = sanitizePhone(selected.sdt);
      const existing = customers.find((c) => sanitizePhone(c.sdt) === phone);
      let customerId: string;

      if (existing) {
        customerId = existing.id;
      } else {
        const cust = await createCustomer({
          ten_kh: selected.ten_kh,
          sdt: phone,
          email: selected.email ?? "",
          dia_chi: selected.dia_chi ?? "",
          loai_kh: selected.loai_hinh || "Hộ gia đình",
          trang_thai: "Đang phục vụ",
          ghi_chu: `Từ yêu cầu ${selected.ma_yc}`,
        });
        customerId = cust.id;
      }

      await createContract({
        customer_id: customerId,
        dich_vu: convertDichVu || selected.loai_con_trung || "Kiểm soát côn trùng",
        gia_tri: null,
        trang_thai: "Mới",
        dien_tich: selected.dien_tich || null,
        ngay_bat_dau: new Date().toISOString().split("T")[0],
        ngay_ket_thuc: null,
        ghi_chu: `Từ ${selected.ma_yc}: ${selected.mo_ta || ""}`,
      });

      await updateServiceRequest(selected.id, { trang_thai: "Chốt đơn", xu_ly_boi: user?.id ?? null });
      toast.success(existing ? "Đã tạo hợp đồng cho KH hiện có" : "Đã tạo KH + HĐ thành công");
      setShowConvert(false);
      setSelected(null);
      await loadData();
      router.push("/admin/hop-dong");
    } catch { toast.error("Lỗi chuyển đổi"); }
    finally { setConverting(false); }
  };

  const canEdit = user?.vai_tro !== "Xem";
  const statusColor = (s: string) => STATUS_OPTIONS.find((o) => o.value === s)?.color || "gray";

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Yêu cầu dịch vụ</h1>
          <p className="admin-page-subtitle">Quản lý yêu cầu từ khách hàng ({filtered.length})</p>
        </div>
        {canEdit && (
          <button className="p-btn p-btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Thêm yêu cầu
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input placeholder="Tìm tên, SĐT, mã YC..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { value: "active", label: "Đang xử lý" },
            { value: "all", label: "Tất cả" },
            { value: "Mới", label: "Mới" },
            { value: "Đã liên hệ", label: "Đã liên hệ" },
            { value: "Đang tư vấn", label: "Đang tư vấn" },
            { value: "Chốt đơn", label: "Chốt đơn" },
            { value: "Từ chối", label: "Từ chối" },
          ].map((f) => (
            <button key={f.value} className={`p-btn ${filterStatus === f.value ? "p-btn-primary" : "p-btn-ghost"}`}
              onClick={() => { setFilterStatus(f.value); setPage(1); }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? <div className="empty-state"><p>Đang tải...</p></div> : paged.length === 0 ? (
        <div className="empty-state"><p>Không có yêu cầu nào</p></div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã YC</th>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Loại côn trùng</th>
                  <th>Loại hình</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.ma_yc}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.ten_kh}</div>
                      {item.email && <div style={{ fontSize: 11, color: "var(--neutral-500)" }}>{item.email}</div>}
                    </td>
                    <td>{item.sdt}</td>
                    <td>{item.loai_con_trung || "—"}</td>
                    <td style={{ fontSize: 12 }}>{item.loai_hinh || "—"}</td>
                    <td>
                      {canEdit ? (
                        <select className="p-select" style={{ width: 130, fontSize: 12, padding: "3px 6px" }}
                          value={item.trang_thai} onChange={(e) => handleStatusChange(item.id, e.target.value)}>
                          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      ) : (
                        <span className={`admin-badge ${statusColor(item.trang_thai)}`}>{item.trang_thai}</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>{formatDate(item.created_at)}</td>
                    <td>
                      <button className="admin-action-btn" title="Xem chi tiết" onClick={() => setSelected(item)}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}

      {/* Detail Dialog */}
      {selected && (
        <div className="admin-dialog-overlay" onClick={() => setSelected(null)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="admin-dialog-header">
              <h2>{selected.ma_yc} — {selected.ten_kh}</h2>
              <button className="admin-dialog-close" onClick={() => setSelected(null)}><X size={20} /></button>
            </div>
            <div className="admin-dialog-body">
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <span className={`admin-badge ${statusColor(selected.trang_thai)}`}>{selected.trang_thai}</span>
                <span style={{ fontSize: 12, color: "var(--neutral-500)" }}>Ngày tạo: {formatDate(selected.created_at)}</span>
              </div>

              <div className="pipeline-detail-grid">
                <div className="pipeline-detail-item"><Phone size={15} /><div><div className="pipeline-detail-label">SĐT</div><div className="pipeline-detail-value">{selected.sdt}</div></div></div>
                {selected.email && <div className="pipeline-detail-item"><Mail size={15} /><div><div className="pipeline-detail-label">Email</div><div className="pipeline-detail-value">{selected.email}</div></div></div>}
                {selected.dia_chi && <div className="pipeline-detail-item"><MapPin size={15} /><div><div className="pipeline-detail-label">Địa chỉ</div><div className="pipeline-detail-value">{selected.dia_chi}</div></div></div>}
                {selected.loai_con_trung && <div className="pipeline-detail-item"><Bug size={15} /><div><div className="pipeline-detail-label">Côn trùng</div><div className="pipeline-detail-value">{selected.loai_con_trung}</div></div></div>}
                {selected.loai_hinh && <div className="pipeline-detail-item"><div><div className="pipeline-detail-label">Loại hình</div><div className="pipeline-detail-value">{selected.loai_hinh}</div></div></div>}
                {selected.dien_tich && <div className="pipeline-detail-item"><Ruler size={15} /><div><div className="pipeline-detail-label">Diện tích</div><div className="pipeline-detail-value">{selected.dien_tich} m²</div></div></div>}
              </div>

              {selected.mo_ta && (
                <div style={{ marginTop: 12 }}>
                  <label className="admin-label">Mô tả</label>
                  <p style={{ fontSize: 13, color: "var(--neutral-600)" }}>{selected.mo_ta}</p>
                </div>
              )}

              {/* Status change */}
              {canEdit && (
                <div className="admin-form-group" style={{ marginTop: 16 }}>
                  <label className="admin-label">Trạng thái</label>
                  <select className="p-select" value={selected.trang_thai} onChange={(e) => handleStatusChange(selected.id, e.target.value)}>
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              )}

              {/* Notes */}
              {canEdit && (
                <div className="admin-form-group" style={{ marginTop: 8 }}>
                  <label className="admin-label">Ghi chú nhân viên</label>
                  <textarea className="p-textarea" rows={3} defaultValue={selected.ghi_chu_nv || ""}
                    onBlur={(e) => {
                      if (e.target.value !== (selected.ghi_chu_nv || "")) handleNotesUpdate(selected.id, e.target.value);
                    }}
                    placeholder="Ghi chú xử lý..."
                  />
                </div>
              )}
            </div>
            <div className="admin-dialog-footer">
              <button className="p-btn p-btn-ghost" onClick={() => setSelected(null)}>Đóng</button>
              {canEdit && selected.trang_thai !== "Chốt đơn" && selected.trang_thai !== "Hoàn thành" && (
                <button className="p-btn p-btn-primary" onClick={() => {
                  setConvertDichVu(selected.loai_con_trung ? `Dịch vụ ${selected.loai_con_trung}` : "");
                  setShowConvert(true);
                }}>
                  <ArrowRightLeft size={14} /> Chuyển thành KH + HĐ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Convert Dialog */}
      {showConvert && selected && (
        <div className="admin-dialog-overlay" onClick={() => setShowConvert(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="admin-dialog-header">
              <h2>Chuyển đổi thành KH + HĐ</h2>
              <button className="admin-dialog-close" onClick={() => setShowConvert(false)}><X size={20} /></button>
            </div>
            <div className="admin-dialog-body">
              <div className="sync-card-info">
                <strong>{selected.ten_kh}</strong> — {selected.sdt}
                {selected.loai_con_trung && <div style={{ fontSize: 12, color: "var(--neutral-500)" }}>{selected.loai_con_trung}</div>}
              </div>
              {customers.find((c) => sanitizePhone(c.sdt) === sanitizePhone(selected.sdt)) && (
                <div className="sync-existing" style={{ padding: "8px 12px", background: "#F0FDF4", borderRadius: 8, marginBottom: 12 }}>
                  KH đã tồn tại — sẽ tạo HĐ mới cho KH này
                </div>
              )}
              <div className="admin-form-group">
                <label className="admin-label">Dịch vụ HĐ</label>
                <input className="p-input" value={convertDichVu} onChange={(e) => setConvertDichVu(e.target.value)} placeholder="Kiểm soát côn trùng" />
              </div>
            </div>
            <div className="admin-dialog-footer">
              <button className="p-btn p-btn-ghost" onClick={() => setShowConvert(false)}>Hủy</button>
              <button className="p-btn p-btn-primary" onClick={handleConvert} disabled={converting}>
                {converting ? "Đang xử lý..." : "Tạo KH + HĐ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      {showCreate && (
        <div className="admin-dialog-overlay" onClick={() => setShowCreate(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="admin-dialog-header">
              <h2>Thêm yêu cầu mới</h2>
              <button className="admin-dialog-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <div className="admin-dialog-body">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Họ tên *</label>
                  <input className="p-input" value={newForm.ten_kh} onChange={(e) => setNewForm({ ...newForm, ten_kh: e.target.value })} placeholder="Nguyễn Văn A" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">SĐT *</label>
                  <input className="p-input" value={newForm.sdt} onChange={(e) => setNewForm({ ...newForm, sdt: e.target.value })} placeholder="085 9955 969" />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Email</label>
                  <input className="p-input" type="email" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Địa chỉ</label>
                  <input className="p-input" value={newForm.dia_chi} onChange={(e) => setNewForm({ ...newForm, dia_chi: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Loại hình</label>
                  <select className="p-select" value={newForm.loai_hinh} onChange={(e) => setNewForm({ ...newForm, loai_hinh: e.target.value })}>
                    <option value="">— Chọn —</option>
                    {LOAI_HINH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Loại côn trùng</label>
                  <select className="p-select" value={newForm.loai_con_trung} onChange={(e) => setNewForm({ ...newForm, loai_con_trung: e.target.value })}>
                    <option value="">— Chọn —</option>
                    {BUG_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Diện tích (m²)</label>
                <input className="p-input" type="number" value={newForm.dien_tich} onChange={(e) => setNewForm({ ...newForm, dien_tich: e.target.value })} placeholder="80" />
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Mô tả</label>
                <textarea className="p-textarea" rows={3} value={newForm.mo_ta} onChange={(e) => setNewForm({ ...newForm, mo_ta: e.target.value })} placeholder="Mô tả tình trạng..." />
              </div>
            </div>
            <div className="admin-dialog-footer">
              <button className="p-btn p-btn-ghost" onClick={() => setShowCreate(false)}>Hủy</button>
              <button className="p-btn p-btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? "Đang lưu..." : "Tạo yêu cầu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
