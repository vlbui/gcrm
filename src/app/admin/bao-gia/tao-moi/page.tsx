"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createQuotation,
  type QuotationItem,
} from "@/lib/api/quotations.api";
import { fetchCustomers, type Customer } from "@/lib/api/customers.api";
import { fetchServiceRequests, type ServiceRequest } from "@/lib/api/serviceRequests.api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import Link from "next/link";
import DateInput from "@/components/admin/DateInput";

const DEFAULT_DIEU_KHOAN = `1. Báo giá có hiệu lực 30 ngày kể từ ngày phát hành.
2. Thanh toán 50% khi ký hợp đồng, 50% sau khi hoàn thành.
3. Bảo hành theo quy định từng gói dịch vụ.
4. Giá trên chưa bao gồm phí phát sinh ngoài phạm vi báo giá.`;

export default function CreateQuotationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [serviceRequestId, setServiceRequestId] = useState("");
  const [ngayHieuLuc, setNgayHieuLuc] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [dieuKhoan, setDieuKhoan] = useState(DEFAULT_DIEU_KHOAN);
  const [vatRate, setVatRate] = useState(10);
  const [items, setItems] = useState<QuotationItem[]>([
    { dich_vu: "", mo_ta: "", don_vi: "lần", so_luong: 1, don_gia: 0, thanh_tien: 0 },
  ]);

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchServiceRequests()]).then(
      ([c, r]) => {
        setCustomers(c);
        setRequests(r);
      }
    );
  }, []);

  const updateItem = (index: number, field: keyof QuotationItem, value: string | number) => {
    setItems((prev) => {
      const newItems = [...prev];
      const item = { ...newItems[index], [field]: value };
      item.thanh_tien = item.so_luong * item.don_gia;
      newItems[index] = item;
      return newItems;
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { dich_vu: "", mo_ta: "", don_vi: "lần", so_luong: 1, don_gia: 0, thanh_tien: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const tongTien = items.reduce((sum, item) => sum + item.thanh_tien, 0);
  const vatAmount = Math.round(tongTien * vatRate / 100);
  const tongThanhToan = tongTien + vatAmount;

  // Auto-fill from service request
  const handleSelectRequest = (id: string) => {
    setServiceRequestId(id);
    const req = requests.find((r) => r.id === id);
    if (req) {
      // Try to find matching customer
      const matchCust = customers.find(
        (c) => c.sdt === req.sdt || c.ten_kh === req.ten_kh
      );
      if (matchCust) setCustomerId(matchCust.id);

      if (req.loai_con_trung && items[0].dich_vu === "") {
        updateItem(0, "dich_vu", `Dịch vụ ${req.loai_con_trung}`);
      }
    }
  };

  const handleSubmit = async () => {
    if (!customerId) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }
    if (items.some((item) => !item.dich_vu || item.don_gia <= 0)) {
      toast.error("Vui lòng điền đầy đủ dịch vụ và đơn giá");
      return;
    }

    setSaving(true);
    try {
      await createQuotation({
        customer_id: customerId,
        service_request_id: serviceRequestId || null,
        noi_dung: items,
        tong_tien: tongTien,
        vat: vatAmount,
        tong_thanh_toan: tongThanhToan,
        ghi_chu: ghiChu || undefined,
        dieu_khoan: dieuKhoan || undefined,
        ngay_hieu_luc: ngayHieuLuc || undefined,
      });
      toast.success("Đã tạo báo giá thành công");
      router.push("/admin/bao-gia");
    } catch {
      toast.error("Lỗi tạo báo giá");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/bao-gia" className="admin-btn admin-btn-ghost">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="admin-page-title">Tạo báo giá mới</h1>
            <p className="admin-page-subtitle">Tạo báo giá dịch vụ cho khách hàng</p>
          </div>
        </div>
      </div>

      <div className="quotation-form">
        {/* Customer & Request Selection */}
        <div className="admin-card">
          <h3 className="admin-card-title">Thông tin khách hàng</h3>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Khách hàng *</label>
              <select
                className="admin-input"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">— Chọn khách hàng —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ma_kh} — {c.ten_kh} ({c.sdt})
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Từ yêu cầu (tùy chọn)</label>
              <select
                className="admin-input"
                value={serviceRequestId}
                onChange={(e) => handleSelectRequest(e.target.value)}
              >
                <option value="">— Không —</option>
                {requests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.ma_yc} — {r.ten_kh} ({r.loai_con_trung || "Chung"})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-label">Ngày hiệu lực</label>
              <DateInput value={ngayHieuLuc} onChange={(v) => setNgayHieuLuc(v)} />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Thuế VAT (%)</label>
              <input
                type="number"
                className="admin-input"
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                min={0}
                max={100}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 className="admin-card-title" style={{ margin: 0 }}>Chi tiết dịch vụ</h3>
            <button className="admin-btn admin-btn-outline" onClick={addItem}>
              <Plus size={14} /> Thêm dòng
            </button>
          </div>

          <div className="quotation-items">
            <div className="quotation-items-header">
              <span>Dịch vụ</span>
              <span>Mô tả</span>
              <span>ĐVT</span>
              <span>SL</span>
              <span>Đơn giá</span>
              <span>Thành tiền</span>
              <span></span>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="quotation-items-row">
                <input
                  className="admin-input"
                  placeholder="Tên dịch vụ"
                  value={item.dich_vu}
                  onChange={(e) => updateItem(idx, "dich_vu", e.target.value)}
                />
                <input
                  className="admin-input"
                  placeholder="Mô tả"
                  value={item.mo_ta}
                  onChange={(e) => updateItem(idx, "mo_ta", e.target.value)}
                />
                <input
                  className="admin-input"
                  value={item.don_vi}
                  onChange={(e) => updateItem(idx, "don_vi", e.target.value)}
                  style={{ maxWidth: 80 }}
                />
                <input
                  className="admin-input"
                  type="number"
                  min={1}
                  value={item.so_luong}
                  onChange={(e) => updateItem(idx, "so_luong", Number(e.target.value))}
                  style={{ maxWidth: 70 }}
                />
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  value={item.don_gia}
                  onChange={(e) => updateItem(idx, "don_gia", Number(e.target.value))}
                />
                <div className="quotation-item-total">
                  {item.thanh_tien.toLocaleString("vi-VN")}đ
                </div>
                <button
                  className="admin-action-btn text-red-600"
                  onClick={() => removeItem(idx)}
                  disabled={items.length <= 1}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="quotation-summary">
            <div className="quotation-summary-row">
              <span>Tổng tiền dịch vụ:</span>
              <span>{tongTien.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="quotation-summary-row">
              <span>VAT ({vatRate}%):</span>
              <span>{vatAmount.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="quotation-summary-row total">
              <span>Tổng thanh toán:</span>
              <span>{tongThanhToan.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="admin-card">
          <h3 className="admin-card-title">Ghi chú & Điều khoản</h3>
          <div className="admin-form-group">
            <label className="admin-label">Ghi chú</label>
            <textarea
              className="admin-input"
              rows={3}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Ghi chú thêm cho báo giá..."
            />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Điều khoản</label>
            <textarea
              className="admin-input"
              rows={5}
              value={dieuKhoan}
              onChange={(e) => setDieuKhoan(e.target.value)}
            />
          </div>
        </div>

        <div className="quotation-form-actions">
          <Link href="/admin/bao-gia" className="admin-btn admin-btn-outline">
            Hủy
          </Link>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? "Đang lưu..." : "Tạo báo giá"}
          </button>
        </div>
      </div>
    </div>
  );
}
