"use client";

import { useEffect, useState } from "react";
import {
  fetchCareTasks,
  createCareTask,
  updateCareTask,
  deleteCareTask,
  type CareTask,
  type CreateCareTaskInput,
} from "@/lib/api/careTasks.api";
import { fetchCustomers, type Customer } from "@/lib/api/customers.api";
import { fetchContracts, type Contract } from "@/lib/api/contracts.api";
import { fetchUsers, type User } from "@/lib/api/users.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  Plus,
  Search,
  Trash2,
  X,
  Heart,
  Phone,
  CheckCircle,
  Edit2,
} from "lucide-react";

const LOAI_COLORS: Record<string, string> = {
  "Bảo hành": "blue",
  "Tái ký": "green",
  "Hỏi thăm": "amber",
  "Khác": "gray",
};

const TT_COLORS: Record<string, string> = {
  "Chờ": "amber",
  "Đã làm": "green",
  "Quá hạn": "red",
  "Hủy": "gray",
};

export default function CareTasksPage() {
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<CareTask | null>(null);
  const [formData, setFormData] = useState<CreateCareTaskInput & { trang_thai?: string; ket_qua?: string }>({
    customer_id: "",
    contract_id: null,
    loai: "Hỏi thăm",
    ngay_hen: new Date().toISOString().split("T")[0],
    noi_dung: "",
    nguoi_phu_trach: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [t, c, ct, u] = await Promise.all([
        fetchCareTasks(),
        fetchCustomers(),
        fetchContracts(),
        fetchUsers(),
      ]);
      setTasks(t);
      setCustomers(c);
      setContracts(ct);
      setUsers(u);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  const filtered = tasks.filter((t) => {
    const matchSearch =
      !search ||
      t.ma_cs.toLowerCase().includes(search.toLowerCase()) ||
      t.customers?.ten_kh.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || t.trang_thai === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openNewForm = () => {
    setEditTask(null);
    setFormData({
      customer_id: "",
      contract_id: null,
      loai: "Hỏi thăm",
      ngay_hen: new Date().toISOString().split("T")[0],
      noi_dung: "",
      nguoi_phu_trach: null,
    });
    setShowForm(true);
  };

  const openEditForm = (t: CareTask) => {
    setEditTask(t);
    setFormData({
      customer_id: t.customer_id,
      contract_id: t.contract_id,
      loai: t.loai,
      ngay_hen: t.ngay_hen,
      noi_dung: t.noi_dung || "",
      nguoi_phu_trach: t.nguoi_phu_trach,
      trang_thai: t.trang_thai,
      ket_qua: t.ket_qua || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.customer_id) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }
    try {
      if (editTask) {
        const updates: Record<string, unknown> = { ...formData };
        if (formData.trang_thai === "Đã làm" && editTask.trang_thai !== "Đã làm") {
          updates.completed_at = new Date().toISOString();
        }
        await updateCareTask(editTask.id, updates as Parameters<typeof updateCareTask>[1]);
        toast.success("Đã cập nhật");
      } else {
        await createCareTask(formData);
        toast.success("Đã tạo task chăm sóc");
      }
      setShowForm(false);
      await loadData();
    } catch {
      toast.error("Lỗi lưu");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa task này?")) return;
    try {
      await deleteCareTask(id);
      toast.success("Đã xóa");
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("Lỗi xóa");
    }
  };

  const handleQuickComplete = async (t: CareTask) => {
    try {
      await updateCareTask(t.id, {
        trang_thai: "Đã làm",
        completed_at: new Date().toISOString(),
      });
      toast.success("Đã hoàn thành");
      await loadData();
    } catch {
      toast.error("Lỗi");
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Chăm sóc sau bán</h1>
          <p className="admin-page-subtitle">Quản lý task chăm sóc khách hàng ({filtered.length})</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openNewForm}>
          <Plus size={16} /> Tạo task
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            placeholder="Tìm mã, khách hàng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="admin-input"
          style={{ width: 160 }}
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả TT</option>
          <option value="Chờ">Chờ</option>
          <option value="Đã làm">Đã làm</option>
          <option value="Quá hạn">Quá hạn</option>
          <option value="Hủy">Hủy</option>
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><p>Đang tải...</p></div>
      ) : paginated.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} strokeWidth={1} />
          <p>Chưa có task chăm sóc</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Khách hàng</th>
                  <th>Loại</th>
                  <th>Ngày hẹn</th>
                  <th>Nội dung</th>
                  <th>Phụ trách</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.ma_cs}</td>
                    <td>
                      <div>{t.customers?.ten_kh}</div>
                      <div style={{ fontSize: 12, color: "var(--neutral-400)" }}>
                        {t.customers?.sdt}
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${LOAI_COLORS[t.loai] || "gray"}`}>
                        {t.loai}
                      </span>
                    </td>
                    <td>{formatDate(t.ngay_hen)}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.noi_dung || "—"}
                    </td>
                    <td>{t.users?.ho_ten || "—"}</td>
                    <td>
                      <span className={`admin-badge ${TT_COLORS[t.trang_thai] || "gray"}`}>
                        {t.trang_thai}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        {t.trang_thai === "Chờ" && (
                          <button
                            className="admin-action-btn"
                            title="Hoàn thành"
                            onClick={() => handleQuickComplete(t)}
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          className="admin-action-btn"
                          title="Sửa"
                          onClick={() => openEditForm(t)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="admin-action-btn text-red-600"
                          title="Xóa"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}

      {/* Form Dialog */}
      {showForm && (
        <div className="admin-dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <h2>{editTask ? `Sửa ${editTask.ma_cs}` : "Tạo task chăm sóc"}</h2>
              <button className="admin-dialog-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-dialog-body">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Khách hàng *</label>
                  <select
                    className="admin-input"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    <option value="">— Chọn —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.ma_kh} — {c.ten_kh}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Loại</label>
                  <select
                    className="admin-input"
                    value={formData.loai}
                    onChange={(e) => setFormData({ ...formData, loai: e.target.value })}
                  >
                    <option>Hỏi thăm</option>
                    <option>Tái ký</option>
                    <option>Bảo hành</option>
                    <option>Khác</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Ngày hẹn *</label>
                  <input
                    type="date"
                    className="admin-input"
                    value={formData.ngay_hen}
                    onChange={(e) => setFormData({ ...formData, ngay_hen: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Người phụ trách</label>
                  <select
                    className="admin-input"
                    value={formData.nguoi_phu_trach || ""}
                    onChange={(e) => setFormData({ ...formData, nguoi_phu_trach: e.target.value || null })}
                  >
                    <option value="">— Chọn —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.ho_ten}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Hợp đồng liên quan</label>
                <select
                  className="admin-input"
                  value={formData.contract_id || ""}
                  onChange={(e) => setFormData({ ...formData, contract_id: e.target.value || null })}
                >
                  <option value="">— Không —</option>
                  {contracts
                    .filter((c) => !formData.customer_id || c.customer_id === formData.customer_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.ma_hd} — {c.dich_vu}</option>
                    ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Nội dung</label>
                <textarea
                  className="admin-input"
                  rows={2}
                  value={formData.noi_dung || ""}
                  onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
                  placeholder="Mô tả task..."
                />
              </div>
              {editTask && (
                <>
                  <div className="admin-form-group">
                    <label className="admin-label">Trạng thái</label>
                    <select
                      className="admin-input"
                      value={formData.trang_thai || "Chờ"}
                      onChange={(e) => setFormData({ ...formData, trang_thai: e.target.value })}
                    >
                      <option>Chờ</option>
                      <option>Đã làm</option>
                      <option>Quá hạn</option>
                      <option>Hủy</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Kết quả</label>
                    <textarea
                      className="admin-input"
                      rows={2}
                      value={formData.ket_qua || ""}
                      onChange={(e) => setFormData({ ...formData, ket_qua: e.target.value })}
                      placeholder="Kết quả chăm sóc..."
                    />
                  </div>
                </>
              )}
            </div>
            <div className="admin-dialog-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowForm(false)}>
                Hủy
              </button>
              <button className="admin-btn admin-btn-primary" onClick={handleSubmit}>
                {editTask ? "Cập nhật" : "Tạo task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
