"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchActivityLogs, type ActivityLog } from "@/lib/api/activityLog.api";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import {
  Users,
  FileText,
  History,
  MessageSquare,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

interface DashboardStats {
  customers: number;
  activeContracts: number;
  newRequestsThisMonth: number;
  revenueThisMonth: number;
}

interface ContractExpiring {
  id: string;
  ma_hd: string;
  ten_kh: string;
  ngay_ket_thuc: string;
  dich_vu: string;
}

interface PendingRequest {
  id: string;
  ma_yc: string;
  ten_kh: string;
  loai_con_trung: string | null;
  created_at: string;
}

const PIE_COLORS = ["#6B7280", "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#2E7D32", "#059669", "#EF4444"];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    activeContracts: 0,
    newRequestsThisMonth: 0,
    revenueThisMonth: 0,
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [conversionData, setConversionData] = useState<{ name: string; value: number }[]>([]);
  const [topServices, setTopServices] = useState<{ name: string; count: number }[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<ContractExpiring[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const supabase = createClient();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const in30Days = new Date(now.getTime() + 30 * 86400000).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];

    try {
      const [
        customersRes,
        activeContractsRes,
        newRequestsRes,
        revenueRes,
        logsRes,
        allContractsRes,
        requestsStatusRes,
        requestsByServiceRes,
        expiringRes,
        pendingRes,
      ] = await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("contracts").select("*", { count: "exact", head: true }).eq("trang_thai", "Đang thực hiện"),
        supabase.from("service_requests").select("*", { count: "exact", head: true }).gte("created_at", startOfMonth),
        supabase.from("payments").select("so_tien").gte("ngay_tt", startOfMonth.split("T")[0]),
        fetchActivityLogs(10),
        // For revenue chart - all payments
        supabase.from("payments").select("so_tien, ngay_tt").order("ngay_tt", { ascending: true }),
        // For conversion pie - all requests by status
        supabase.from("service_requests").select("trang_thai"),
        // For top services
        supabase.from("service_requests").select("loai_con_trung"),
        // Expiring contracts
        supabase.from("contracts")
          .select("id, ma_hd, ngay_ket_thuc, dich_vu, customer_id, customers(ten_kh)")
          .gte("ngay_ket_thuc", today)
          .lte("ngay_ket_thuc", in30Days)
          .order("ngay_ket_thuc", { ascending: true })
          .limit(5),
        // Pending requests
        supabase.from("service_requests")
          .select("id, ma_yc, ten_kh, loai_con_trung, created_at")
          .eq("trang_thai", "Mới")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      // Stats
      const monthRevenue = (revenueRes.data ?? []).reduce((s, p) => s + (p.so_tien || 0), 0);
      setStats({
        customers: customersRes.count ?? 0,
        activeContracts: activeContractsRes.count ?? 0,
        newRequestsThisMonth: newRequestsRes.count ?? 0,
        revenueThisMonth: monthRevenue,
      });

      setActivities(logsRes);

      // Revenue chart - last 6 months
      const monthlyRevenue = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        monthlyRevenue.set(key, 0);
      }
      for (const p of allContractsRes.data ?? []) {
        if (!p.ngay_tt) continue;
        const d = new Date(p.ngay_tt);
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        if (monthlyRevenue.has(key)) {
          monthlyRevenue.set(key, (monthlyRevenue.get(key) || 0) + (p.so_tien || 0));
        }
      }
      setRevenueData(
        Array.from(monthlyRevenue.entries()).map(([month, revenue]) => ({
          month,
          revenue,
        }))
      );

      // Conversion pie
      const statusCounts = new Map<string, number>();
      for (const r of requestsStatusRes.data ?? []) {
        statusCounts.set(r.trang_thai, (statusCounts.get(r.trang_thai) || 0) + 1);
      }
      setConversionData(
        Array.from(statusCounts.entries()).map(([name, value]) => ({ name, value }))
      );

      // Top services
      const serviceCounts = new Map<string, number>();
      for (const r of requestsByServiceRes.data ?? []) {
        if (r.loai_con_trung) {
          serviceCounts.set(r.loai_con_trung, (serviceCounts.get(r.loai_con_trung) || 0) + 1);
        }
      }
      setTopServices(
        Array.from(serviceCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }))
      );

      // Expiring contracts
      setExpiringContracts(
        (expiringRes.data ?? []).map((c: Record<string, unknown>) => ({
          id: c.id as string,
          ma_hd: c.ma_hd as string,
          ten_kh: (c.customers as { ten_kh: string })?.ten_kh ?? "",
          ngay_ket_thuc: c.ngay_ket_thuc as string,
          dich_vu: c.dich_vu as string,
        }))
      );

      setPendingRequests((pendingRes.data ?? []) as PendingRequest[]);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return "Vừa xong";
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return formatDate(dateStr);
  };

  const cards = [
    { icon: Users, color: "green", value: stats.customers, label: "Tổng khách hàng" },
    { icon: FileText, color: "blue", value: stats.activeContracts, label: "HĐ đang chạy" },
    { icon: MessageSquare, color: "amber", value: stats.newRequestsThisMonth, label: "Yêu cầu tháng này" },
    { icon: DollarSign, color: "green", value: `${(stats.revenueThisMonth / 1000000).toFixed(1)}tr`, label: "Doanh thu tháng" },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tổng quan</h1>
          <p className="admin-page-subtitle">Dashboard quản trị GreenShield CRM</p>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Charts Row */}
      <div className="dashboard-charts-row">
        {/* Revenue Chart */}
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-title">
            <TrendingUp size={18} /> Doanh thu 6 tháng
          </div>
          {!loading && (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString("vi-VN")}đ`, "Doanh thu"]} />
                <Line type="monotone" dataKey="revenue" stroke="#2E7D32" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Conversion Pie */}
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-title">Tỷ lệ chuyển đổi yêu cầu</div>
          {!loading && conversionData.length > 0 && (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {conversionData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Services Bar Chart */}
      {topServices.length > 0 && (
        <div className="dashboard-chart-card" style={{ marginBottom: 24 }}>
          <div className="dashboard-chart-title">Top 5 dịch vụ được đặt nhiều nhất</div>
          {!loading && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topServices} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#2E7D32" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Bottom Row: Expiring + Pending + Activity */}
      <div className="dashboard-bottom-row">
        {/* Expiring Contracts */}
        <div className="dashboard-widget">
          <div className="dashboard-widget-header">
            <AlertTriangle size={16} style={{ color: "var(--accent-600)" }} />
            <span>HĐ sắp hết hạn (30 ngày)</span>
          </div>
          {expiringContracts.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <p style={{ fontSize: 13 }}>Không có HĐ sắp hết hạn</p>
            </div>
          ) : (
            <div className="dashboard-widget-list">
              {expiringContracts.map((c) => (
                <div key={c.id} className="dashboard-widget-item">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.ten_kh}</div>
                    <div style={{ fontSize: 12, color: "var(--neutral-500)" }}>
                      {c.ma_hd} · {c.dich_vu}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--danger-500)", fontWeight: 600 }}>
                    {formatDate(c.ngay_ket_thuc)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        <div className="dashboard-widget">
          <div className="dashboard-widget-header">
            <MessageSquare size={16} style={{ color: "var(--danger-500)" }} />
            <span>Yêu cầu mới chưa xử lý</span>
            <Link href="/admin/yeu-cau" className="dashboard-widget-link">
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <p style={{ fontSize: 13 }}>Không có yêu cầu mới</p>
            </div>
          ) : (
            <div className="dashboard-widget-list">
              {pendingRequests.map((r) => (
                <div key={r.id} className="dashboard-widget-item">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.ten_kh}</div>
                    <div style={{ fontSize: 12, color: "var(--neutral-500)" }}>
                      {r.ma_yc} · {r.loai_con_trung || "Chung"}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--neutral-400)" }}>
                    {formatTime(r.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="dashboard-widget">
          <div className="dashboard-widget-header">
            <History size={16} />
            <span>Hoạt động gần đây</span>
          </div>
          {loading ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <p style={{ fontSize: 13 }}>Đang tải...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <p style={{ fontSize: 13 }}>Chưa có hoạt động</p>
            </div>
          ) : (
            <div className="dashboard-widget-list">
              {activities.map((a) => (
                <div key={a.id} className="activity-item" style={{ padding: "8px 0" }}>
                  <div className="activity-dot" />
                  <div className="activity-text" style={{ fontSize: 13 }}>
                    <strong>{a.email?.split("@")[0]}</strong> — {a.hanh_dong}
                    {a.chi_tiet && (
                      <span style={{ color: "var(--neutral-400)" }}> ({a.chi_tiet})</span>
                    )}
                  </div>
                  <div className="activity-time" style={{ fontSize: 11 }}>
                    {formatTime(a.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
