"use client";

import { useEffect, useState } from "react";
import {
  fetchPayments,
  createPayment,
  deletePayment,
  type Payment,
  type CreatePaymentInput,
} from "@/lib/api/payments.api";
import { fetchContracts, type Contract } from "@/lib/api/contracts.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  Plus,
  Search,
  Trash2,
  CreditCard,
  Banknote,
  Building2,
  X,
} from "lucide-react";

const HINH_THUC_ICON: Record<string, React.ReactNode> = {
  "Tiền mặt": <Banknote size={14} />,
  "Chuyển khoản": <Building2 size={14} />,
  "Thẻ": <CreditCard size={14} />,
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [contractId, setContractId] = useState("");
  const [soTien, setSoTien] = useState("");
  const [ngayTT, setNgayTT] = useState(new Date().toISOString().split("T")[0]);
  const [hinhThuc, setHinhThuc] = useState("Chuyển khoản");
  const [ghiChu, setGhiChu] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [p, c] = await Promise.all([fetchPayments(), fetchContracts()]);
      setPayments(p);
      setContracts(c);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  const filtered = payments.filter(
    (p) =>
      !search ||
      p.ma_tt.toLowerCase().includes(search.toLowerCase()) ||
      p.contracts?.ma_hd.toLowerCase().includes(search.toLowerCase()) ||
      p.contracts?.customers?.ten_kh.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const resetForm = () => {
    setContractId("");
    setSoTien("");
    setNgayTT(new Date().toISOString().split("T")[0]);
    setHinhThuc("Chuyển khoản");
    setGhiChu("");
  };

  async function handleSubmit() {
    if (!contractId || !soTien) {
      toast.error("Vui lòng chọn hợp đồng và nhập số tiền");
      return;
    }
    setSaving(true);
    try {
      const input: CreatePaymentInput = {
        contract_id: contractId,
        so_tien: Number(soTien),
        ngay_tt: ngayTT,
        hinh_thuc: hinhThuc,
        ghi_chu: ghiChu || undefined,
      };
      await createPayment(input);
      toast.success("Đã thêm thanh toán");
      setShowForm(false);
      resetForm();
      await loadData();
    } catch {
      toast.error("Lỗi thêm thanh toán");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa giao dịch thanh toán này?")) return;
    try {
      await deletePayment(id);
      toast.success("Đã xóa");
      await loadData();
    } catch {
      toast.error("Lỗi xóa thanh toán");
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Thanh toán</h1>
          <p className="admin-page-subtitle">
            Lịch sử thanh toán ({filtered.length})
          </p>
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} /> Thêm thanh toán
        </button>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            placeholder="Tìm mã TT, hợp đồng, khách hàng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Đang tải...</p></div>
      ) : paginated.length === 0 ? (
        <div className="empty-state">
          <CreditCard size={48} strokeWidth={1} />
          <p>Chưa có thanh toán nào</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã TT</th>
                  <th>Hợp đồng</th>
                  <th>Khách hàng</th>
                  <th>Số tiền</th>
                  <th>Hình thức</th>
                  <th>Ngày TT</th>
                  <th>Ghi chú</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.ma_tt}</td>
                    <td>{p.contracts?.ma_hd || "—"}</td>
                    <td>{p.contracts?.customers?.ten_kh || "—"}</td>
                    <td className="font-medium" style={{ color: "var(--primary-700)" }}>
                      {p.so_tien.toLocaleString("vi-VN")}đ
                    </td>
                    <td>
                      <span className="admin-badge gray" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                        {HINH_THUC_ICON[p.hinh_thuc]} {p.hinh_thuc}
                      </span>
                    </td>
                    <td>{formatDate(p.ngay_tt)}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.ghi_chu || "—"}
                    </td>
                    <td>
                      <button
                        className="admin-action-btn text-red-600"
                        onClick={() => handleDelete(p.id)}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}

      {/* Add Payment Dialog */}
      {showForm && (
        <div className="admin-dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <h2>Thêm thanh toán</h2>
              <button className="admin-dialog-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-dialog-body">
              <div className="admin-form-group">
                <label className="admin-label">Hợp đồng *</label>
                <select
                  className="admin-input"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                >
                  <option value="">— Chọn hợp đồng —</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ma_hd} — {c.customers?.ten_kh} ({(c.gia_tri || 0).toLocaleString("vi-VN")}đ)
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form-row">
                <div className="admin-form-group">
                  <label className="admin-label">Số tiền (VNĐ) *</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    value={soTien}
                    onChange={(e) => setSoTien(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-label">Ngày thanh toán</label>
                  <input
                    className="admin-input"
                    type="date"
                    value={ngayTT}
                    onChange={(e) => setNgayTT(e.target.value)}
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Hình thức</label>
                <select
                  className="admin-input"
                  value={hinhThuc}
                  onChange={(e) => setHinhThuc(e.target.value)}
                >
                  <option>Chuyển khoản</option>
                  <option>Tiền mặt</option>
                  <option>Thẻ</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-label">Ghi chú</label>
                <textarea
                  className="admin-input"
                  rows={2}
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-dialog-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowForm(false)}>
                Hủy
              </button>
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Thêm thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
