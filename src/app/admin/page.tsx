"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchActivityLogs, type ActivityLog } from "@/lib/api/activityLog.api";
import {
  Users,
  FileText,
  History,
  MessageSquare,
} from "lucide-react";

interface DashboardStats {
  customers: number;
  contracts: number;
  serviceHistory: number;
  pendingRequests: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    contracts: 0,
    serviceHistory: 0,
    pendingRequests: 0,
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const [customers, contracts, serviceHistory, pendingRequests, logs] =
        await Promise.all([
          supabase
            .from("customers")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("contracts")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("service_history")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("service_requests")
            .select("*", { count: "exact", head: true })
            .eq("trang_thai", "Mới"),
          fetchActivityLogs(10),
        ]);

      setStats({
        customers: customers.count ?? 0,
        contracts: contracts.count ?? 0,
        serviceHistory: serviceHistory.count ?? 0,
        pendingRequests: pendingRequests.count ?? 0,
      });
      setActivities(logs);
      setLoading(false);
    }

    loadData();
  }, []);

  const cards = [
    {
      icon: Users,
      color: "green",
      value: stats.customers,
      label: "Khách hàng",
    },
    {
      icon: FileText,
      color: "blue",
      value: stats.contracts,
      label: "Hợp đồng",
    },
    {
      icon: History,
      color: "amber",
      value: stats.serviceHistory,
      label: "Lịch sử dịch vụ",
    },
    {
      icon: MessageSquare,
      color: "red",
      value: stats.pendingRequests,
      label: "Yêu cầu mới",
    },
  ];

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return "Vừa xong";
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return d.toLocaleDateString("vi-VN");
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tổng quan</h1>
          <p className="admin-page-subtitle">
            Dashboard quản trị GreenShield CRM
          </p>
        </div>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <div key={card.label} className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <div className="dashboard-card-value">
                  {loading ? "—" : card.value}
                </div>
                <div className="dashboard-card-label">{card.label}</div>
              </div>
              <div className={`dashboard-card-icon ${card.color}`}>
                <card.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="activity-list">
        <div className="activity-header">Hoạt động gần đây</div>
        {loading ? (
          <div className="empty-state">
            <p>Đang tải...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <p>Chưa có hoạt động nào</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-dot" />
              <div className="activity-text">
                <strong>{activity.email}</strong> — {activity.hanh_dong}
                {activity.chi_tiet && (
                  <span style={{ color: "var(--neutral-400)" }}>
                    {" "}
                    ({activity.chi_tiet})
                  </span>
                )}
              </div>
              <div className="activity-time">
                {formatTime(activity.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
