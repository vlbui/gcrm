"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        <span>
          Hiển thị <strong>{from}</strong>–<strong>{to}</strong> / <strong>{total}</strong> dòng
        </span>
        <div className="pagination-size">
          <label>Số dòng:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          title="Trang đầu"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="pagination-page">
          Trang <strong>{total === 0 ? 0 : page}</strong> / <strong>{totalPages}</strong>
        </span>

        <button
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </button>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="Trang cuối"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
