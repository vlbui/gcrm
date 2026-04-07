"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchActivityLogs, type ActivityLog } from "@/lib/api/activityLog.api";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import {
  Users,
  DollarSign,
  MessageSquare,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  AlertTriangle,
  Calendar,
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

const PIE_COLORS = ["#6B7280", "#3B82F6", "#F59E0B", "#10B981", "#2E7D32", "#059669", "#8B5CF6"];
const RANGES = [
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
  { key: "quarter", label: "Quý" },
  { key: "year", label: "Năm" },
];

function getDateRange(range: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  let from = new Date();
  if (range === "7d") from.setDate(from.getDate() - 7);
  else if (range === "30d") from.setDate(from.getDate() - 30);
  else if (range === "quarter") from.setMonth(from.getMonth() - 3);
  else from.setFullYear(from.getFullYear() - 1);
  return { from: from.toISOString(), to };
}

function getPrevRange(range: string): { from: string; to: string } {
  const now = new Date();
  let days = 7;
  if (range === "30d") days = 30;
  else if (range === "quarter") days = 90;
  else if (range === "year") days = 365;
  const to = new Date(now.getTime() - days * 86400000).toISOString();
  const from = new Date(now.getTime() - 2 * days * 86400000).toISOString();
  return { from, to };
}

interface Stats {
  totalCustomers: number;
  prevCustomers: number;
  revenue: number;
  prevRevenue: number;
  newDeals: number;
  prevNewDeals: number;
  conversionRate: number;
}

