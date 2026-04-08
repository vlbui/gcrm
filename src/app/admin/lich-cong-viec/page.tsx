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
import { fetchAllVisits, type ServiceVisit } from "@/lib/api/serviceVisits.api";
import {
  fetchReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  type Reminder,
  type CreateReminderInput,
} from "@/lib/api/reminders.api";
import { fetchUsers, type User } from "@/lib/api/users.api";
import { fetchActiveTechnicians, type Technician } from "@/lib/api/technicians.api";
import { fetchContracts, type Contract } from "@/lib/api/contracts.api";
import { fetchCustomers, type Customer } from "@/lib/api/customers.api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/date";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Filter,
  ClipboardList,
  Bell,
  CheckCircle,
} from "lucide-react";

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const LOAI_REMINDER = ["Lần DV tiếp theo", "Bảo hành", "Tái ký", "Hỏi thăm", "Thanh toán", "Khác"];

type CalendarEvent = {
  id: string;
  type: "schedule" | "visit" | "reminder";
  date: string;
  time?: string;
  title: string;
  subTitle?: string;
  status: string;
  ktvId?: string | null;
  raw: Schedule | ServiceVisit | Reminder;
};

type FormMode = "schedule" | "reminder";
type FilterType = "all" | "schedule" | "visit" | "reminder";

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [visits, setVisits] = useState<ServiceVisit[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterKtv, setFilterKtv] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  // Schedule form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("schedule");
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState<CreateScheduleInput>({
    contract_id: null, ngay_thuc_hien: "", gio_bat_dau: "08:00",
    gio_ket_thuc: "10:00", ktv_id: null, dia_diem: "", ghi_chu: "",
  });

  // Reminder form
  const [reminderForm, setReminderForm] = useState<CreateReminderInput>({
    customer_id: "", contract_id: "", loai: "Hỏi thăm",
    ngay_nhac: "", noi_dung: "", nguoi_phu_trach: "",
  });

  const loadData = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const from = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const to = new Date(year, month + 2, 0).toISOString().split("T")[0];

      const [s, v, r, u, t, c, cust] = await Promise.all([
        fetchSchedules({ from, to, ktv_id: filterKtv || undefined }),
        fetchAllVisits({ from, to }),
        fetchReminders({ from, to }),
        fetchUsers(),
        fetchActiveTechnicians(),
        fetchContracts(),
        fetchCustomers(),
      ]);
      setSchedules(s); setVisits(v); setReminders(r);
      setUsers(u); setTechnicians(t); setContracts(c); setCustomers(cust);
    } catch { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }, [currentDate, filterKtv]);

  useEffect(() => { loadData(); }, [loadData]);

  // Build calendar events
  const calendarEvents: CalendarEvent[] = [];

  if (filterType === "all" || filterType === "schedule") {
    for (const s of schedules) {
      calendarEvents.push({
        id: s.id, type: "schedule", date: s.ngay_thuc_hien,
        time: s.gio_bat_dau?.slice(0, 5),
        title: s.contracts?.customers?.ten_kh || s.dia_diem || "Lịch công việc",
        subTitle: s.contracts?.ma_hd || undefined,
        status: s.trang_thai, ktvId: s.ktv_id, raw: s,
      });
    }
  }

  if (filterType === "all" || filterType === "visit") {
    for (const v of visits) {
      if (filterKtv && !(v.ktv_ids || []).includes(filterKtv)) continue;
      const contract = contracts.find((c) => c.id === v.contract_id);
      calendarEvents.push({
        id: v.id, type: "visit", date: v.ngay_du_kien || "",
        time: v.gio_bat_dau?.slice(0, 5),
        title: contract?.customers?.ten_kh || "Lần DV",
        subTitle: contract ? `${contract.ma_hd} · Lần ${v.lan_thu}` : `Lần ${v.lan_thu}`,
        status: v.trang_thai, ktvId: (v.ktv_ids || [])[0] || null, raw: v,
      });
    }
  }

  if (filterType === "all" || filterType === "reminder") {
    for (const r of reminders) {
      calendarEvents.push({
        id: r.id, type: "reminder", date: r.ngay_nhac,
        title: r.customers?.ten_kh || r.loai,
        subTitle: r.noi_dung || r.loai,
        status: r.trang_thai, ktvId: null, raw: r,
      });
    }
  }

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const getDayEvents = (day: number) => {
    const dateStr = getDateStr(day);
    return calendarEvents.filter((e) => e.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Open forms
  const openNewSchedule = (date?: string) => {
    setEditSchedule(null);
    setFormMode("schedule");
    setScheduleForm({
      contract_id: null, ngay_thuc_hien: date || today,
      gio_bat_dau: "08:00", gio_ket_thuc: "10:00",
      ktv_id: null, dia_diem: "", ghi_chu: "",
    });
    setShowForm(true);
  };

  const openNewReminder = (date?: string) => {
    setFormMode("reminder");
    setReminderForm({
      customer_id: "", contract_id: "", loai: "Hỏi thăm",
      ngay_nhac: date || today, noi_dung: "", nguoi_phu_trach: "",
    });
    setShowForm(true);
  };

  const openEditSchedule = (s: Schedule) => {
    setEditSchedule(s);
    setFormMode("schedule");
    setScheduleForm({
      contract_id: s.contract_id, ngay_thuc_hien: s.ngay_thuc_hien,
      gio_bat_dau: s.gio_bat_dau || "08:00", gio_ket_thuc: s.gio_ket_thuc || "10:00",
      ktv_id: s.ktv_id, dia_diem: s.dia_diem || "",
      ghi_chu: s.ghi_chu || "", trang_thai: s.trang_thai,
    });
    setShowForm(true);
  };

  const handleEventClick = (ev: CalendarEvent) => {
    if (ev.type === "schedule") openEditSchedule(ev.raw as Schedule);
    // reminders and visits: click handled inline
  };

  // Submit handlers
  const handleScheduleSubmit = async () => {
    if (!scheduleForm.ngay_thuc_hien) { toast.error("Vui lòng chọn ngày"); return; }
    try {
      if (editSchedule) { await updateSchedule(editSchedule.id, scheduleForm); toast.success("Đã cập nhật"); }
      else { await createSchedule(scheduleForm); toast.success("Đã tạo lịch"); }
      setShowForm(false); await loadData();
    } catch { toast.error("Lỗi lưu lịch"); }
  };

  const handleReminderSubmit = async () => {
    if (!reminderForm.ngay_nhac || !reminderForm.loai) { toast.error("Nhập loại và ngày nhắc"); return; }
    try {
      await createReminder(reminderForm);
      toast.success("Đã tạo nhắc nhở");
      setShowForm(false); await loadData();
    } catch { toast.error("Lỗi tạo nhắc nhở"); }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Xóa lịch này?")) return;
    try { await deleteSchedule(id); toast.success("Đã xóa"); await loadData(); }
    catch { toast.error("Lỗi xóa"); }
  };

  const handleReminderDone = async (id: string) => {
    try {
      await updateReminder(id, { trang_thai: "Đã làm" });
      setReminders((prev) => prev.map((r) => r.id === id ? { ...r, trang_thai: "Đã làm" } : r));
      toast.success("Đã hoàn thành");
    } catch { toast.error("Lỗi"); }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!confirm("Xóa nhắc nhở?")) return;
    try { await deleteReminder(id); toast.success("Đã xóa"); await loadData(); }
    catch { toast.error("Lỗi xóa"); }
  };

  // KTV colors
  const ktvColors = ["#2E7D32", "#1565C0", "#6A1B9A", "#E65100", "#C62828", "#00838F", "#4E342E", "#AD1457"];
  const ktvColorMap = new Map<string, string>();
  technicians.forEach((t, i) => ktvColorMap.set(t.id, ktvColors[i % ktvColors.length]));

  const monthName = currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  const scheduleCount = calendarEvents.filter((e) => e.type === "schedule").length;
  const visitCount = calendarEvents.filter((e) => e.type === "visit").length;
  const reminderCount = calendarEvents.filter((e) => e.type === "reminder").length;
  const overdueReminders = reminders.filter((r) => r.trang_thai === "Chờ" && r.ngay_nhac < today).length;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lịch công tác</h1>
          <p className="admin-page-subtitle">
            {scheduleCount} lịch · {visitCount} lần DV · {reminderCount} nhắc nhở
            {overdueReminders > 0 && <span style={{ color: "#DC2626", fontWeight: 600 }}> · {overdueReminders} quá hạn</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="admin-btn admin-btn-outline" onClick={() => openNewReminder()}>
            <Bell size={16} /> Nhắc nhở
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => openNewSchedule()}>
            <Plus size={16} /> Thêm lịch
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="calendar-controls">
        <div className="calendar-nav">
          <button className="admin-btn admin-btn-ghost" onClick={prevMonth}><ChevronLeft size={18} /></button>
          <h2 className="calendar-month-title">{monthName}</h2>
          <button className="admin-btn admin-btn-ghost" onClick={nextMonth}><ChevronRight size={18} /></button>
          <button className="admin-btn admin-btn-outline" onClick={goToday}>Hôm nay</button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 0 }}>
            {([["all", "Tất cả"], ["schedule", "Lịch"], ["visit", "Lần DV"], ["reminder", "Nhắc"]] as const).map(([key, label]) => (
              <button key={key} className={`dash-range-btn ${filterType === key ? "active" : ""}`}
                onClick={() => setFilterType(key)} style={{ fontSize: 12, padding: "4px 10px" }}>
                {label}
              </button>
            ))}
          </div>
          <Filter size={16} style={{ color: "var(--neutral-400)" }} />
          <select className="admin-input" style={{ width: 180 }} value={filterKtv}
            onChange={(e) => setFilterKtv(e.target.value)}>
            <option value="">Tất cả KTV</option>
            {technicians.map((t) => <option key={t.id} value={t.id}>{t.ho_ten}</option>)}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="empty-state"><p>Đang tải...</p></div>
      ) : (
        <div className="calendar-grid">
          {DAYS.map((d) => <div key={d} className="calendar-day-header">{d}</div>)}
          {calendarDays.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} className="calendar-cell empty" />;
            const dateStr = getDateStr(day);
            const dayEvents = getDayEvents(day);
            const isToday = dateStr === today;

            return (
              <div key={day} className={`calendar-cell ${isToday ? "today" : ""}`}
                onClick={() => openNewSchedule(dateStr)}>
                <div className={`calendar-cell-day ${isToday ? "today" : ""}`}>{day}</div>
                <div className="calendar-cell-events">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const isVisit = ev.type === "visit";
                    const isReminder = ev.type === "reminder";
                    const borderColor = isReminder
                      ? (ev.status === "Chờ" && ev.date < today ? "#DC2626" : "#F59E0B")
                      : ev.ktvId ? ktvColorMap.get(ev.ktvId) || "#6B7280" : "#6B7280";
                    const bgColor = ev.status === "Hoàn thành" || ev.status === "Đã làm" ? "#F0FDF4"
                      : ev.status === "Hủy" || ev.status === "Hoãn" || ev.status === "Bỏ qua" ? "#FEF2F2"
                      : isReminder ? "#FFFBEB"
                      : isVisit ? "#EFF6FF" : "#F9FAFB";

                    return (
                      <div key={ev.id} className="calendar-event"
                        style={{ borderLeftColor: borderColor, background: bgColor }}
                        onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}
                        title={`${isVisit ? "[DV] " : isReminder ? "[Nhắc] " : ""}${ev.time || ""} ${ev.title} ${ev.subTitle || ""}`}>
                        {isVisit && <ClipboardList size={10} style={{ color: "#3B82F6", flexShrink: 0 }} />}
                        {isReminder && <Bell size={10} style={{ color: "#F59E0B", flexShrink: 0 }} />}
                        <span className="calendar-event-time">{ev.time}</span>
                        <span className="calendar-event-name">{ev.title}</span>
                        {isReminder && ev.status === "Chờ" && (
                          <button style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            onClick={(e) => { e.stopPropagation(); handleReminderDone(ev.id); }}
                            title="Hoàn thành">
                            <CheckCircle size={12} style={{ color: "#10B981" }} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="calendar-event-more">+{dayEvents.length - 3} thêm</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot" style={{ background: "#F9FAFB", border: "2px solid #6B7280" }} />
          Lịch công việc
        </div>
        <div className="calendar-legend-item">
          <ClipboardList size={12} style={{ color: "#3B82F6" }} />
          Lần dịch vụ
        </div>
        <div className="calendar-legend-item">
          <Bell size={12} style={{ color: "#F59E0B" }} />
          Nhắc nhở
        </div>
        <span style={{ width: 1, height: 16, background: "var(--neutral-200)" }} />
        {technicians.map((t) => (
          <div key={t.id} className="calendar-legend-item">
            <span className="calendar-legend-dot" style={{ background: ktvColorMap.get(t.id) }} />
            {t.ho_ten}
          </div>
        ))}
      </div>

      {/* Form Dialog */}
      {showForm && (
        <div className="admin-dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <h2>{formMode === "schedule"
                ? (editSchedule ? "Sửa lịch" : "Tạo lịch mới")
                : "Tạo nhắc nhở"
              }</h2>
              <button className="admin-dialog-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Mode toggle for new form */}
            {!editSchedule && (
              <div style={{ display: "flex", gap: 0, padding: "0 20px", marginBottom: 8 }}>
                <button className={`dash-range-btn ${formMode === "schedule" ? "active" : ""}`}
                  onClick={() => setFormMode("schedule")} style={{ fontSize: 13 }}>
                  Lịch công việc
                </button>
                <button className={`dash-range-btn ${formMode === "reminder" ? "active" : ""}`}
                  onClick={() => setFormMode("reminder")} style={{ fontSize: 13 }}>
                  Nhắc nhở
                </button>
              </div>
            )}

            <div className="admin-dialog-body">
              {formMode === "schedule" ? (
                <>
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Ngày thực hiện *</label>
                      <input type="date" className="admin-input" value={scheduleForm.ngay_thuc_hien}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, ngay_thuc_hien: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">KTV phụ trách</label>
                      <select className="admin-input" value={scheduleForm.ktv_id || ""}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, ktv_id: e.target.value || null })}>
                        <option value="">— Chọn KTV —</option>
                        {technicians.map((t) => <option key={t.id} value={t.id}>{t.ho_ten} — {t.sdt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Giờ bắt đầu</label>
                      <input type="time" className="admin-input" value={scheduleForm.gio_bat_dau || ""}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, gio_bat_dau: e.target.value })} />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Giờ kết thúc</label>
                      <input type="time" className="admin-input" value={scheduleForm.gio_ket_thuc || ""}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, gio_ket_thuc: e.target.value })} />
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Hợp đồng</label>
                    <select className="admin-input" value={scheduleForm.contract_id || ""}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, contract_id: e.target.value || null })}>
                      <option value="">— Không liên kết HĐ —</option>
                      {contracts.map((c) => (
                        <option key={c.id} value={c.id}>{c.ma_hd} — {c.customers?.ten_kh} ({c.dich_vu})</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Địa điểm</label>
                    <input className="admin-input" value={scheduleForm.dia_diem || ""} placeholder="Địa chỉ thực hiện"
                      onChange={(e) => setScheduleForm({ ...scheduleForm, dia_diem: e.target.value })} />
                  </div>
                  {editSchedule && (
                    <div className="admin-form-group">
                      <label className="admin-label">Trạng thái</label>
                      <select className="admin-input" value={scheduleForm.trang_thai || "Chưa làm"}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, trang_thai: e.target.value })}>
                        <option>Chưa làm</option><option>Đang làm</option><option>Hoàn thành</option><option>Hủy</option>
                      </select>
                    </div>
                  )}
                  <div className="admin-form-group">
                    <label className="admin-label">Ghi chú</label>
                    <textarea className="admin-input" rows={2} value={scheduleForm.ghi_chu || ""}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, ghi_chu: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Loại *</label>
                      <select className="admin-input" value={reminderForm.loai}
                        onChange={(e) => setReminderForm({ ...reminderForm, loai: e.target.value })}>
                        {LOAI_REMINDER.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Ngày nhắc *</label>
                      <input type="date" className="admin-input" value={reminderForm.ngay_nhac}
                        onChange={(e) => setReminderForm({ ...reminderForm, ngay_nhac: e.target.value })} />
                    </div>
                  </div>
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label className="admin-label">Khách hàng</label>
                      <select className="admin-input" value={reminderForm.customer_id}
                        onChange={(e) => setReminderForm({ ...reminderForm, customer_id: e.target.value })}>
                        <option value="">— Chọn —</option>
                        {customers.map((c) => <option key={c.id} value={c.id}>{c.ma_kh} — {c.ten_kh}</option>)}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-label">Hợp đồng</label>
                      <select className="admin-input" value={reminderForm.contract_id}
                        onChange={(e) => setReminderForm({ ...reminderForm, contract_id: e.target.value })}>
                        <option value="">— Chọn —</option>
                        {contracts.filter((c) => !reminderForm.customer_id || c.customer_id === reminderForm.customer_id).map((c) => (
                          <option key={c.id} value={c.id}>{c.ma_hd} — {c.dich_vu}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Người phụ trách</label>
                    <select className="admin-input" value={reminderForm.nguoi_phu_trach}
                      onChange={(e) => setReminderForm({ ...reminderForm, nguoi_phu_trach: e.target.value })}>
                      <option value="">— Chọn —</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.ho_ten}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-label">Nội dung</label>
                    <textarea className="admin-input" rows={3} value={reminderForm.noi_dung}
                      onChange={(e) => setReminderForm({ ...reminderForm, noi_dung: e.target.value })}
                      placeholder="Nội dung nhắc nhở..." />
                  </div>
                </>
              )}
            </div>

            <div className="admin-dialog-footer">
              {editSchedule && (
                <button className="admin-btn admin-btn-outline"
                  style={{ color: "var(--danger-500)", borderColor: "var(--danger-500)", marginRight: "auto" }}
                  onClick={() => { handleDeleteSchedule(editSchedule.id); setShowForm(false); }}>
                  <Trash2 size={14} /> Xóa
                </button>
              )}
              <button className="admin-btn admin-btn-outline" onClick={() => setShowForm(false)}>Hủy</button>
              <button className="admin-btn admin-btn-primary"
                onClick={formMode === "schedule" ? handleScheduleSubmit : handleReminderSubmit}>
                {formMode === "schedule"
                  ? (editSchedule ? "Cập nhật" : "Tạo lịch")
                  : "Tạo nhắc nhở"
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
