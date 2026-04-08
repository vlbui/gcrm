"use client";

import { useEffect, useState } from "react";
import {
  fetchTechnicians,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  type Technician,
  type CreateTechnicianInput,
} from "@/lib/api/technicians.api";
import { formatDate } from "@/lib/utils/date";
import DateInput from "@/components/admin/DateInput";
import { toast } from "sonner";
import {
  Plus,
  Search,
  X,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Award,
  UserCheck,
  UserX,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  "Đang làm": "green",
  "Nghỉ phép": "amber",
  "Nghỉ việc": "gray",
};

export default function KTVPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Technician | null>(null);

  const [form, setForm] = useState<CreateTechnicianInput>({
    ho_ten: "", sdt: "", email: "", cccd: "", dia_chi: "",
    chuyen_mon: [], kinh_nghiem_nam: 0, ngay_vao_lam: "",
    trang_thai: "Đang làm", ghi_chu: "",
  });
  const [chuyenMonStr, setChuyenMonStr] = useState("");

  useEffect(() => {
    fetchTechnicians()
      .then(setTechnicians)
      .catch(() => toast.error("Lỗi tải"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = technicians.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.ho_ten.toLowerCase().includes(q) || t.sdt.includes(q) || t.ma_ktv.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ ho_ten: "", sdt: "", email: "", cccd: "", dia_chi: "", chuyen_mon: [], kinh_nghiem_nam: 0, ngay_vao_lam: new Date().toISOString().split("T")[0], trang_thai: "Đang làm", ghi_chu: "" });
    setChuyenMonStr("");
    setShowForm(true);
  };

  const openEdit = (t: Technician) => {
    setEditing(t);
    setForm({
      ho_ten: t.ho_ten, sdt: t.sdt, email: t.email || "", cccd: t.cccd || "",
      dia_chi: t.dia_chi || "", chuyen_mon: t.chuyen_mon || [],
      kinh_nghiem_nam: t.kinh_nghiem_nam || 0,
      ngay_vao_lam: t.ngay_vao_lam || "", trang_thai: t.trang_thai,
      ghi_chu: t.ghi_chu || "",
    });
    setChuyenMonStr((t.chuyen_mon || []).join(", "));
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.ho_ten || !form.sdt) { toast.error("Nhập tên và SĐT"); return; }
    const input = {
      ...form,
      chuyen_mon: chuyenMonStr.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editing) {
        const updated = await updateTechnician(editing.id, input);
        setTechnicians((prev) => prev.map((t) => t.id === editing.id ? updated : t));
        toast.success("Đã cập nhật");
      } else {
        const created = await createTechnician(input);
        setTechnicians((prev) => [created, ...prev]);
        toast.success("Đã thêm KTV");
      }
      setShowForm(false);
    } catch { toast.error("Lỗi"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa KTV này?")) return;
    try {
      await deleteTechnician(id);
      setTechnicians((prev) => prev.filter((t) => t.id !== id));
      setShowForm(false);
      toast.success("Đã xóa");
    } catch { toast.error("Lỗi xóa"); }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Kỹ thuật viên</h1>
          <p className="admin-page-subtitle">Quản lý đội ngũ KTV ({filtered.length})</p>
        </div>
        <button className="p-btn p-btn-primary" onClick={openAdd}>
          <Plus size={15} /> Thêm KTV
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input placeholder="Tìm KTV..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="empty-state"><p>Đang tải...</p></div> : (
        <div className="ktv-grid">
          {filtered.map((t) => (
            <div key={t.id} className="ktv-card" onClick={() => openEdit(t)}>
              <div className="ktv-card-avatar">{t.ho_ten.charAt(0)}</div>
              <div className="ktv-card-info">
                <div className="ktv-card-name">{t.ho_ten}</div>
                <div className="ktv-card-code">{t.ma_ktv}</div>
                <div className="ktv-card-phone"><Phone size={12} /> {t.sdt}</div>
                {t.chuyen_mon?.length > 0 && (
                  <div className="ktv-card-tags">
                    {t.chuyen_mon.map((c) => <span key={c} className="ktv-tag">{c}</span>)}
                  </div>
                )}
              </div>
              <span className={`admin-badge ${STATUS_COLORS[t.trang_thai] || "gray"}`}>
                {t.trang_thai}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state"><p>Chưa có KTV nào</p></div>
          )}
        </div>
      )}

      {/* Form Dialog */}
      {showForm && (
        <div className="admin-dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <h2>{editing ? `Sửa ${editing.ma_ktv}` : "Thêm KTV mới"}</h2>
              <button className="admin-dialog-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="admin-dialog-body">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Họ tên *</label>
                  <input className="p-input" value={form.ho_ten} onChange={(e) => setForm({ ...form, ho_ten: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">SĐT *</label>
                  <input className="p-input" value={form.sdt} onChange={(e) => setForm({ ...form, sdt: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Email</label>
                  <input className="p-input" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">CCCD</label>
                  <input className="p-input" value={form.cccd || ""} onChange={(e) => setForm({ ...form, cccd: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Địa chỉ</label>
                <input className="p-input" value={form.dia_chi || ""} onChange={(e) => setForm({ ...form, dia_chi: e.target.value })} />
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Chuyên môn (phẩy cách)</label>
                  <input className="p-input" placeholder="Mối, Chuột, Gián" value={chuyenMonStr} onChange={(e) => setChuyenMonStr(e.target.value)} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Kinh nghiệm (năm)</label>
                  <input className="p-input" type="number" min={0} value={form.kinh_nghiem_nam} onChange={(e) => setForm({ ...form, kinh_nghiem_nam: Number(e.target.value) })} />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Ngày vào làm</label>
                  <DateInput value={form.ngay_vao_lam || ""} onChange={(v) => setForm({ ...form, ngay_vao_lam: v })} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Trạng thái</label>
                  <select className="p-select" value={form.trang_thai} onChange={(e) => setForm({ ...form, trang_thai: e.target.value })}>
                    <option>Đang làm</option>
                    <option>Nghỉ phép</option>
                    <option>Nghỉ việc</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Ghi chú</label>
                <textarea className="p-textarea" rows={2} value={form.ghi_chu || ""} onChange={(e) => setForm({ ...form, ghi_chu: e.target.value })} />
              </div>
            </div>
            <div className="admin-dialog-footer">
              {editing && (
                <button className="p-btn p-btn-ghost" style={{ color: "var(--danger-500)", marginRight: "auto" }} onClick={() => handleDelete(editing.id)}>
                  <Trash2 size={14} /> Xóa
                </button>
              )}
              <button className="p-btn p-btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
              <button className="p-btn p-btn-primary" onClick={handleSubmit}>
                {editing ? "Cập nhật" : "Thêm KTV"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
