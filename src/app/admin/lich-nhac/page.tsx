"use client";

import { useEffect, useState } from "react";
import {
  fetchReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  type Reminder,
  type CreateReminderInput,
} from "@/lib/api/reminders.api";
import { fetchCustomers, type Customer } from "@/lib/api/customers.api";
import { fetchContracts, type Contract } from "@/lib/api/contracts.api";
import { fetchUsers, type User } from "@/lib/api/users.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  Plus, Search, X, Trash2, Bell, CheckCircle, Edit2, Calendar,
} from "lucide-react";

const LOAI_OPTIONS = ["Lần DV tiếp theo", "Bảo hành", "Tái ký", "Hỏi thăm", "Thanh toán", "Khác"];
const LOAI_COLORS: Record<string, string> = {
  "Lần DV tiếp theo": "blue",
  "Bảo hành": "amber",
  "Tái ký": "green",
  "Hỏi thăm": "purple",
  "Thanh toán": "red",
  "Khác": "gray",
};
const TT_COLORS: Record<string, string> = { "Chờ": "amber", "Đã làm": "green", "Bỏ qua": "gray" };

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Chờ");
  const [filterLoai, setFilterLoai] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<CreateReminderInput>({
    customer_id: "", contract_id: "", loai: "Hỏi thăm",
    ngay_nhac: new Date().toISOString().split("T")[0], noi_dung: "", nguoi_phu_trach: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [r, c, ct, u] = await Promise.all([
        fetchReminders(), fetchCustomers(), fetchContracts(), fetchUsers(),
      ]);
      setReminders(r); setCustomers(c); setContracts(ct); setUsers(u);
    } catch { toast.error("Lỗi tải"); }
    finally { setLoading(false); }
  }

  const filtered = reminders.filter((r) => {
    if (filterStatus && r.trang_thai !== filterStatus) return false;
    if (filterLoai && r.loai !== filterLoai) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.customers?.ten_kh.toLowerCase().includes(q) && !r.noi_dung?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!form.ngay_nhac || !form.loai) { toast.error("Nhập loại và ngày nhắc"); return; }
    try {
      await createReminder(form);
      toast.success("Đã tạo nhắc nhở");
      setShowForm(false);
      await loadData();
    } catch { toast.error("Lỗi"); }
  };

  const handleDone = async (id: string) => {
    try {
      await updateReminder(id, { trang_thai: "Đã làm" });
      setReminders((prev) => prev.map((r) => r.id === id ? { ...r, trang_thai: "Đã làm" } : r));
      toast.success("Đã hoàn thành");
    } catch { toast.error("Lỗi"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa nhắc nhở này?")) return;
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success("Đã xóa");
    } catch { toast.error("Lỗi"); }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lịch nhắc</h1>
          <p className="admin-page-subtitle">Quản lý nhắc nhở & chăm sóc ({filtered.length})</p>
        </div>
        <button className="p-btn p-btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Tạo nhắc nhở
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input placeholder="Tìm..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["", "Chờ", "Đã làm", "Bỏ qua"].map((s) => (
            <button key={s} className={`p-btn ${filterStatus === s ? "p-btn-primary" : "p-btn-ghost"}`}
              onClick={() => { setFilterStatus(s); setPage(1); }}>
              {s || "Tất cả"}
            </button>
          ))}
          <select className="p-select" style={{ width: 150 }} value={filterLoai} onChange={(e) => { setFilterLoai(e.target.value); setPage(1); }}>
            <option value="">Tất cả loại</option>
            {LOAI_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="empty-state"><p>Đang tải...</p></div> : paginated.length === 0 ? (
        <div className="empty-state"><Bell size={48} strokeWidth={1} /><p>Không có nhắc nhở</p></div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Loại</th>
                  <th>Ngày nhắc</th>
                  <th>Khách hàng</th>
                  <th>HĐ</th>
                  <th>Nội dung</th>
                  <th>Phụ trách</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => {
                  const isOverdue = r.trang_thai === "Chờ" && r.ngay_nhac < today;
                  return (
                    <tr key={r.id} style={isOverdue ? { background: "#FEF2F2" } : undefined}>
                      <td><span className={`admin-badge ${LOAI_COLORS[r.loai] || "gray"}`}>{r.loai}</span></td>
                      <td style={isOverdue ? { color: "#DC2626", fontWeight: 600 } : undefined}>
                        {formatDate(r.ngay_nhac)}
                        {isOverdue && " (quá hạn)"}
                      </td>
                      <td>{r.customers?.ten_kh || "—"}</td>
                      <td>{r.contracts?.ma_hd || "—"}</td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{r.noi_dung || "—"}</td>
                      <td>{r.users?.ho_ten || "—"}</td>
                      <td><span className={`admin-badge ${TT_COLORS[r.trang_thai] || "gray"}`}>{r.trang_thai}</span></td>
                      <td>
                        <div className="admin-actions">
                          {r.trang_thai === "Chờ" && (
                            <button className="admin-action-btn" title="Hoàn thành" onClick={() => handleDone(r.id)}>
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button className="admin-action-btn text-red-600" title="Xóa" onClick={() => handleDelete(r.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="admin-dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="admin-dialog-header">
              <h2>Tạo nhắc nhở</h2>
              <button className="admin-dialog-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <div className="admin-dialog-body">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Loại *</label>
                  <select className="p-select" value={form.loai} onChange={(e) => setForm({ ...form, loai: e.target.value })}>
                    {LOAI_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Ngày nhắc *</label>
                  <input type="date" className="p-input" value={form.ngay_nhac} onChange={(e) => setForm({ ...form, ngay_nhac: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Khách hàng</label>
                  <select className="p-select" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                    <option value="">— Chọn —</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.ma_kh} — {c.ten_kh}</option>)}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Hợp đồng</label>
                  <select className="p-select" value={form.contract_id} onChange={(e) => setForm({ ...form, contract_id: e.target.value })}>
                    <option value="">— Chọn —</option>
                    {contracts.filter((c) => !form.customer_id || c.customer_id === form.customer_id).map((c) => (
                      <option key={c.id} value={c.id}>{c.ma_hd} — {c.dich_vu}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Người phụ trách</label>
                <select className="p-select" value={form.nguoi_phu_trach} onChange={(e) => setForm({ ...form, nguoi_phu_trach: e.target.value })}>
                  <option value="">— Chọn —</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.ho_ten}</option>)}
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Nội dung</label>
                <textarea className="p-textarea" rows={3} value={form.noi_dung} onChange={(e) => setForm({ ...form, noi_dung: e.target.value })} placeholder="Nội dung nhắc nhở..." />
              </div>
            </div>
            <div className="admin-dialog-footer">
              <button className="p-btn p-btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
              <button className="p-btn p-btn-primary" onClick={handleSubmit}>Tạo nhắc nhở</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
