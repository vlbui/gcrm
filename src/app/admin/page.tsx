"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchActivityLogs, type ActivityLog } from "@/lib/api/activityLog.api";
import { fetchDebts, type DebtRecord } from "@/lib/api/payments.api";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import {
  Users,
  DollarSign,
  FileText,
  ClipboardList,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  TrendingDown,
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
  const from = new Date();
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
  totalContracts: number;
  prevContracts: number;
  totalRequests: number;
  prevRequests: number;
}

export default function DashboardPage() {
  const [range, setRange] = useState("30d");
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0, prevCustomers: 0,
    revenue: 0, prevRevenue: 0,
    totalContracts: 0, prevContracts: 0,
    totalRequests: 0, prevRequests: 0,
  });
  const [contractStatusData, setContractStatusData] = useState<{ name: string; value: number }[]>([]);
  const [revenueChart, setRevenueChart] = useState<{ month: string; revenue: number }[]>([]);
  const [newRequests, setNewRequests] = useState<{ id: string; ma_yc: string; ten_kh: string; sdt: string; trang_thai: string; created_at: string }[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<{ id: string; ma_hd: string; ten_kh: string; ngay_ket_thuc: string }[]>([]);
  const [topServices, setTopServices] = useState<{ name: string; count: number }[]>([]);
  const [visitStats, setVisitStats] = useState<{ name: string; value: number }[]>([]);
  const [weeklyVisits, setWeeklyVisits] = useState<{ date: string; dayLabel: string; visits: { id: string; contract_ma_hd: string; ten_kh: string; trang_thai: string; lan_thu: number }[] }[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, [range]);

  async function loadDashboard() {
    const supabase = createClient();
    const { from, to } = getDateRange(range);
    const prev = getPrevRange(range);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const in7 = new Date(now.getTime() + 7 * 86400000).toISOString().split("T")[0];
    const in30 = new Date(now.getTime() + 30 * 86400000).toISOString().split("T")[0];

    try {
      const [
        customersRes,
        prevCustomersRes,
        contractsRes,
        prevContractsRes,
        paymentsRes,
        prevPaymentsRes,
        requestsRes,
        prevRequestsRes,
        allPaymentsRes,
        allContractsRes,
        newReqRes,
        expiringRes,
        visitsRes,
        weeklyRes,
        logsRes,
        debtsRes,
      ] = await Promise.all([
        // KPI: Customers
        supabase.from("customers").select("*", { count: "exact", head: true }).gte("created_at", from).lte("created_at", to),
        supabase.from("customers").select("*", { count: "exact", head: true }).gte("created_at", prev.from).lte("created_at", prev.to),
        // KPI: Contracts
        supabase.from("contracts").select("*", { count: "exact", head: true }).gte("created_at", from).lte("created_at", to),
        supabase.from("contracts").select("*", { count: "exact", head: true }).gte("created_at", prev.from).lte("created_at", prev.to),
        // KPI: Revenue (payments)
        supabase.from("payments").select("so_tien").gte("ngay_tt", from.split("T")[0]).lte("ngay_tt", to.split("T")[0]),
        supabase.from("payments").select("so_tien").gte("ngay_tt", prev.from.split("T")[0]).lte("ngay_tt", prev.to.split("T")[0]),
        // KPI: Service requests
        supabase.from("service_requests").select("*", { count: "exact", head: true }).gte("created_at", from).lte("created_at", to),
        supabase.from("service_requests").select("*", { count: "exact", head: true }).gte("created_at", prev.from).lte("created_at", prev.to),
        // Revenue chart - all payments
        supabase.from("payments").select("so_tien, ngay_tt").order("ngay_tt"),
        // Contract status distribution
        supabase.from("contracts").select("trang_thai, dich_vu").gte("created_at", from).lte("created_at", to),
        // New service requests
        supabase.from("service_requests").select("id, ma_yc, ten_kh, sdt, trang_thai, created_at").in("trang_thai", ["Mới", "Đã liên hệ", "Đang tư vấn"]).order("created_at", { ascending: false }).limit(5),
        // Expiring contracts
        supabase.from("contracts").select("id, ma_hd, ngay_ket_thuc, customer_id, customers(ten_kh)").gte("ngay_ket_thuc", today).lte("ngay_ket_thuc", in30).order("ngay_ket_thuc").limit(5),
        // Service visits stats
        supabase.from("service_visits").select("trang_thai").gte("created_at", from).lte("created_at", to),
        // Weekly schedule - visits in next 7 days
        supabase.from("service_visits").select("id, lan_thu, ngay_du_kien, trang_thai, contract_id, contracts(ma_hd, customers(ten_kh))").gte("ngay_du_kien", today).lte("ngay_du_kien", in7).order("ngay_du_kien"),
        // Activity logs
        fetchActivityLogs(10),
        // Debts
        fetchDebts(),
      ]);

      // Revenue
      const revenue = (paymentsRes.data ?? []).reduce((s, p) => s + (p.so_tien || 0), 0);
      const prevRevenue = (prevPaymentsRes.data ?? []).reduce((s, p) => s + (p.so_tien || 0), 0);

      setStats({
        totalCustomers: customersRes.count ?? 0,
        prevCustomers: prevCustomersRes.count ?? 0,
        revenue,
        prevRevenue,
        totalContracts: contractsRes.count ?? 0,
        prevContracts: prevContractsRes.count ?? 0,
        totalRequests: requestsRes.count ?? 0,
        prevRequests: prevRequestsRes.count ?? 0,
      });

      // Contract status pie
      const statusCounts = new Map<string, number>();
      for (const c of allContractsRes.data ?? []) statusCounts.set(c.trang_thai, (statusCounts.get(c.trang_thai) || 0) + 1);
      setContractStatusData(Array.from(statusCounts.entries()).map(([name, value]) => ({ name, value })));

      // Revenue chart - 6 months
      const monthly = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthly.set(`T${dt.getMonth() + 1}`, 0);
      }
      for (const p of allPaymentsRes.data ?? []) {
        if (!p.ngay_tt) continue;
        const dt = new Date(p.ngay_tt);
        const key = `T${dt.getMonth() + 1}`;
        if (monthly.has(key)) monthly.set(key, (monthly.get(key) || 0) + (p.so_tien || 0));
      }
      setRevenueChart(Array.from(monthly.entries()).map(([month, rev]) => ({ month, revenue: rev })));

      // Top services from contracts
      const svcCounts = new Map<string, number>();
      for (const c of allContractsRes.data ?? []) {
        if (c.dich_vu) svcCounts.set(c.dich_vu, (svcCounts.get(c.dich_vu) || 0) + 1);
      }
      setTopServices(
        Array.from(svcCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))
      );

      // Service visits stats
      const visitCounts = new Map<string, number>();
      for (const v of visitsRes.data ?? []) visitCounts.set(v.trang_thai, (visitCounts.get(v.trang_thai) || 0) + 1);
      setVisitStats(Array.from(visitCounts.entries()).map(([name, value]) => ({ name, value })));

      // Weekly schedule
      const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const weekMap = new Map<string, { date: string; dayLabel: string; visits: { id: string; contract_ma_hd: string; ten_kh: string; trang_thai: string; lan_thu: number }[] }>();
      for (let i = 0; i < 7; i++) {
        const d = new Date(now.getTime() + i * 86400000);
        const key = d.toISOString().split("T")[0];
        const dayLabel = i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : dayNames[d.getDay()];
        weekMap.set(key, { date: key, dayLabel: `${dayLabel} (${d.getDate()}/${d.getMonth() + 1})`, visits: [] });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const v of (weeklyRes.data ?? []) as any[]) {
        const day = weekMap.get(v.ngay_du_kien);
        if (day) {
          day.visits.push({
            id: v.id,
            contract_ma_hd: v.contracts?.ma_hd ?? "—",
            ten_kh: v.contracts?.customers?.ten_kh ?? "—",
            trang_thai: v.trang_thai,
            lan_thu: v.lan_thu,
          });
        }
      }
      setWeeklyVisits(Array.from(weekMap.values()));

      // Quick lists
      setNewRequests((newReqRes.data ?? []) as typeof newRequests);
      setExpiringContracts(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((expiringRes.data ?? []) as any[]).map((c) => ({
          id: c.id,
          ma_hd: c.ma_hd,
          ten_kh: c.customers?.ten_kh ?? "—",
          ngay_ket_thuc: c.ngay_ket_thuc,
        }))
      );
      setActivities(logsRes);
      setDebts(debtsRes);
    } catch (err) {
      // silently ignore dashboard load errors
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

  const statusBadgeClass: Record<string, string> = {
    "Mới": "status-badge moi",
    "Đã liên hệ": "status-badge moi",
    "Đang tư vấn": "admin-badge amber",
    "Đã báo giá": "admin-badge blue",
    "Chốt đơn": "admin-badge green",
  };

  const totalDebt = debts.reduce((s, d) => s + d.tong_con_no, 0);
  const debtCount = debts.filter((d) => d.tong_con_no > 0).length;

  const kpiCards = [
    { label: "Khách hàng mới", value: stats.totalCustomers, prev: stats.prevCustomers, icon: Users, color: "#2E7D32" },
    { label: "Hợp đồng", value: stats.totalContracts, prev: stats.prevContracts, icon: FileText, color: "#6A1B9A" },
    { label: "Doanh thu", value: stats.revenue, prev: stats.prevRevenue, icon: DollarSign, color: "#1565C0", format: "money" },
    { label: "Công nợ", value: totalDebt, prev: 0, icon: TrendingDown, color: "#B71C1C", format: "money", subtitle: `${debtCount} khách` },
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
          const pct = kpi.prev === 0 ? 0 : pctChange(kpi.value, kpi.prev);
          const isUp = pct > 0;
          return (
            <div key={kpi.label} className="dash-kpi-card">
              <div className="dash-kpi-icon" style={{ background: kpi.color + "15", color: kpi.color }}>
                <kpi.icon size={20} />
              </div>
              <div className="dash-kpi-value">
                {loading ? "—" : kpi.format === "money"
                  ? `${(kpi.value / 1000000).toFixed(1)}tr`
                  : kpi.value
                }
              </div>
              <div className="dash-kpi-label">{kpi.label}</div>
              {"subtitle" in kpi && kpi.subtitle ? (
                <div style={{ fontSize: 11, color: kpi.color, marginTop: 2 }}>{kpi.subtitle}</div>
              ) : pct !== 0 ? (
                <div className={`dash-kpi-change ${isUp ? "up" : "down"}`}>
                  {isUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {Math.abs(pct)}%
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* New Requests — prominent position */}
      <div className="dash-list-card" style={{ marginBottom: 16 }}>
        <div className="dash-list-header">
          <ClipboardList size={16} style={{ color: "#E65100" }} />
          <span>Yêu cầu mới cần xử lý</span>
          <Link href="/admin/yeu-cau" className="dash-list-link">Xem tất cả <ArrowRight size={12} /></Link>
        </div>
        {newRequests.length === 0 ? <p className="dash-empty">Không có yêu cầu mới</p> : (
          <div className="dash-list-items">
            {newRequests.map((r) => (
              <div key={r.id} className="dash-list-item">
                <div>
                  <strong>{r.ten_kh}</strong>
                  <span className="dash-list-sub">{r.ma_yc} · {r.sdt}</span>
                </div>
                <span className={statusBadgeClass[r.trang_thai] ?? "status-badge"} style={{ fontSize: 11 }}>{r.trang_thai}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Schedule */}
      <div className="dash-week-schedule">
        <div className="dash-list-header" style={{ marginBottom: 0, paddingBottom: 12 }}>
          <Calendar size={16} style={{ color: "#2E7D32" }} />
          <span>Lịch dịch vụ 7 ngày tới</span>
          <Link href="/admin/lich-su-dich-vu" className="dash-list-link">Xem tất cả <ArrowRight size={12} /></Link>
        </div>
        {!loading && (
          <div className="dash-week-grid">
            {weeklyVisits.map((day) => (
              <div key={day.date} className={`dash-week-day${day.visits.length === 0 ? " empty" : ""}`}>
                <div className="dash-week-day-label">{day.dayLabel}</div>
                {day.visits.length === 0 ? (
                  <div className="dash-week-empty">Trống</div>
                ) : (
                  <div className="dash-week-visits">
                    {day.visits.map((v) => {
                      const color = v.trang_thai === "Hoàn thành" ? "#16A34A" : v.trang_thai === "Đang làm" ? "#2563EB" : v.trang_thai === "Hủy" || v.trang_thai === "Hoãn" ? "#DC2626" : "#F59E0B";
                      return (
                        <div key={v.id} className="dash-week-visit" style={{ borderLeftColor: color }}>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>{v.ten_kh}</div>
                          <div style={{ fontSize: 11, color: "var(--neutral-500)" }}>{v.contract_ma_hd} · Lần {v.lan_thu}</div>
                          <span className="dash-week-status" style={{ color }}>{v.trang_thai}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
          <h3 className="dash-card-title">Trạng thái hợp đồng</h3>
          {!loading && contractStatusData.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={contractStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  fontSize={11}
                >
                  {contractStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
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
            <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
            <span>Hợp đồng sắp hết hạn</span>
            <Link href="/admin/hop-dong" className="dash-list-link">Xem tất cả <ArrowRight size={12} /></Link>
          </div>
          {expiringContracts.length === 0 ? <p className="dash-empty">Không có</p> : (
            <div className="dash-list-items">
              {expiringContracts.map((c) => (
                <div key={c.id} className="dash-list-item">
                  <div>
                    <strong>{c.ten_kh}</strong>
                    <span className="dash-list-sub">{c.ma_hd}</span>
                  </div>
                  <span className="dash-list-date">{formatDate(c.ngay_ket_thuc)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="dash-list-card">
          <div className="dash-list-header">
            <TrendingDown size={16} style={{ color: "#B71C1C" }} />
            <span>Công nợ</span>
            <Link href="/admin/thanh-toan" className="dash-list-link">Xem tất cả <ArrowRight size={12} /></Link>
          </div>
          {debts.length === 0 ? <p className="dash-empty">Không có công nợ</p> : (
            <div className="dash-list-items">
              {debts.slice(0, 5).map((d) => (
                <div key={d.customer_id} className="dash-list-item">
                  <div>
                    <strong>{d.ten_kh}</strong>
                    <span className="dash-list-sub">{d.ma_kh} · {d.contracts.length} HĐ</span>
                  </div>
                  <span style={{ fontWeight: 600, color: "#B71C1C", fontSize: 13 }}>
                    {d.tong_con_no.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Top Services + Visit Stats + Activity */}
      <div className="dash-bottom-row">
        {topServices.length > 0 && (
          <div className="dash-chart-card">
            <h3 className="dash-card-title">Top dịch vụ</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topServices} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                <Bar dataKey="count" fill="#2E7D32" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {visitStats.length > 0 && (
          <div className="dash-chart-card">
            <h3 className="dash-card-title">Lần dịch vụ</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0" }}>
              {visitStats.map((v) => {
                const total = visitStats.reduce((s, x) => s + x.value, 0);
                const pct = total > 0 ? Math.round((v.value / total) * 100) : 0;
                const color = v.name === "Hoàn thành" ? "#16A34A" : v.name === "Đang làm" ? "#2563EB" : v.name === "Đã lên lịch" ? "#F59E0B" : "#6B7280";
                return (
                  <div key={v.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={12} style={{ color }} />
                        {v.name}
                      </span>
                      <span style={{ fontWeight: 600 }}>{v.value} ({pct}%)</span>
                    </div>
                    <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3 }}>
                      <div style={{ height: 6, width: `${pct}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
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
