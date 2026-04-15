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
import DateInput from "@/components/admin/DateInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Filter,
  ClipboardList,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Calendar,
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
  const [editReminder, setEditReminder] = useState<Reminder | null>(null);
  const [saving, setSaving] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<CreateScheduleInput>({
    contract_id: null, ngay_thuc_hien: "", gio_bat_dau: "08:00",
    gio_ket_thuc: "10:00", ktv_id: null, dia_diem: "", ghi_chu: "",
  });

  // Reminder form — also holds trang_thai when editing
  const [reminderForm, setReminderForm] = useState<CreateReminderInput & { trang_thai?: string }>({
    customer_id: "", contract_id: "", loai: "Hỏi thăm",
    ngay_nhac: "", noi_dung: "", nguoi_phu_trach: "",
  });

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "schedule"; id: string; label: string }
    | { type: "reminder"; id: string; label: string }
    | null
  >(null);

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
    setEditReminder(null);
    setFormMode("schedule");
    setScheduleForm({
      contract_id: null, ngay_thuc_hien: date || today,
      gio_bat_dau: "08:00", gio_ket_thuc: "10:00",
      ktv_id: null, dia_diem: "", ghi_chu: "",
    });
    setShowForm(true);
  };

  const openNewReminder = (date?: string) => {
    setEditSchedule(null);
    setEditReminder(null);
    setFormMode("reminder");
    setReminderForm({
      customer_id: "", contract_id: "", loai: "Hỏi thăm",
      ngay_nhac: date || today, noi_dung: "", nguoi_phu_trach: "",
    });
    setShowForm(true);
  };

  const openEditSchedule = (s: Schedule) => {
    setEditReminder(null);
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

  const openEditReminder = (r: Reminder) => {
    setEditSchedule(null);
    setEditReminder(r);
    setFormMode("reminder");
    setReminderForm({
      customer_id: r.customer_id || "",
      contract_id: r.contract_id || "",
      loai: r.loai,
      ngay_nhac: r.ngay_nhac,
      noi_dung: r.noi_dung || "",
      nguoi_phu_trach: r.nguoi_phu_trach || "",
      trang_thai: r.trang_thai,
    });
    setShowForm(true);
  };

  const handleEventClick = (ev: CalendarEvent) => {
    if (ev.type === "schedule") openEditSchedule(ev.raw as Schedule);
    else if (ev.type === "reminder") openEditReminder(ev.raw as Reminder);
    // visits: click is no-op — they're managed from contract detail page
  };

  // Submit handlers
  const handleScheduleSubmit = async () => {
    if (!scheduleForm.ngay_thuc_hien) { toast.error("Vui lòng chọn ngày"); return; }
    setSaving(true);
    try {
      if (editSchedule) {
        await updateSchedule(editSchedule.id, scheduleForm);
        toast.success("Đã cập nhật lịch");
      } else {
        await createSchedule(scheduleForm);
        toast.success("Đã tạo lịch");
      }
      setShowForm(false);
      await loadData();
    } catch {
      toast.error("Lỗi lưu lịch");
    } finally {
      setSaving(false);
    }
  };

  const handleReminderSubmit = async () => {
    if (!reminderForm.ngay_nhac || !reminderForm.loai) {
      toast.error("Vui lòng nhập loại và ngày nhắc");
      return;
    }
    setSaving(true);
    try {
      if (editReminder) {
        await updateReminder(editReminder.id, {
          customer_id: reminderForm.customer_id || null,
          contract_id: reminderForm.contract_id || null,
          loai: reminderForm.loai,
          ngay_nhac: reminderForm.ngay_nhac,
          noi_dung: reminderForm.noi_dung || null,
          nguoi_phu_trach: reminderForm.nguoi_phu_trach || null,
          trang_thai: reminderForm.trang_thai || "Chờ",
        });
        toast.success("Đã cập nhật nhắc nhở");
      } else {
        const payload: CreateReminderInput = {
          loai: reminderForm.loai,
          ngay_nhac: reminderForm.ngay_nhac,
        };
        if (reminderForm.customer_id) payload.customer_id = reminderForm.customer_id;
        if (reminderForm.contract_id) payload.contract_id = reminderForm.contract_id;
        if (reminderForm.noi_dung) payload.noi_dung = reminderForm.noi_dung;
        if (reminderForm.nguoi_phu_trach) payload.nguoi_phu_trach = reminderForm.nguoi_phu_trach;
        await createReminder(payload);
        toast.success("Đã tạo nhắc nhở");
      }
      setShowForm(false);
      await loadData();
    } catch {
      toast.error("Lỗi lưu nhắc nhở");
    } finally {
      setSaving(false);
    }
  };

  const handleReminderDone = async (id: string) => {
    try {
      await updateReminder(id, { trang_thai: "Đã làm" });
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, trang_thai: "Đã làm" } : r))
      );
      toast.success("Đã đánh dấu hoàn thành");
    } catch {
      toast.error("Lỗi cập nhật");
    }
  };

  const requestDelete = (target: NonNullable<typeof deleteTarget>) => {
    setDeleteTarget(target);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSchedule = () => {
    if (!editSchedule) return;
    const label = editSchedule.contracts?.customers?.ten_kh || editSchedule.dia_diem || "lịch công việc";
    // Close the edit dialog first so two Radix Dialogs don't fight
    // over focus-trap / overlay.
    setShowForm(false);
    requestDelete({ type: "schedule", id: editSchedule.id, label });
  };

  const confirmDeleteReminder = () => {
    if (!editReminder) return;
    const label = `${editReminder.loai}${editReminder.customers?.ten_kh ? ` - ${editReminder.customers.ten_kh}` : ""}`;
    setShowForm(false);
    requestDelete({ type: "reminder", id: editReminder.id, label });
  };

  const handleConfirmedDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "schedule") {
        await deleteSchedule(deleteTarget.id);
      } else {
        await deleteReminder(deleteTarget.id);
      }
      toast.success("Đã xóa");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setEditSchedule(null);
      setEditReminder(null);
      await loadData();
    } catch {
      toast.error("Lỗi xóa");
    }
  };

  // KTV colors
  const ktvColors = ["#2E7D32", "#1565C0", "#6A1B9A", "#E65100", "#C62828", "#00838F", "#4E342E", "#AD1457"];
  const ktvColorMap = new Map<string, string>();
  technicians.forEach((t, i) => ktvColorMap.set(t.id, ktvColors[i % ktvColors.length]));

  const monthName = currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  const currentMonthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const scheduleCount = calendarEvents.filter((e) => e.type === "schedule" && e.date.startsWith(currentMonthStr)).length;
  const visitCount = calendarEvents.filter((e) => e.type === "visit" && e.date.startsWith(currentMonthStr)).length;
  const reminderCount = calendarEvents.filter((e) => e.type === "reminder" && e.date.startsWith(currentMonthStr)).length;
  const overdueReminders = reminders.filter((r) => r.trang_thai === "Chờ" && r.ngay_nhac < today).length;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lịch công tác</h1>
          <p className="admin-page-subtitle">
            {scheduleCount} lịch · {visitCount} lần DV · {reminderCount} nhắc nhở
            {overdueReminders > 0 && (
              <span style={{ color: "#DC2626", fontWeight: 600 }}>
                {" "}· {overdueReminders} quá hạn
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" onClick={() => openNewReminder()}>
            <Bell size={16} /> Nhắc nhở
          </Button>
          <Button className="btn-add" onClick={() => openNewSchedule()}>
            <Plus size={16} /> Thêm lịch
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="calendar-controls">
        <div className="calendar-nav">
          <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft size={18} />
          </Button>
          <h2 className="calendar-month-title">{monthName}</h2>
          <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
            <ChevronRight size={18} />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Hôm nay
          </Button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(
              [
                ["all", "Tất cả"],
                ["schedule", "Lịch"],
                ["visit", "Lần DV"],
                ["reminder", "Nhắc"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={filterType === key ? "default" : "outline"}
                onClick={() => setFilterType(key)}
              >
                {label}
              </Button>
            ))}
          </div>
          <Filter size={16} style={{ color: "var(--neutral-400)" }} />
          <select
            className="native-select"
            style={{ width: 180 }}
            value={filterKtv}
            onChange={(e) => setFilterKtv(e.target.value)}
          >
            <option value="">Tất cả KTV</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ho_ten}
              </option>
            ))}
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
                            <CheckCircle2 size={12} style={{ color: "#10B981" }} />
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
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              {formMode === "schedule" ? (
                <Calendar size={20} style={{ color: "#2E7D32" }} />
              ) : (
                <Bell size={20} style={{ color: "#F59E0B" }} />
              )}
              {formMode === "schedule"
                ? editSchedule
                  ? "Cập nhật lịch"
                  : "Tạo lịch công việc"
                : editReminder
                ? "Cập nhật nhắc nhở"
                : "Tạo nhắc nhở"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "schedule"
                ? "Gán kỹ thuật viên, thời gian và địa điểm thực hiện."
                : "Chọn loại, ngày nhắc và nội dung cần theo dõi."}
            </DialogDescription>
          </DialogHeader>

          {/* Mode toggle — only when creating new (not editing) */}
          {!editSchedule && !editReminder && (
            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "12px 28px 0",
              }}
            >
              <Button
                size="sm"
                variant={formMode === "schedule" ? "default" : "outline"}
                onClick={() => setFormMode("schedule")}
                style={{ flex: 1 }}
              >
                <Calendar size={14} /> Lịch công việc
              </Button>
              <Button
                size="sm"
                variant={formMode === "reminder" ? "default" : "outline"}
                onClick={() => setFormMode("reminder")}
                style={{ flex: 1 }}
              >
                <Bell size={14} /> Nhắc nhở
              </Button>
            </div>
          )}

          {formMode === "schedule" ? (
            <>
              <div className="form-grid">
                <div className="form-field">
                  <Label>
                    Ngày thực hiện <span style={{ color: "#DC2626" }}>*</span>
                  </Label>
                  <DateInput
                    value={scheduleForm.ngay_thuc_hien}
                    onChange={(v) =>
                      setScheduleForm({ ...scheduleForm, ngay_thuc_hien: v })
                    }
                  />
                </div>
                <div className="form-field">
                  <Label>KTV phụ trách</Label>
                  <select
                    className="native-select"
                    value={scheduleForm.ktv_id || ""}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        ktv_id: e.target.value || null,
                      })
                    }
                  >
                    <option value="">— Chọn KTV —</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.ho_ten} — {t.sdt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <Label>Giờ bắt đầu</Label>
                  <Input
                    type="time"
                    value={scheduleForm.gio_bat_dau || ""}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        gio_bat_dau: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-field">
                  <Label>Giờ kết thúc</Label>
                  <Input
                    type="time"
                    value={scheduleForm.gio_ket_thuc || ""}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        gio_ket_thuc: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-field full-width">
                  <Label>Hợp đồng</Label>
                  <select
                    className="native-select"
                    value={scheduleForm.contract_id || ""}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        contract_id: e.target.value || null,
                      })
                    }
                  >
                    <option value="">— Không liên kết HĐ —</option>
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ma_hd} — {c.customers?.ten_kh} ({c.dich_vu})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field full-width">
                  <Label>Địa điểm</Label>
                  <Input
                    placeholder="Địa chỉ thực hiện"
                    value={scheduleForm.dia_diem || ""}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        dia_diem: e.target.value,
                      })
                    }
                  />
                </div>
                {editSchedule && (
                  <div className="form-field">
                    <Label>Trạng thái</Label>
                    <select
                      className="native-select"
                      value={scheduleForm.trang_thai || "Chưa làm"}
                      onChange={(e) =>
                        setScheduleForm({
                          ...scheduleForm,
                          trang_thai: e.target.value,
                        })
                      }
                    >
                      <option>Chưa làm</option>
                      <option>Đang làm</option>
                      <option>Hoàn thành</option>
                      <option>Hủy</option>
                    </select>
                  </div>
                )}
                <div className="form-field full-width">
                  <Label>Ghi chú</Label>
                  <Textarea
                    rows={2}
                    placeholder="Ghi chú thêm..."
                    value={scheduleForm.ghi_chu || ""}
                    onChange={(e) =>
                      setScheduleForm({
                        ...scheduleForm,
                        ghi_chu: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-actions">
                {editSchedule && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={confirmDeleteSchedule}
                    style={{ marginRight: "auto" }}
                  >
                    <Trash2 size={16} /> Xóa lịch
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={handleScheduleSubmit}
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : editSchedule
                    ? "Cập nhật"
                    : "Tạo lịch"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="form-grid">
                <div className="form-field">
                  <Label>
                    Loại nhắc <span style={{ color: "#DC2626" }}>*</span>
                  </Label>
                  <select
                    className="native-select"
                    value={reminderForm.loai}
                    onChange={(e) =>
                      setReminderForm({ ...reminderForm, loai: e.target.value })
                    }
                  >
                    {LOAI_REMINDER.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <Label>
                    Ngày nhắc <span style={{ color: "#DC2626" }}>*</span>
                  </Label>
                  <DateInput
                    value={reminderForm.ngay_nhac}
                    onChange={(v) =>
                      setReminderForm({ ...reminderForm, ngay_nhac: v })
                    }
                  />
                </div>
                <div className="form-field">
                  <Label>Khách hàng</Label>
                  <select
                    className="native-select"
                    value={reminderForm.customer_id || ""}
                    onChange={(e) =>
                      setReminderForm({
                        ...reminderForm,
                        customer_id: e.target.value,
                        contract_id: "",
                      })
                    }
                  >
                    <option value="">— Không chọn —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ma_kh} — {c.ten_kh}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <Label>Hợp đồng</Label>
                  <select
                    className="native-select"
                    value={reminderForm.contract_id || ""}
                    onChange={(e) =>
                      setReminderForm({
                        ...reminderForm,
                        contract_id: e.target.value,
                      })
                    }
                  >
                    <option value="">— Không chọn —</option>
                    {contracts
                      .filter(
                        (c) =>
                          !reminderForm.customer_id ||
                          c.customer_id === reminderForm.customer_id
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.ma_hd} — {c.dich_vu}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-field">
                  <Label>Người phụ trách</Label>
                  <select
                    className="native-select"
                    value={reminderForm.nguoi_phu_trach || ""}
                    onChange={(e) =>
                      setReminderForm({
                        ...reminderForm,
                        nguoi_phu_trach: e.target.value,
                      })
                    }
                  >
                    <option value="">— Không chọn —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.ho_ten}
                      </option>
                    ))}
                  </select>
                </div>
                {editReminder && (
                  <div className="form-field">
                    <Label>Trạng thái</Label>
                    <select
                      className="native-select"
                      value={reminderForm.trang_thai || "Chờ"}
                      onChange={(e) =>
                        setReminderForm({
                          ...reminderForm,
                          trang_thai: e.target.value,
                        })
                      }
                    >
                      <option value="Chờ">Chờ</option>
                      <option value="Đã làm">Đã làm</option>
                      <option value="Bỏ qua">Bỏ qua</option>
                    </select>
                  </div>
                )}
                <div className="form-field full-width">
                  <Label>Nội dung</Label>
                  <Textarea
                    rows={3}
                    placeholder="Mô tả nội dung nhắc nhở..."
                    value={reminderForm.noi_dung || ""}
                    onChange={(e) =>
                      setReminderForm({
                        ...reminderForm,
                        noi_dung: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-actions">
                {editReminder && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={confirmDeleteReminder}
                    style={{ marginRight: "auto" }}
                  >
                    <Trash2 size={16} /> Xóa nhắc
                  </Button>
                )}
                {editReminder && editReminder.trang_thai === "Chờ" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleReminderDone(editReminder.id);
                      setShowForm(false);
                    }}
                    style={{ color: "#047857", borderColor: "#A7F3D0" }}
                  >
                    <CheckCircle2 size={16} /> Đã làm
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={handleReminderSubmit}
                  disabled={saving}
                >
                  {saving
                    ? "Đang lưu..."
                    : editReminder
                    ? "Cập nhật"
                    : "Tạo nhắc nhở"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <AlertTriangle size={20} style={{ color: "#DC2626" }} />
              Xác nhận xóa
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa{" "}
              {deleteTarget?.type === "schedule" ? "lịch" : "nhắc nhở"}{" "}
              <strong>{deleteTarget?.label}</strong>? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="form-actions">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmedDelete}>
              <Trash2 size={16} /> Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
