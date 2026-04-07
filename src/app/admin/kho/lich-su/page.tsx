"use client";

import { useEffect, useState } from "react";
import { fetchTransactions, type InventoryTransaction } from "@/lib/api/inventory.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import { Search, ArrowDownCircle, ArrowUpCircle, ClipboardCheck } from "lucide-react";

const GD_ICON: Record<string, React.ReactNode> = {
  "Nhập": <ArrowDownCircle size={14} style={{ color: "#10B981" }} />,
  "Xuất": <ArrowUpCircle size={14} style={{ color: "#EF4444" }} />,
  "Kiểm kê": <ClipboardCheck size={14} style={{ color: "#3B82F6" }} />,
};

const GD_COLORS: Record<string, string> = {
  "Nhập": "green",
  "Xuất": "red",
  "Kiểm kê": "blue",
};

export default function InventoryHistoryPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterGD, setFilterGD] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    fetchTransactions({ loai: filterType || undefined, loai_giao_dich: filterGD || undefined })
      .then(setTransactions)
      .catch(() => toast.error("Lỗi tải"))
      .finally(() => setLoading(false));
  }, [filterType, filterGD]);

  const filtered = transactions.filter(
    (t) =>
      !search ||
      t.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.item_code?.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lịch sử kho</h1>
          <p className="admin-page-subtitle">Lịch sử nhập xuất ({filtered.length})</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            placeholder="Tìm tên, mã..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="admin-input"
          style={{ width: 140 }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Tất cả loại</option>
          <option value="chemicals">Hóa chất</option>
          <option value="supplies">Vật tư</option>
        </select>
        <select
          className="admin-input"
          style={{ width: 140 }}
          value={filterGD}
          onChange={(e) => setFilterGD(e.target.value)}
        >
          <option value="">Tất cả GD</option>
          <option value="Nhập">Nhập</option>
          <option value="Xuất">Xuất</option>
          <option value="Kiểm kê">Kiểm kê</option>
        </select>
      </div>

      {loading ? (
        <div className="empty-state"><p>Đang tải...</p></div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Loại GD</th>
                  <th>Mặt hàng</th>
                  <th>Mã</th>
                  <th>Phân loại</th>
                  <th>Số lượng</th>
                  <th>Đơn vị</th>
                  <th>NCC</th>
                  <th>Giá nhập</th>
                  <th>Ghi chú</th>
                  <th>Ngày</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className={`admin-badge ${GD_COLORS[t.loai_giao_dich] || "gray"}`} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                        {GD_ICON[t.loai_giao_dich]} {t.loai_giao_dich}
                      </span>
                    </td>
                    <td className="font-medium">{t.item_name}</td>
                    <td>{t.item_code}</td>
                    <td>
                      <span className={`admin-badge ${t.loai === "chemicals" ? "blue" : "amber"}`}>
                        {t.loai === "chemicals" ? "Hóa chất" : "Vật tư"}
                      </span>
                    </td>
                    <td className="font-medium">{t.so_luong}</td>
                    <td>{t.don_vi || "—"}</td>
                    <td>{t.nha_cung_cap || "—"}</td>
                    <td>{t.gia_nhap ? `${t.gia_nhap.toLocaleString("vi-VN")}đ` : "—"}</td>
                    <td style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>{t.ghi_chu || "—"}</td>
                    <td>{formatDate(t.created_at)}</td>
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
