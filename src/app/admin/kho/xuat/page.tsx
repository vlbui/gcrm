"use client";

import { useEffect, useState } from "react";
import { createTransaction, fetchStock, type StockItem } from "@/lib/api/inventory.api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ArrowUpCircle } from "lucide-react";
import SearchSelect from "@/components/admin/SearchSelect";

export default function ExportInventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [itemType, setItemType] = useState<"chemicals" | "supplies">("chemicals");
  const [itemId, setItemId] = useState("");
  const [soLuong, setSoLuong] = useState("");
  const [donVi, setDonVi] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  useEffect(() => {
    fetchStock()
      .then(setItems)
      .catch(() => toast.error("Lỗi tải"))
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
    if (selectedItem && Number(soLuong) > selectedItem.so_luong_ton) {
      toast.error(`Tồn kho chỉ còn ${selectedItem.so_luong_ton}. Không đủ xuất.`);
      return;
    }
    setSaving(true);
    try {
      await createTransaction({
        loai: itemType,
        item_id: itemId,
        loai_giao_dich: "Xuất",
        so_luong: Number(soLuong),
        don_vi: donVi || undefined,
        ghi_chu: ghiChu || undefined,
      });
      toast.success("Xuất kho thành công");
      router.push("/admin/kho/ton");
    } catch {
      toast.error("Lỗi xuất kho");
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
              <ArrowUpCircle size={20} style={{ color: "#EF4444" }} /> Xuất kho
            </h1>
            <p className="admin-page-subtitle">Xuất hàng từ kho</p>
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
          <SearchSelect
            placeholder="Tìm theo tên, mã..."
            value={itemId}
            onChange={(v) => setItemId(v)}
            options={filteredItems.map((i) => ({
              value: i.id,
              label: `${i.code} — ${i.name} (Tồn: ${i.so_luong_ton})`,
            }))}
          />
        </div>
        {selectedItem && (
          <div style={{ padding: "8px 12px", background: "var(--neutral-50)", borderRadius: "var(--radius-sm)", fontSize: 13, marginBottom: 12 }}>
            Tồn kho hiện tại: <strong>{selectedItem.so_luong_ton}</strong> {selectedItem.don_vi || "đơn vị"}
          </div>
        )}
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label className="admin-label">Số lượng xuất *</label>
            <input type="number" className="admin-input" min={1} max={selectedItem?.so_luong_ton || 9999} value={soLuong} onChange={(e) => setSoLuong(e.target.value)} placeholder="0" />
          </div>
          <div className="admin-form-group">
            <label className="admin-label">Đơn vị</label>
            <input className="admin-input" value={donVi} onChange={(e) => setDonVi(e.target.value)} />
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-label">Ghi chú / Lý do xuất</label>
          <textarea className="admin-input" rows={2} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} placeholder="VD: Xuất cho HĐ GS-2026-001..." />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Link href="/admin/kho/ton" className="admin-btn admin-btn-outline">Hủy</Link>
          <button className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={saving}>
            <Save size={14} /> {saving ? "Đang lưu..." : "Xuất kho"}
          </button>
        </div>
      </div>
    </div>
  );
}