export default function DashboardPage() {
  const [range, setRange] = useState("30d");
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0, prevCustomers: 0,
    revenue: 0, prevRevenue: 0,
    newDeals: 0, prevNewDeals: 0,
    conversionRate: 0,
  });
  const [pipelineData, setPipelineData] = useState<{ name: string; value: number }[]>([]);
  const [revenueChart, setRevenueChart] = useState<{ month: string; revenue: number }[]>([]);
  const [newRequests, setNewRequests] = useState<{ id: string; ma_deal: string; ten_kh: string; sdt: string; created_at: string }[]>([]);
  const [expiringDeals, setExpiringDeals] = useState<{ id: string; ma_deal: string; ten_kh: string; ngay_hen: string }[]>([]);
  const [topKTV, setTopKTV] = useState<{ name: string; count: number }[]>([]);
  const [topServices, setTopServices] = useState<{ name: string; count: number }[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, [range]);

  async function loadDashboard() {
    const supabase = createClient();
    const { from, to } = getDateRange(range);
    const prev = getPrevRange(range);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().split("T")[0];

    try {
      const [
        dealsRes,
        prevDealsRes,
        customersRes,
        prevCustomersRes,
        allDealsRes,
        newReqRes,
        expiringRes,
        logsRes,
        ktvRes,
      ] = await Promise.all([
        supabase.from("deals").select("giai_doan, gia_tri, thanh_toan, loai_con_trung, created_at").gte("created_at", from).lte("created_at", to),
        supabase.from("deals").select("giai_doan, gia_tri, thanh_toan, created_at").gte("created_at", prev.from).lte("created_at", prev.to),
        supabase.from("deals").select("*", { count: "exact", head: true }).gte("created_at", from),
        supabase.from("deals").select("*", { count: "exact", head: true }).gte("created_at", prev.from).lte("created_at", prev.to),
        supabase.from("deals").select("giai_doan, gia_tri, thanh_toan, created_at").order("created_at"),
        supabase.from("deals").select("id, ma_deal, ten_kh, sdt, created_at").in("giai_doan", ["Khách hỏi", "Tư vấn"]).order("created_at", { ascending: false }).limit(5),
        supabase.from("deals").select("id, ma_deal, ten_kh, ngay_hen").gte("ngay_hen", today).lte("ngay_hen", in30).order("ngay_hen").limit(5),
        fetchActivityLogs(10),
        supabase.from("deals").select("ktv_phu_trach").gte("created_at", from),
      ]);

      const deals = dealsRes.data ?? [];
      const prevDeals = prevDealsRes.data ?? [];

      // Revenue
      const calcRevenue = (items: { thanh_toan: PaymentLike[] }[]) =>
        items.reduce((s, d) => s + ((d.thanh_toan || []) as { so_tien: number }[]).reduce((ss, p) => ss + (p.so_tien || 0), 0), 0);

      type PaymentLike = { so_tien: number };
      const revenue = calcRevenue(deals as { thanh_toan: PaymentLike[] }[]);
      const prevRevenue = calcRevenue(prevDeals as { thanh_toan: PaymentLike[] }[]);

      // New deals
      const newDeals = deals.filter((d) => ["Khách hỏi", "Tư vấn"].includes(d.giai_doan)).length;
      const prevNewDeals = prevDeals.filter((d) => ["Khách hỏi", "Tư vấn"].includes(d.giai_doan)).length;

      // Conversion rate
      const total = deals.length;
      const converted = deals.filter((d) => ["Chốt", "Triển khai", "Hoàn thành"].includes(d.giai_doan)).length;
      const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

      setStats({
        totalCustomers: customersRes.count ?? 0,
        prevCustomers: prevCustomersRes.count ?? 0,
        revenue,
        prevRevenue,
        newDeals,
        prevNewDeals,
        conversionRate,
      });

      // Pipeline pie
      const stageCounts = new Map<string, number>();
      for (const d of deals) stageCounts.set(d.giai_doan, (stageCounts.get(d.giai_doan) || 0) + 1);
      setPipelineData(Array.from(stageCounts.entries()).map(([name, value]) => ({ name, value })));

      // Revenue chart - 6 months
      const monthly = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthly.set(`T${dt.getMonth() + 1}`, 0);
      }
      for (const d of allDealsRes.data ?? []) {
        const payments = (d.thanh_toan || []) as { so_tien: number; ngay_tt: string }[];
        for (const p of payments) {
          if (!p.ngay_tt) continue;
          const dt = new Date(p.ngay_tt);
          const key = `T${dt.getMonth() + 1}`;
          if (monthly.has(key)) monthly.set(key, (monthly.get(key) || 0) + (p.so_tien || 0));
        }
      }
      setRevenueChart(Array.from(monthly.entries()).map(([month, rev]) => ({ month, revenue: rev })));

      // Top services
      const svcCounts = new Map<string, number>();
      for (const d of deals) {
        for (const t of (d.loai_con_trung || [])) {
          svcCounts.set(t, (svcCounts.get(t) || 0) + 1);
        }
      }
      setTopServices(
        Array.from(svcCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))
      );

      // Top KTV
      const ktvCounts = new Map<string, number>();
      for (const d of ktvRes.data ?? []) {
        for (const kid of (d.ktv_phu_trach || [])) {
          ktvCounts.set(kid, (ktvCounts.get(kid) || 0) + 1);
        }
      }
      // Resolve names
      const ktvIds = Array.from(ktvCounts.keys());
      if (ktvIds.length > 0) {
        const { data: ktvNames } = await supabase.from("technicians").select("id, ho_ten").in("id", ktvIds);
        const nameMap = new Map((ktvNames ?? []).map((k) => [k.id, k.ho_ten]));
        setTopKTV(
          Array.from(ktvCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, count]) => ({ name: nameMap.get(id) || "—", count }))
        );
      }

      setNewRequests((newReqRes.data ?? []) as typeof newRequests);
      setExpiringDeals((expiringRes.data ?? []) as typeof expiringDeals);
      setActivities(logsRes);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return "Vừa xong";
    if (diff < 60) return `${diff}p`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return formatDate(dateStr);
  };

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const kpiCards = [
    { label: "Deal mới", value: stats.totalCustomers, prev: stats.prevCustomers, icon: Users, color: "#2E7D32" },
    { label: "Doanh thu", value: stats.revenue, prev: stats.prevRevenue, icon: DollarSign, color: "#1565C0", format: "money" },
    { label: "Yêu cầu", value: stats.newDeals, prev: stats.prevNewDeals, icon: MessageSquare, color: "#E65100" },
    { label: "Chuyển đổi", value: stats.conversionRate, prev: 0, icon: TrendingUp, color: "#6A1B9A", suffix: "%" },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">Tổng quan GreenShield CRM</p>
        </div>
        <div className="dash-range">
          {RANGES.map((r) => (
            <button key={r.key} className={`dash-range-btn ${range === r.key ? "active" : ""}`} onClick={() => setRange(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dash-kpi-grid">
        {kpiCards.map((kpi) => {
          const pct = kpi.suffix ? 0 : pctChange(kpi.value, kpi.prev);
          const isUp = pct > 0;
          return (
            <div key={kpi.label} className="dash-kpi-card">
              <div className="dash-kpi-icon" style={{ background: kpi.color + "15", color: kpi.color }}>
                <kpi.icon size={20} />
              </div>
              <div className="dash-kpi-value">
                {loading ? "—" : kpi.format === "money"
                  ? `${(kpi.value / 1000000).toFixed(1)}tr`
                  : `${kpi.value}${kpi.suffix || ""}`
                }
              </div>
              <div className="dash-kpi-label">{kpi.label}</div>
              {!kpi.suffix && pct !== 0 && (
                <div className={`dash-kpi-change ${isUp ? "up" : "down"}`}>
                  {isUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {Math.abs(pct)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="dash-charts-row">
        <div className="dash-chart-card">
          <h3 className="dash-card-title">Doanh thu 6 tháng</h3>
          {!loading && (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString("vi-VN")}đ`, "Doanh thu"]} />
                <Line type="monotone" dataKey="revenue" stroke="#2E7D32" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="dash-chart-card">
          <h3 className="dash-card-title">Phân bổ pipeline</h3>
          {!loading && pipelineData.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {pipelineData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick lists */}
      <div className="dash-lists-row">
        <div className="dash-list-card">
          <div className="dash-list-header">
            <MessageSquare size={16} style={{ color: "#E65100" }} />
            <span>Yêu cầu mới</span>
            <Link href="/admin/pipeline" className="dash-list-link">Xem tất cả <ArrowRight size={12} /></Link>
          </div>
          {newRequests.length === 0 ? <p className="dash-empty">Không có</p> : (
            <div className="dash-list-items">
              {newRequests.map((r) => (
                <div key={r.id} className="dash-list-item">
                  <div>
                    <strong>{r.ten_kh}</strong>
                    <span className="dash-list-sub">{r.ma_deal} · {r.sdt}</span>
                  </div>
                  <span className="dash-list-time">{formatTime(r.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="dash-list-card">
          <div className="dash-list-header">
            <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
            <span>Deal sắp đến hạn</span>
          </div>
          {expiringDeals.length === 0 ? <p className="dash-empty">Không có</p> : (
            <div className="dash-list-items">
              {expiringDeals.map((d) => (
                <div key={d.id} className="dash-list-item">
                  <div>
                    <strong>{d.ten_kh}</strong>
                    <span className="dash-list-sub">{d.ma_deal}</span>
                  </div>
                  <span className="dash-list-date">{formatDate(d.ngay_hen)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Top KTV + Top Services + Activity */}
      <div className="dash-bottom-row">
        {topKTV.length > 0 && (
          <div className="dash-chart-card">
            <h3 className="dash-card-title">Top KTV</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topKTV} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={12} width={90} />
                <Bar dataKey="count" fill="#2E7D32" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {topServices.length > 0 && (
          <div className="dash-chart-card">
            <h3 className="dash-card-title">Top dịch vụ</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topServices} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={12} width={80} />
                <Bar dataKey="count" fill="#1565C0" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="dash-list-card">
          <div className="dash-list-header">
            <Calendar size={16} />
            <span>Hoạt động gần đây</span>
          </div>
          {activities.length === 0 ? <p className="dash-empty">Chưa có</p> : (
            <div className="dash-list-items">
              {activities.map((a) => (
                <div key={a.id} className="dash-list-item">
                  <div>
                    <strong>{a.email?.split("@")[0]}</strong>
                    <span className="dash-list-sub">{a.hanh_dong}{a.chi_tiet ? ` (${a.chi_tiet})` : ""}</span>
                  </div>
                  <span className="dash-list-time">{formatTime(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
