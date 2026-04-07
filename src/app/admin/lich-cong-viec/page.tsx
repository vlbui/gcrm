"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  type Schedule,
  type CreateScheduleInput,
} from "@/lib/api/schedules.api";
import { fetchUsers, type User } from "@/lib/api/users.api";
import { fetchContracts, type Contract } from "@/lib/api/contracts.api";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  MapPin,
  Clock,
  Trash2,
  Filter,
} from "lucide-react";

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const STATUS_COLORS: Record<string, string> = {
  "Chưa làm": "#6B7280",
  "Đang làm": "#3B82F6",
  "Hoàn thành": "#10B981",
  "Hủy": "#EF4444",
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [filterKtv, setFilterKtv] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);

  // Form
  const [formData, setFormData] = useState<CreateScheduleInput>({
    contract_id: null,
    ngay_thuc_hien: new Date().toISOString().split("T")[0],
    gio_bat_dau: "08:00",
    gio_ket_thuc: "10:00",
    ktv_id: null,
    dia_diem: "",
    ghi_chu: "",
  });

  const loadData = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const from = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const to = new Date(year, month + 2, 0).toISOString().split("T")[0];

      const [s, u, c] = await Promise.all([
        fetchSchedules({ from, to, ktv_id: filterKtv || undefined }),
        fetchUsers(),
        fetchContracts(),
      ]);
      setSchedules(s);
      setUsers(u);
      setContracts(c);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [currentDate, filterKtv]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getDateStr = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getDaySchedules = (day: number) => {
    const dateStr = getDateStr(day);
    return schedules.filter((s) => s.ngay_thuc_hien === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const openNewForm = (date?: string) => {
    setEditSchedule(null);
    setFormData({
      contract_id: null,
      ngay_thuc_hien: date || new Date().toISOString().split("T")[0],
      gio_bat_dau: "08:00",
      gio_ket_thuc: "10:00",
      ktv_id: null,
      dia_diem: "",
      ghi_chu: "",
    });
    setShowForm(true);
  };

  const openEditForm = (s: Schedule) => {
    setEditSchedule(s);
    setFormData({
      contract_id: s.contract_id,
      ngay_thuc_hien: s.ngay_thuc_hien,
      gio_bat_dau: s.gio_bat_dau || "08:00",
      gio_ket_thuc: s.gio_ket_thuc || "10:00",
      ktv_id: s.ktv_id,
      dia_diem: s.dia_diem || "",
      ghi_chu: s.ghi_chu || "",
      trang_thai: s.trang_thai,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.ngay_thuc_hien) {
      toast.error("Vui lòng chọn ngày");
      return;
    }
    try {
      if (editSchedule) {
        await updateSchedule(editSchedule.id, formData);
        toast.success("Đã cập nhật");
      } else {
        await createSchedule(formData);
        toast.success("Đã tạo lịch");
      }
      setShowForm(false);
      await loadData();
    } catch {
      toast.error("Lỗi lưu lịch");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa lịch này?")) return;
    try {
      await deleteSchedule(id);
      toast.success("Đã xóa");
      await loadData();
    } catch {
      toast.error("Lỗi xóa");
    }
  };

  // Get KTV color
  const ktvColors = ["#2E7D32", "#1565C0", "#6A1B9A", "#E65100", "#C62828", "#00838F", "#4E342E", "#AD1457"];
  const ktvColorMap = new Map<string, string>();
  users.forEach((u, i) => ktvColorMap.set(u.id, ktvColors[i % ktvColors.length]));

  const monthName = currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lịch công việc</h1>
          <p className="admin-page-subtitle">Quản lý lịch và phân công KTV</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => openNewForm()}>
          <Plus size={16} /> Thêm lịch
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="calendar-controls">
        <div className="calendar-nav">
          <button className="admin-btn admin-btn-ghost" onClick={prevMonth}>
            <ChevronLeft size={18} />
          </button>
          <h2 className="calendar-month-title">{monthName}</h2>
          <button className="admin-btn admin-btn-ghost" onClick={nextMonth}>
            <ChevronRight size={18} />
          </button>
          <button className="admin-btn admin-btn-outline" onClick={goToday}>
            Hôm nay
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Filter size={16} style={{ color: "var(--neutral-400)" }} />
          <select
            className="admin-input"
            style={{ width: 180 }}
            value={filterKtv}
            onChange={(e) => setFilterKtv(e.target.value)}
          >
            <option value="">Tất cả KTV</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.ho_ten}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="empty-state"><p>Đang tải...</p></div>
      ) : (
        <div className="calendar-grid">
          {DAYS.map((d) => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="calendar-cell empty" />;
            const dateStr = getDateStr(day);
            const daySchedules = getDaySchedules(day);
            const isToday = dateStr === today;

            return (
              <div
                key={day}
                className={`calendar-cell ${isToday ? "today" : ""}`}
                onClick={() => openNewForm(dateStr)}
              >
                <div className={`calendar-cell-day ${isToday ? "today" : ""}`}>
                  {day}
                </div>
                <div className="calendar-cell-events">
                  {daySchedules.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="calendar-event"
                      style={{
                        borderLeftColor: s.ktv_id ? ktvColorMap.get(s.ktv_id) || "#6B7280" : "#6B7280",
                        background: s.trang_thai === "Hoàn thành" ? "#F0FDF4" : s.trang_thai === "Hủy" ? "#FEF2F2" : "#F9FAFB",
                      }}
                      onClick={(e) => { e.stopPropagation(); openEditForm(s); }}
                      title={`${s.gio_bat_dau || ""} ${s.contracts?.customers?.ten_kh || s.dia_diem || ""}`}
                    >
                      <span className="calendar-event-time">{s.gio_bat_dau?.slice(0, 5)}</span>
                      <span className="calendar-event-name">
                        {s.contracts?.customers?.ten_kh || s.dia_diem || "—"}
                      </span>
                    </div>
                  ))}
                  {daySchedules.length > 3 && (
                    <div className="calendar-event-more">+{daySchedules.length - 3} thêm</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* KTV Legend */}
      {users.length > 0 && (
        <div className="calendar-legend">
          {users.map((u) => (
            <div key={u.id} className="calendar-legend-item">
              <span className="calendar-legend-dot" style={{ background: ktvColorMap.get(u.id) }} />
              {u.ho_ten}
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {showForm && (
        <div className="admin-dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <h2>{editSchedule ? "Sửa lịch" : "Tạo lịch mới"}</h2>
              <button className="admin-dialog-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-dialog-body">
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Ngày thực hiện *</label>
                  <input
                    type="date"
                    className="admin-input"
                    value={formData.ngay_thuc_hien}
                    onChange={(e) => setFormData({ ...formData, ngay_thuc_hien: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">KTV phụ trách</label>
                  <select
                    className="admin-input"
                    value={formData.ktv_id || ""}
                    onChange={(e) => setFormData({ ...formData, ktv_id: e.target.value || null })}
                  >
                    <option value="">— Chọn KTV —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.ho_ten}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Giờ bắt đầu</label>
                  <input
                    type="time"
                    className="admin-input"
                    value={formData.gio_bat_dau || ""}
                    onChange={(e) => setFormData({ ...formData, gio_bat_dau: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Giờ kết thúc</label>
                  <input
                    type="time"
                    className="admin-input"
                    value={formData.gio_ket_thuc || ""}
                    onChange={(e) => setFormData({ ...formData, gio_ket_thuc: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Hợp đồng</label>
                <select
                  className="admin-input"
                  value={formData.contract_id || ""}
                  onChange={(e) => setFormData({ ...formData, contract_id: e.target.value || null })}
                >
                  <option value="">— Không liên kết HĐ —</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ma_hd} — {c.customers?.ten_kh} ({c.dich_vu})
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Địa điểm</label>
                <input
                  className="admin-input"
                  value={formData.dia_diem || ""}
                  onChange={(e) => setFormData({ ...formData, dia_diem: e.target.value })}
                  placeholder="Địa chỉ thực hiện"
                />
              </div>
              {editSchedule && (
                <div className="admin-form-group">
                  <label className="admin-label">Trạng thái</label>
                  <select
                    className="admin-input"
                    value={formData.trang_thai || "Chưa làm"}
                    onChange={(e) => setFormData({ ...formData, trang_thai: e.target.value })}
                  >
                    <option>Chưa làm</option>
                    <option>Đang làm</option>
                    <option>Hoàn thành</option>
                    <option>Hủy</option>
                  </select>
                </div>
              )}
              <div className="admin-form-group">
                <label className="admin-label">Ghi chú</label>
                <textarea
                  className="admin-input"
                  rows={2}
                  value={formData.ghi_chu || ""}
                  onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
                />
              </div>
            </div>
            <div className="admin-dialog-footer">
              {editSchedule && (
                <button
                  className="admin-btn admin-btn-outline"
                  style={{ color: "var(--danger-500)", borderColor: "var(--danger-500)", marginRight: "auto" }}
                  onClick={() => { handleDelete(editSchedule.id); setShowForm(false); }}
                >
                  <Trash2 size={14} /> Xóa
                </button>
              )}
              <button className="admin-btn admin-btn-outline" onClick={() => setShowForm(false)}>
                Hủy
              </button>
              <button className="admin-btn admin-btn-primary" onClick={handleSubmit}>
                {editSchedule ? "Cập nhật" : "Tạo lịch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
