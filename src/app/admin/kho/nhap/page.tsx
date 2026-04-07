"use client";

import { useEffect, useState } from "react";
import { createTransaction, fetchStock, type StockItem } from "@/lib/api/inventory.api";
import { fetchSuppliers } from "@/lib/api/suppliers.api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ArrowDownCircle } from "lucide-react";

export default function ImportInventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; ten_ncc: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [itemType, setItemType] = useState<"chemicals" | "supplies">("chemicals");
  const [itemId, setItemId] = useState("");
  const [soLuong, setSoLuong] = useState("");
  const [donVi, setDonVi] = useState("");
  const [nhaCungCap, setNhaCungCap] = useState("");
  const [giaNhap, setGiaNhap] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  useEffect(() => {
    Promise.all([fetchStock(), fetchSuppliers()])
      .then(([s, sup]) => {
        setItems(s);
        setSuppliers(sup.map((x: { id: string; ten_ncc: string }) => ({ id: x.id, ten_ncc: x.ten_ncc })));
      })
      .catch(() => toast.error("Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter((i) => i.type === itemType);

  const selectedItem = items.find((i) => i.id === itemId);
  useEffect(() => {
    if (selectedItem) setDonVi(selectedItem.don_vi || "");
  }, [selectedItem]);

  const handleSubmit = async () => {
    if (!itemId || !soLuong || Number(soLuong) <= 0) {
      toast.error("Vui lòng chọn mặt hàng và nhập số lượng");
      return;
    }
    setSaving(true);
    try {
      await createTransaction({
        loai: itemType,
        item_id: itemId,
        loai_giao_dich: "Nhập",
        so_luong: Number(soLuong),
        don_vi: donVi || undefined,
        nha_cung_cap: nhaCungCap || undefined,
        gia_nhap: Number(giaNhap) || undefined,
        ghi_chu: ghiChu || undefined,
      });
      toast.success("Nhập kho thành công");
      router.push("/admin/kho/ton");
    } catch {
      toast.error("Lỗi nhập kho");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/kho/ton" className="admin-btn admin-btn-ghost">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="admin-page-title">
              <ArrowDownCircle size={20} style={{ color: "#10B981" }} /> Nhập kho
            </h1>
            <p className="admin-page-subtitle">Thêm hàng vào kho</p>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: 600 }}>
        <div className="admin-form-group">
          <label className="admin-label">Loại</label>
          <select className="admin-input" value={itemType} onChange={(e) => { setItemType(e.target.value as "chemicals" | "supplies"); setItemId(""); }}>
            <option value="chemicals">Hóa chất</option>
            <option value="supplies">Vật tư</option>
          </select>
        </div>
        <div className="admin-form-group">
          <label className="admin-label">{itemType === "chemicals" ? "Tên hóa chất" : "Tên vật tư"} *</label>
          <select className="admin-input" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">— Chọn —</option>
            {filteredItems.map((i) => (
              <option key={i.id} value={i.id}>{i.code} — {i.name} (Tồn: {i.so_luong_ton})</option>
            ))}
          </select>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label">Số lượng nhập *</label>
            <input type="number" className="admin-input" min={1} value={soLuong} onChange={(e) => setSoLuong(e.target.value)} placeholder="0" />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Đơn vị</label>
            <input className="admin-input" value={donVi} onChange={(e) => setDonVi(e.target.value)} />
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label">Nhà cung cấp</label>
            <select className="admin-input" value={nhaCungCap} onChange={(e) => setNhaCungCap(e.target.value)}>
              <option value="">— Chọn —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.ten_ncc}>{s.ten_ncc}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Giá nhập (VNĐ)</label>
            <input type="number" className="admin-input" min={0} value={giaNhap} onChange={(e) => setGiaNhap(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-label">Ghi chú</label>
          <textarea className="admin-input" rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Link href="/admin/kho/ton" className="admin-btn admin-btn-outline">Hủy</Link>
          <button className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={saving}>
            <Save size={14} /> {saving ? "Đang lưu..." : "Nhập kho"}
          </button>
        </div>
      </div>
    </div>
  );
}
