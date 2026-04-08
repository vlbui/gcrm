"use client";

import { useEffect, useState } from "react";
import {
  fetchPayments,
  createPayment,
  deletePayment,
  fetchDebts,
  type Payment,
  type DebtRecord,
} from "@/lib/api/payments.api";
import { fetchContracts, type Contract } from "@/lib/api/contracts.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import {
  Plus, Search, Trash2, CreditCard, Banknote, Building2,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import Pagination from "@/components/admin/Pagination";
import SearchSelect from "@/components/admin/SearchSelect";

function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN") + "đ";
}

function formatShort(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return value.toString();
}

const HINH_THUC_ICON: Record<string, React.ReactNode> = {
  "Tiền mặt": <Banknote size={14} />,
  "Chuyển khoản": <Building2 size={14} />,
  "Thẻ": <CreditCard size={14} />,
};

const PIE_COLORS = ["#2E7D32", "#F59E0B", "#EF4444", "#6B7280"];

type Tab = "payments" | "debts";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("payments");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Payment | null>(null);
  const [expandedDebt, setExpandedDebt] = useState<Set<string>>(new Set());

  // Form state
  const [contractId, setContractId] = useState("");
  const [soTien, setSoTien] = useState("");
  const [ngayTT, setNgayTT] = useState(new Date().toISOString().split("T")[0]);
  const [hinhThuc, setHinhThuc] = useState("Chuyển khoản");
  const [ghiChu, setGhiChu] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [p, c, d] = await Promise.all([fetchPayments(), fetchContracts(), fetchDebts()]);
      setPayments(p);
      setContracts(c);
      setDebts(d);
    } catch { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }

  // === Dashboard stats ===
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const totalRevenue = payments.reduce((s, p) => s + (p.so_tien || 0), 0);
  const thisMonthRevenue = payments.filter((p) => p.ngay_tt?.startsWith(thisMonth)).reduce((s, p) => s + (p.so_tien || 0), 0);
  const lastMonthRevenue = payments.filter((p) => p.ngay_tt?.startsWith(lastMonth)).reduce((s, p) => s + (p.so_tien || 0), 0);
  const totalDebt = debts.reduce((s, d) => s + d.tong_con_no, 0);
  const debtCustomers = debts.filter((d) => d.tong_con_no > 0).length;

  // Monthly chart (last 6 months)
  const monthlyData = (() => {
    const months: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `T${d.getMonth() + 1}`;
      const revenue = payments.filter((p) => p.ngay_tt?.startsWith(key)).reduce((s, p) => s + (p.so_tien || 0), 0);
      months.push({ month: label, revenue });
    }
    return months;
  })();

  // Payment method distribution
  const methodData = (() => {
    const counts = new Map<string, number>();
    for (const p of payments) {
      counts.set(p.hinh_thuc, (counts.get(p.hinh_thuc) || 0) + p.so_tien);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  })();

  // Payment status distribution
  const statusData = (() => {
    const paid = contracts.filter((c) => c.trang_thai_thanh_toan === "Đã TT").length;
    const partial = contracts.filter((c) => c.trang_thai_thanh_toan === "Đã cọc").length;
    const unpaid = contracts.filter((c) => !c.trang_thai_thanh_toan || c.trang_thai_thanh_toan === "Chưa TT").length;
    const overdue = contracts.filter((c) => c.trang_thai_thanh_toan === "Quá hạn").length;
    return [
      { name: "Đã TT", value: paid },
      { name: "Đã cọc", value: partial },
      { name: "Chưa TT", value: unpaid },
      { name: "Quá hạn", value: overdue },
    ].filter((d) => d.value > 0);
  })();

  // === Filters ===
  const filtered = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.ma_tt.toLowerCase().includes(q)
      || (p.contracts?.ma_hd ?? "").toLowerCase().includes(q)
      || (p.contracts?.customers?.ten_kh ?? "").toLowerCase().includes(q);
  });

  const filteredDebts = debts.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.ten_kh.toLowerCase().includes(q) || d.ma_kh.toLowerCase().includes(q);
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetForm = () => {
    setContractId("");
    setSoTien("");
    setNgayTT(new Date().toISOString().split("T")[0]);
    setHinhThuc("Chuyển khoản");
    setGhiChu("");
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };

  async function handleSubmit() {
    if (!contractId || !soTien) {
      toast.error("Vui lòng chọn hợp đồng và nhập số tiền");
      return;
    }
    setSaving(true);
    try {
      await createPayment({
        contract_id: contractId,
        so_tien: Number(soTien),
        ngay_tt: ngayTT,
        hinh_thuc: hinhThuc,
        ghi_chu: ghiChu || undefined,
      });
      toast.success("Đã thêm thanh toán");
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch { toast.error("Lỗi thêm thanh toán"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deletingItem) return;
    try {
      await deletePayment(deletingItem.id);
      toast.success("Đã xóa");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      await loadData();
    } catch { toast.error("Lỗi xóa thanh toán"); }
  }

  const toggleDebtExpand = (customerId: string) => {
    setExpandedDebt((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId); else next.add(customerId);
      return next;
    });
  };

  const monthPctChange = lastMonthRevenue === 0
    ? (thisMonthRevenue > 0 ? 100 : 0)
    : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Thanh toán</h1>
          <p className="admin-page-subtitle">Quản lý thanh toán & công nợ</p>
        </div>
        <Button className="btn-add" onClick={openAdd}>
          <Plus size={16} /> Thêm thanh toán
        </Button>
      </div>

      {/* === KPI Cards === */}
      <div className="dash-kpi-grid" style={{ marginBottom: 20 }}>
        <div className="dash-kpi-card">
          <div className="dash-kpi-icon" style={{ background: "#2E7D3215", color: "#2E7D32" }}>
            <DollarSign size={20} />
          </div>
          <div className="dash-kpi-value">{loading ? "—" : formatShort(totalRevenue)}</div>
          <div className="dash-kpi-label">Tổng doanh thu</div>
        </div>
        <div className="dash-kpi-card">
          <div className="dash-kpi-icon" style={{ background: "#1565C015", color: "#1565C0" }}>
            <TrendingUp size={20} />
          </div>
          <div className="dash-kpi-value">{loading ? "—" : formatShort(thisMonthRevenue)}</div>
          <div className="dash-kpi-label">Tháng này</div>
          {monthPctChange !== 0 && (
            <div className={`dash-kpi-change ${monthPctChange > 0 ? "up" : "down"}`}>
              {monthPctChange > 0 ? "+" : ""}{monthPctChange}% vs tháng trước
            </div>
          )}
        </div>
        <div className="dash-kpi-card">
          <div className="dash-kpi-icon" style={{ background: "#EF444415", color: "#EF4444" }}>
            <AlertTriangle size={20} />
          </div>
          <div className="dash-kpi-value">{loading ? "—" : formatShort(totalDebt)}</div>
          <div className="dash-kpi-label">Tổng công nợ</div>
          {debtCustomers > 0 && (
            <div className="dash-kpi-change down">{debtCustomers} khách hàng</div>
          )}
        </div>
        <div className="dash-kpi-card">
          <div className="dash-kpi-icon" style={{ background: "#6A1B9A15", color: "#6A1B9A" }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="dash-kpi-value">{loading ? "—" : payments.length}</div>
          <div className="dash-kpi-label">Tổng giao dịch</div>
        </div>
      </div>

      {/* === Charts === */}
      {!loading && payments.length > 0 && (
        <div className="dash-charts-row" style={{ marginBottom: 20 }}>
          <div className="dash-chart-card">
            <h3 className="dash-card-title">Doanh thu 6 tháng</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => formatShort(v)} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Doanh thu"]} />
                <Bar dataKey="revenue" fill="#2E7D32" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="dash-chart-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h3 className="dash-card-title">Hình thức thanh toán</h3>
              {methodData.length > 0 && (
                <ResponsiveContainer width="100%" height={100}>
                  <PieChart>
                    <Pie data={methodData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} dataKey="value" fontSize={11}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {methodData.map((_, i) => <Cell key={i} fill={["#2E7D32", "#1565C0", "#6A1B9A"][i % 3]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Số tiền"]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div>
              <h3 className="dash-card-title">Trạng thái thanh toán HĐ</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 0" }}>
                {statusData.map((s) => {
                  const total = statusData.reduce((sum, x) => sum + x.value, 0);
                  const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                  const color = s.name === "Đã TT" ? "#2E7D32" : s.name === "Đã cọc" ? "#F59E0B" : s.name === "Quá hạn" ? "#EF4444" : "#6B7280";
                  return (
                    <div key={s.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                          {s.name}
                        </span>
                        <span style={{ fontWeight: 600 }}>{s.value} ({pct}%)</span>
                      </div>
                      <div style={{ height: 5, background: "#F3F4F6", borderRadius: 3 }}>
                        <div style={{ height: 5, width: `${pct}%`, background: color, borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === Tabs === */}
      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div style={{ display: "flex", gap: 0, marginRight: 12 }}>
            <button
              className={`dash-range-btn ${tab === "payments" ? "active" : ""}`}
              onClick={() => { setTab("payments"); setSearch(""); setPage(1); }}
            >
              Lịch sử TT ({payments.length})
            </button>
            <button
              className={`dash-range-btn ${tab === "debts" ? "active" : ""}`}
              onClick={() => { setTab("debts"); setSearch(""); setPage(1); }}
            >
              Công nợ ({debts.filter((d) => d.tong_con_no > 0).length})
            </button>
          </div>
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder={tab === "payments" ? "Tìm mã TT, hợp đồng, khách hàng..." : "Tìm khách hàng..."}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p>Đang tải...</p></div>
        ) : tab === "payments" ? (
          /* === Payments Table === */
          filtered.length === 0 ? (
            <div className="empty-state">
              <CreditCard size={48} strokeWidth={1} />
              <p>Chưa có thanh toán nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã TT</TableHead>
                    <TableHead>Hợp đồng</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Hình thức</TableHead>
                    <TableHead>Ngày TT</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead style={{ width: 50 }}></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.ma_tt}</TableCell>
                      <TableCell>{p.contracts?.ma_hd || "—"}</TableCell>
                      <TableCell>{p.contracts?.customers?.ten_kh || "—"}</TableCell>
                      <TableCell className="font-medium" style={{ color: "var(--primary-700)" }}>
                        {formatCurrency(p.so_tien)}
                      </TableCell>
                      <TableCell>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                          {HINH_THUC_ICON[p.hinh_thuc]} {p.hinh_thuc}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(p.ngay_tt)}</TableCell>
                      <TableCell style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.ghi_chu || "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-action danger"
                          title="Xóa"
                          onClick={() => { setDeletingItem(p); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </>
          )
        ) : (
          /* === Debts Tab === */
          filteredDebts.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={48} strokeWidth={1} />
              <p>Không có công nợ</p>
            </div>
          ) : (
            <div className="sv-contract-list">
              {filteredDebts.filter((d) => d.tong_con_no > 0).map((d) => {
                const isExpanded = expandedDebt.has(d.customer_id);
                return (
                  <div key={d.customer_id} className="sv-contract-card">
                    <div className="sv-contract-header" onClick={() => toggleDebtExpand(d.customer_id)}>
                      <div className="sv-contract-chevron">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                      <div className="sv-contract-info">
                        <div className="sv-contract-title">
                          <strong>{d.ten_kh}</strong> <span style={{ color: "var(--neutral-500)", fontSize: 12 }}>({d.ma_kh})</span>
                        </div>
                        <div className="sv-contract-sub">
                          {d.contracts.length} hợp đồng · Đã trả {formatCurrency(d.tong_da_tra)} / {formatCurrency(d.tong_gia_tri)}
                        </div>
                      </div>
                      <div className="sv-contract-meta">
                        <span style={{ fontWeight: 700, color: "var(--danger-500)", fontSize: 14 }}>
                          Nợ: {formatCurrency(d.tong_con_no)}
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: "8px 16px 12px 44px" }}>
                        {d.contracts.map((c) => (
                          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--neutral-100)", fontSize: 13 }}>
                            <div>
                              <strong>{c.ma_hd}</strong>
                              <span style={{ marginLeft: 8, color: "var(--neutral-500)" }}>
                                Giá trị: {formatCurrency(c.gia_tri)}
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <span>Đã trả: {formatCurrency(c.so_tien_da_tra)}</span>
                              <span style={{ fontWeight: 600, color: c.con_no > 0 ? "var(--danger-500)" : "var(--primary-700)" }}>
                                {c.con_no > 0 ? `Nợ: ${formatCurrency(c.con_no)}` : "Đã TT"}
                              </span>
                              <span className={`admin-badge ${c.trang_thai_thanh_toan === "Đã TT" ? "green" : c.trang_thai_thanh_toan === "Đã cọc" ? "amber" : "gray"}`}>
                                {c.trang_thai_thanh_toan}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm thanh toán</DialogTitle>
          </DialogHeader>
          <div className="form-grid">
            <div className="form-field full-width">
              <Label>Hợp đồng *</Label>
              <SearchSelect
                placeholder="Tìm theo mã HĐ, tên KH..."
                value={contractId}
                onChange={(v) => setContractId(v)}
                options={contracts.map((c) => ({
                  value: c.id,
                  label: `${c.ma_hd} — ${c.customers?.ten_kh ?? ""} (${formatCurrency(c.gia_tri || 0)})`,
                }))}
              />
            </div>
            <div className="form-field">
              <Label>Số tiền (VNĐ) *</Label>
              <Input
                type="number"
                min={0}
                value={soTien}
                onChange={(e) => setSoTien(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-field">
              <Label>Ngày thanh toán</Label>
              <Input
                type="date"
                value={ngayTT}
                onChange={(e) => setNgayTT(e.target.value)}
              />
            </div>
            <div className="form-field">
              <Label>Hình thức</Label>
              <select className="native-select" value={hinhThuc} onChange={(e) => setHinhThuc(e.target.value)}>
                <option>Chuyển khoản</option>
                <option>Tiền mặt</option>
                <option>Thẻ</option>
              </select>
            </div>
            <div className="form-field full-width">
              <Label>Ghi chú</Label>
              <Textarea rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} placeholder="Ghi chú thanh toán..." />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Đang lưu..." : "Thêm thanh toán"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p>Xóa thanh toán <strong>{deletingItem?.ma_tt}</strong>?</p>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
