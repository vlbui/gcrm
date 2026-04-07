"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchQuotation,
  updateQuotation,
  type Quotation,
} from "@/lib/api/quotations.api";
import { createContract } from "@/lib/api/contracts.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Building2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchQuotation(id)
        .then(setQuotation)
        .catch(() => toast.error("Lỗi tải báo giá"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateStatus = async (trang_thai: string) => {
    if (!quotation) return;
    try {
      const updated = await updateQuotation(quotation.id, { trang_thai });
      setQuotation(updated);
      toast.success(`Đã cập nhật: ${trang_thai}`);
    } catch {
      toast.error("Lỗi cập nhật");
    }
  };

  const handleConvertToContract = async () => {
    if (!quotation || !quotation.customer_id) return;
    if (!confirm("Chuyển báo giá này thành hợp đồng?")) return;

    try {
      const serviceNames = quotation.noi_dung.map((i) => i.dich_vu).join(", ");
      await createContract({
        customer_id: quotation.customer_id,
        dich_vu: serviceNames,
        gia_tri: quotation.tong_thanh_toan,
        trang_thai: "Mới",
        dien_tich: null,
        ngay_bat_dau: new Date().toISOString().split("T")[0],
        ngay_ket_thuc: null,
        ghi_chu: `Từ báo giá ${quotation.ma_bg}`,
      });
      await updateQuotation(quotation.id, { trang_thai: "Khách đồng ý" });
      toast.success("Đã tạo hợp đồng từ báo giá");
      router.push("/admin/hop-dong");
    } catch {
      toast.error("Lỗi tạo hợp đồng");
    }
  };

  if (loading) {
    return <div className="empty-state"><p>Đang tải...</p></div>;
  }

  if (!quotation) {
    return <div className="empty-state"><p>Không tìm thấy báo giá</p></div>;
  }

  const customer = quotation.customers;

  return (
    <div>
      <div className="admin-page-header no-print">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/bao-gia" className="admin-btn admin-btn-ghost">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="admin-page-title">{quotation.ma_bg}</h1>
            <p className="admin-page-subtitle">
              Chi tiết báo giá —{" "}
              <span className={`admin-badge ${quotation.trang_thai === "Khách đồng ý" ? "green" : quotation.trang_thai === "Từ chối" ? "red" : "blue"}`}>
                {quotation.trang_thai}
              </span>
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {quotation.trang_thai === "Nháp" && (
            <button className="admin-btn admin-btn-outline" onClick={() => handleUpdateStatus("Đã gửi")}>
              <Send size={16} /> Gửi báo giá
            </button>
          )}
          {quotation.trang_thai === "Đã gửi" && (
            <>
              <button className="admin-btn admin-btn-primary" onClick={() => handleUpdateStatus("Khách đồng ý")}>
                <CheckCircle size={16} /> Đồng ý
              </button>
              <button className="admin-btn admin-btn-outline" onClick={() => handleUpdateStatus("Từ chối")}>
                <XCircle size={16} /> Từ chối
              </button>
            </>
          )}
          {quotation.trang_thai === "Khách đồng ý" && quotation.customer_id && (
            <button className="admin-btn admin-btn-primary" onClick={handleConvertToContract}>
              <FileText size={16} /> Tạo hợp đồng
            </button>
          )}
          <button className="admin-btn admin-btn-outline" onClick={handlePrint}>
            <Printer size={16} /> In / PDF
          </button>
        </div>
      </div>

      {/* Printable Quotation */}
      <div className="quotation-print" ref={printRef}>
        <div className="quotation-print-header">
          <div className="quotation-print-company">
            <h2>CÔNG TY CỔ PHẦN LÁ CHẮN XANH</h2>
            <p>GREENSHIELD JSC</p>
            <p style={{ fontSize: 12, color: "#666" }}>
              Số 7, ngõ 125 Trung Kính, Yên Hòa, Cầu Giấy, Hà Nội
            </p>
            <p style={{ fontSize: 12, color: "#666" }}>
              MST: 0110328932 · Hotline: 085 9955 969
            </p>
          </div>
          <div className="quotation-print-title">
            <h1>BÁO GIÁ DỊCH VỤ</h1>
            <p>Số: {quotation.ma_bg}</p>
            <p>Ngày: {formatDate(quotation.ngay_tao)}</p>
            {quotation.ngay_hieu_luc && (
              <p>Hiệu lực đến: {formatDate(quotation.ngay_hieu_luc)}</p>
            )}
          </div>
        </div>

        {customer && (
          <div className="quotation-print-customer">
            <h3>Thông tin khách hàng</h3>
            <div className="quotation-print-customer-grid">
              <div><Building2 size={14} /> <strong>{customer.ten_kh}</strong> ({customer.ma_kh})</div>
              {customer.sdt && <div><Phone size={14} /> {customer.sdt}</div>}
              {customer.email && <div><Mail size={14} /> {customer.email}</div>}
              {customer.dia_chi && <div><MapPin size={14} /> {customer.dia_chi}</div>}
            </div>
          </div>
        )}

        <table className="quotation-print-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Dịch vụ</th>
              <th>Mô tả</th>
              <th>ĐVT</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {quotation.noi_dung.map((item, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: "center" }}>{idx + 1}</td>
                <td>{item.dich_vu}</td>
                <td>{item.mo_ta}</td>
                <td style={{ textAlign: "center" }}>{item.don_vi}</td>
                <td style={{ textAlign: "center" }}>{item.so_luong}</td>
                <td style={{ textAlign: "right" }}>{item.don_gia.toLocaleString("vi-VN")}đ</td>
                <td style={{ textAlign: "right" }}>{item.thanh_tien.toLocaleString("vi-VN")}đ</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={6} style={{ textAlign: "right", fontWeight: 600 }}>Tổng tiền:</td>
              <td style={{ textAlign: "right" }}>{quotation.tong_tien.toLocaleString("vi-VN")}đ</td>
            </tr>
            <tr>
              <td colSpan={6} style={{ textAlign: "right", fontWeight: 600 }}>VAT:</td>
              <td style={{ textAlign: "right" }}>{quotation.vat.toLocaleString("vi-VN")}đ</td>
            </tr>
            <tr className="quotation-print-total-row">
              <td colSpan={6} style={{ textAlign: "right", fontWeight: 700 }}>TỔNG THANH TOÁN:</td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>{quotation.tong_thanh_toan.toLocaleString("vi-VN")}đ</td>
            </tr>
          </tfoot>
        </table>

        {quotation.ghi_chu && (
          <div className="quotation-print-section">
            <h3>Ghi chú</h3>
            <p>{quotation.ghi_chu}</p>
          </div>
        )}

        {quotation.dieu_khoan && (
          <div className="quotation-print-section">
            <h3>Điều khoản</h3>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 13 }}>
              {quotation.dieu_khoan}
            </pre>
          </div>
        )}

        <div className="quotation-print-signatures">
          <div>
            <p><strong>ĐẠI DIỆN BÊN BÁN</strong></p>
            <p style={{ marginTop: 60, fontStyle: "italic" }}>(Ký, ghi rõ họ tên)</p>
          </div>
          <div>
            <p><strong>ĐẠI DIỆN BÊN MUA</strong></p>
            <p style={{ marginTop: 60, fontStyle: "italic" }}>(Ký, ghi rõ họ tên)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
