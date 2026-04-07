"use client";

import { useEffect, useState } from "react";
import { fetchCareTasks, updateCareTask, type CareTask } from "@/lib/api/careTasks.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { Heart, CheckCircle, Phone } from "lucide-react";

const LOAI_COLORS: Record<string, string> = {
  "Bảo hành": "blue",
  "Tái ký": "green",
  "Hỏi thăm": "amber",
  "Khác": "gray",
};

export default function MyCareTasksPage() {
  const { user } = useCurrentUser();
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "done" | "all">("pending");

  useEffect(() => {
    if (!user) return;
    fetchCareTasks({ nguoi_phu_trach: user.id })
      .then(setTasks)
      .catch(() => toast.error("Lỗi tải"))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return t.trang_thai === "Chờ" || t.trang_thai === "Quá hạn";
    if (filter === "done") return t.trang_thai === "Đã làm";
    return true;
  });

  const handleComplete = async (t: CareTask) => {
    try {
      await updateCareTask(t.id, {
        trang_thai: "Đã làm",
        completed_at: new Date().toISOString(),
      });
      setTasks((prev) =>
        prev.map((item) =>
          item.id === t.id ? { ...item, trang_thai: "Đã làm", completed_at: new Date().toISOString() } : item
        )
      );
      toast.success("Đã hoàn thành");
    } catch {
      toast.error("Lỗi");
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Task của tôi</h1>
          <p className="admin-page-subtitle">Các task chăm sóc được phân công</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div style={{ display: "flex", gap: 8 }}>
          {(["pending", "all", "done"] as const).map((f) => (
            <button
              key={f}
              className={`admin-btn ${filter === f ? "admin-btn-primary" : "admin-btn-outline"}`}
              onClick={() => setFilter(f)}
            >
              {f === "pending" ? "Cần làm" : f === "done" ? "Đã làm" : "Tất cả"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Đang tải...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Heart size={48} strokeWidth={1} />
          <p>Không có task nào</p>
        </div>
      ) : (
        <div className="my-schedule-list">
          {filtered.map((t) => (
            <div key={t.id} className={`my-schedule-card ${t.trang_thai === "Đã làm" ? "done" : ""}`}>
              <div className="my-schedule-date">
                <span className={`admin-badge ${LOAI_COLORS[t.loai] || "gray"}`}>{t.loai}</span>
                <span style={{ marginLeft: 8 }}>{formatDate(t.ngay_hen)}</span>
                {t.trang_thai === "Quá hạn" && (
                  <span className="admin-badge red" style={{ marginLeft: 8 }}>Quá hạn</span>
                )}
              </div>
              <div className="my-schedule-info">
                <div className="my-schedule-customer">{t.customers?.ten_kh}</div>
                {t.customers?.sdt && (
                  <div className="my-schedule-location">
                    <Phone size={12} /> {t.customers.sdt}
                  </div>
                )}
                {t.noi_dung && (
                  <div style={{ fontSize: 13, color: "var(--neutral-600)", marginTop: 4 }}>
                    {t.noi_dung}
                  </div>
                )}
                {t.contracts?.ma_hd && (
                  <div style={{ fontSize: 12, color: "var(--neutral-400)", marginTop: 2 }}>
                    HĐ: {t.contracts.ma_hd}
                  </div>
                )}
              </div>
              <div className="my-schedule-actions">
                {(t.trang_thai === "Chờ" || t.trang_thai === "Quá hạn") && (
                  <button className="admin-btn admin-btn-primary" onClick={() => handleComplete(t)}>
                    <CheckCircle size={14} /> Hoàn thành
                  </button>
                )}
                {t.trang_thai === "Đã làm" && (
                  <span className="admin-badge green">Đã xong</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
