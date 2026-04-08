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
import { Plus, Search, Trash2, CreditCard, Banknote, Building2, X } from "lucide-react";
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
import Pagination from "@/components/admin/Pagination";
import SearchSelect from "@/components/admin/SearchSelect";

function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN") + "đ";
}

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
  const [pageSize, setPageSize] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Payment | null>(null);

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
      const [p, c] = await Promise.all([fetchPayments(), fetchContracts()]);
      setPayments(p);
      setContracts(c);
    } catch { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.ma_tt.toLowerCase().includes(q)
      || (p.contracts?.ma_hd ?? "").toLowerCase().includes(q)
      || (p.contracts?.customers?.ten_kh ?? "").toLowerCase().includes(q);
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetForm = () => {
    setContractId("");
    setSoTien("");
    setNgayTT(new Date().toISOString().split("T")[0]);
    setHinhThuc("Chuyển khoản");
    setGhiChu("");
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

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

  // Tổng
  const totalAmount = filtered.reduce((s, p) => s + (p.so_tien || 0), 0);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Thanh toán</h1>
          <p className="admin-page-subtitle">
            Lịch sử thanh toán ({filtered.length}) — Tổng: {formatCurrency(totalAmount)}
          </p>
        </div>
        <Button className="btn-add" onClick={openAdd}>
          <Plus size={16} /> Thêm thanh toán
        </Button>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm mã TT, hợp đồng, khách hàng..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p>Đang tải...</p></div>
        ) : filtered.length === 0 ? (
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
