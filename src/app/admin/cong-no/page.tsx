"use client";

import { useEffect, useState } from "react";
import { fetchDebts, deletePayment, fetchPaymentsByContract, type DebtRecord, type Payment } from "@/lib/api/payments.api";
import { deleteContract } from "@/lib/api/contracts.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import {
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Wallet,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function DebtPage() {
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Delete contract state
  const [deleteContractOpen, setDeleteContractOpen] = useState(false);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);
  const [deletingContractMaHd, setDeletingContractMaHd] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setDebts(await fetchDebts());
    } catch { toast.error("Lỗi tải công nợ"); }
    finally { setLoading(false); }
  }

  const filtered = debts.filter(
    (d) =>
      !search ||
      d.ten_kh.toLowerCase().includes(search.toLowerCase()) ||
      d.ma_kh.toLowerCase().includes(search.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function handleDeleteContract() {
    if (!deletingContractId) return;
    try {
      // Delete all payments for this contract first
      const payments = await fetchPaymentsByContract(deletingContractId);
      for (const p of payments) {
        await deletePayment(p.id);
      }
      await deleteContract(deletingContractId);
      toast.success("Đã xóa hợp đồng và công nợ liên quan");
      setDeleteContractOpen(false);
      setDeletingContractId(null);
      await loadData();
    } catch { toast.error("Lỗi xóa"); }
  }

  const totalDebt = filtered.reduce((sum, d) => sum + d.tong_con_no, 0);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Công nợ</h1>
          <p className="admin-page-subtitle">
            Theo dõi công nợ theo khách hàng
          </p>
        </div>
        <div className="debt-total-badge">
          <AlertTriangle size={16} />
          Tổng nợ: <strong>{totalDebt.toLocaleString("vi-VN")}đ</strong>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            placeholder="Tìm khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><p>Đang tải...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Wallet size={48} strokeWidth={1} />
          <p>Không có công nợ</p>
        </div>
      ) : (
        <div className="debt-list">
          {filtered.map((debt) => (
            <div key={debt.customer_id} className="debt-card">
              <div
                className="debt-card-header"
                onClick={() => toggleExpand(debt.customer_id)}
              >
                <div className="debt-card-left">
                  {expanded.has(debt.customer_id) ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                  <div>
                    <div className="debt-card-name">{debt.ten_kh}</div>
                    <div className="debt-card-code">{debt.ma_kh}</div>
                  </div>
                </div>
                <div className="debt-card-right">
                  <div className="debt-card-amounts">
                    <span className="debt-amount-label">Giá trị HĐ</span>
                    <span>{debt.tong_gia_tri.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="debt-card-amounts">
                    <span className="debt-amount-label">Đã trả</span>
                    <span style={{ color: "var(--primary-700)" }}>
                      {debt.tong_da_tra.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="debt-card-amounts">
                    <span className="debt-amount-label">Còn nợ</span>
                    <span style={{ color: "var(--danger-500)", fontWeight: 700 }}>
                      {debt.tong_con_no.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              </div>

              {expanded.has(debt.customer_id) && (
                <div className="debt-card-details">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã HĐ</TableHead>
                        <TableHead>Giá trị</TableHead>
                        <TableHead>Đã trả</TableHead>
                        <TableHead>Còn nợ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead style={{ width: 50 }}></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {debt.contracts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.ma_hd}</TableCell>
                          <TableCell>{c.gia_tri.toLocaleString("vi-VN")}đ</TableCell>
                          <TableCell style={{ color: "var(--primary-700)" }}>
                            {c.so_tien_da_tra.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell style={{ color: "var(--danger-500)", fontWeight: 600 }}>
                            {c.con_no.toLocaleString("vi-VN")}đ
                          </TableCell>
                          <TableCell>
                            <span
                              className={`admin-badge ${
                                c.trang_thai_thanh_toan === "Quá hạn"
                                  ? "red"
                                  : c.trang_thai_thanh_toan === "Đã cọc"
                                  ? "amber"
                                  : "gray"
                              }`}
                            >
                              {c.trang_thai_thanh_toan}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn-action danger"
                              title="Xóa hợp đồng"
                              onClick={() => { setDeletingContractId(c.id); setDeletingContractMaHd(c.ma_hd); setDeleteContractOpen(true); }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={deleteContractOpen} onOpenChange={setDeleteContractOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa hợp đồng</DialogTitle>
          </DialogHeader>
          <p>Xóa hợp đồng <strong>{deletingContractMaHd}</strong> và tất cả thanh toán liên quan?</p>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setDeleteContractOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDeleteContract}>Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
