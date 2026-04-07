"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchQuotations,
  deleteQuotation,
  updateQuotation,
  type Quotation,
} from "@/lib/api/quotations.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  FileText,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  "Nháp": "gray",
  "Đã gửi": "blue",
  "Khách đồng ý": "green",
  "Từ chối": "red",
  "Hết hạn": "amber",
};

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await fetchQuotations();
      setQuotations(data);
    } catch {
      toast.error("Lỗi tải danh sách báo giá");
    } finally {
      setLoading(false);
    }
  }

  const filtered = quotations.filter((q) => {
    const matchSearch =
      !search ||
      q.ma_bg.toLowerCase().includes(search.toLowerCase()) ||
      q.customers?.ten_kh.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || q.trang_thai === filterStatus;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  async function handleDelete(id: string) {
    if (!confirm("Xóa báo giá này?")) return;
    try {
      await deleteQuotation(id);
      setQuotations((prev) => prev.filter((q) => q.id !== id));
      toast.success("Đã xóa báo giá");
    } catch {
      toast.error("Lỗi xóa báo giá");
    }
  }

  async function handleUpdateStatus(id: string, trang_thai: string) {
    try {
      const updated = await updateQuotation(id, { trang_thai });
      setQuotations((prev) => prev.map((q) => (q.id === id ? updated : q)));
      toast.success(`Đã cập nhật: ${trang_thai}`);
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Báo giá</h1>
          <p className="admin-page-subtitle">
            Quản lý báo giá dịch vụ ({filtered.length})
          </p>
        </div>
        <Link href="/admin/bao-gia/tao-moi" className="admin-btn admin-btn-primary">
          <Plus size={16} /> Tạo báo giá
        </Link>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            placeholder="Tìm mã BG, khách hàng..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="admin-input"
          style={{ width: 180 }}
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Nháp">Nháp</option>
          <option value="Đã gửi">Đã gửi</option>
          <option value="Khách đồng ý">Khách đồng ý</option>
          <option value="Từ chối">Từ chối</option>
          <option value="Hết hạn">Hết hạn</option>
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><p>Đang tải...</p></div>
      ) : paginated.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} strokeWidth={1} />
          <p>Chưa có báo giá nào</p>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã BG</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>VAT</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hiệu lực</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((q) => (
                  <tr key={q.id}>
                    <td className="font-medium">{q.ma_bg}</td>
                    <td>{q.customers?.ten_kh || q.service_requests?.ten_kh || "—"}</td>
                    <td>{q.tong_tien.toLocaleString("vi-VN")}đ</td>
                    <td>{q.vat.toLocaleString("vi-VN")}đ</td>
                    <td className="font-medium">{q.tong_thanh_toan.toLocaleString("vi-VN")}đ</td>
                    <td>
                      <span className={`admin-badge ${STATUS_COLORS[q.trang_thai] || "gray"}`}>
                        {q.trang_thai}
                      </span>
                    </td>
                    <td>{formatDate(q.ngay_tao)}</td>
                    <td>{q.ngay_hieu_luc ? formatDate(q.ngay_hieu_luc) : "—"}</td>
                    <td>
                      <div className="admin-actions">
                        <Link
                          href={`/admin/bao-gia/${q.id}`}
                          className="admin-action-btn"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </Link>
                        {q.trang_thai === "Nháp" && (
                          <button
                            className="admin-action-btn"
                            title="Gửi báo giá"
                            onClick={() => handleUpdateStatus(q.id, "Đã gửi")}
                          >
                            <Send size={16} />
                          </button>
                        )}
                        {q.trang_thai === "Đã gửi" && (
                          <>
                            <button
                              className="admin-action-btn text-green-600"
                              title="Khách đồng ý"
                              onClick={() => handleUpdateStatus(q.id, "Khách đồng ý")}
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              className="admin-action-btn text-red-600"
                              title="Từ chối"
                              onClick={() => handleUpdateStatus(q.id, "Từ chối")}
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button
                          className="admin-action-btn text-red-600"
                          title="Xóa"
                          onClick={() => handleDelete(q.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      )}
    </div>
  );
}
