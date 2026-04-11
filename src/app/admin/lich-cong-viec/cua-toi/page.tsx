"use client";

import { useEffect, useState } from "react";
import { fetchSchedules, updateSchedule, type Schedule } from "@/lib/api/schedules.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function MySchedulePage() {
  const { user } = useCurrentUser();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("pending");

  useEffect(() => {
    if (!user) return;
    fetchSchedules({ ktv_id: user.id })
      .then(setSchedules)
      .catch(() => toast.error("Lỗi tải lịch"))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = schedules.filter((s) => {
    if (filter === "pending") return s.trang_thai === "Chưa làm" || s.trang_thai === "Đang làm";
    if (filter === "done") return s.trang_thai === "Hoàn thành";
    return true;
  });

  const handleComplete = async (s: Schedule) => {
    try {
      await updateSchedule(s.id, { trang_thai: "Hoàn thành" });
      setSchedules((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, trang_thai: "Hoàn thành" } : item))
      );
      toast.success("Đã hoàn thành");
    } catch {
      toast.error("Lỗi cập nhật");
    }
  };

  const handleStart = async (s: Schedule) => {
    try {
      await updateSchedule(s.id, {
        trang_thai: "Đang làm",
      });
      setSchedules((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, trang_thai: "Đang làm" } : item))
      );
      toast.success("Bắt đầu công việc");
    } catch {
      toast.error("Lỗi cập nhật");
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lịch của tôi</h1>
          <p className="admin-page-subtitle">Lịch công việc được phân công</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["pending", "all", "done"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "pending" ? "Chưa xong" : f === "done" ? "Đã xong" : "Tất cả"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><p>Đang tải...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} strokeWidth={1} />
          <p>Không có lịch nào</p>
        </div>
      ) : (
        <div className="my-schedule-list">
          {filtered.map((s) => (
            <div key={s.id} className={`my-schedule-card ${s.trang_thai === "Hoàn thành" ? "done" : ""}`}>
              <div className="my-schedule-date">
                <Calendar size={14} />
                {formatDate(s.ngay_thuc_hien)}
                {s.gio_bat_dau && (
                  <span style={{ marginLeft: 8 }}>
                    <Clock size={14} /> {s.gio_bat_dau.slice(0, 5)}
                    {s.gio_ket_thuc && ` — ${s.gio_ket_thuc.slice(0, 5)}`}
                  </span>
                )}
              </div>
              <div className="my-schedule-info">
                <div className="my-schedule-customer">
                  {s.contracts?.customers?.ten_kh || "—"}
                </div>
                <div className="my-schedule-contract">
                  {s.contracts?.ma_hd} · {s.contracts?.dich_vu}
                </div>
                {s.dia_diem && (
                  <div className="my-schedule-location">
                    <MapPin size={12} /> {s.dia_diem}
                  </div>
                )}
                {s.ghi_chu && (
                  <div style={{ fontSize: 12, color: "var(--neutral-500)", marginTop: 4 }}>
                    {s.ghi_chu}
                  </div>
                )}
              </div>
              <div className="my-schedule-actions">
                {s.trang_thai === "Chưa làm" && (
                  <Button size="sm" variant="outline" onClick={() => handleStart(s)}>
                    <AlertCircle size={14} /> Bắt đầu
                  </Button>
                )}
                {s.trang_thai === "Đang làm" && (
                  <Button size="sm" onClick={() => handleComplete(s)}>
                    <CheckCircle2 size={14} /> Hoàn thành
                  </Button>
                )}
                {s.trang_thai === "Hoàn thành" && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 999,
                      background: "#ECFDF5",
                      color: "#047857",
                      border: "1px solid #A7F3D0",
                    }}
                  >
                    Đã xong
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
