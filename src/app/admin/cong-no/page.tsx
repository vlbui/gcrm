"use client";

import { useEffect, useState } from "react";
import { fetchDebts, type DebtRecord } from "@/lib/api/payments.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import {
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Wallet,
} from "lucide-react";

export default function DebtPage() {
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDebts()
      .then(setDebts)
      .catch(() => toast.error("Lỗi tải công nợ"))
      .finally(() => setLoading(false));
  }, []);

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
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Mã HĐ</th>
                        <th>Giá trị</th>
                        <th>Đã trả</th>
                        <th>Còn nợ</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debt.contracts.map((c) => (
                        <tr key={c.id}>
                          <td className="font-medium">{c.ma_hd}</td>
                          <td>{c.gia_tri.toLocaleString("vi-VN")}đ</td>
                          <td style={{ color: "var(--primary-700)" }}>
                            {c.so_tien_da_tra.toLocaleString("vi-VN")}đ
                          </td>
                          <td style={{ color: "var(--danger-500)", fontWeight: 600 }}>
                            {c.con_no.toLocaleString("vi-VN")}đ
                          </td>
                          <td>
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
