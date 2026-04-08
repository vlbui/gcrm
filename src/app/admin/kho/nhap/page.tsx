"use client";

import { useEffect, useState } from "react";
import { createTransaction, fetchStock, type StockItem } from "@/lib/api/inventory.api";
import { createChemical, type CreateChemicalInput } from "@/lib/api/chemicals.api";
import { createSupply, type CreateSupplyInput } from "@/lib/api/supplies.api";
import { fetchSuppliers } from "@/lib/api/suppliers.api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ArrowDownCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import SearchSelect from "@/components/admin/SearchSelect";

export default function ImportInventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; ten_ncc: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Import form
  const [itemType, setItemType] = useState<"chemicals" | "supplies">("chemicals");
  const [itemId, setItemId] = useState("");
  const [soLuong, setSoLuong] = useState("");
  const [donVi, setDonVi] = useState("");
  const [nhaCungCap, setNhaCungCap] = useState("");
  const [giaNhap, setGiaNhap] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  // Add new item dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  // Chemical fields
  const [chemForm, setChemForm] = useState({ ten_thuong_mai: "", hoat_chat: "", doi_tuong: "", dang_su_dung: "", don_vi_tinh: "", supplier_id: "", ghi_chu: "" });
  // Supply fields
  const [supForm, setSupForm] = useState({ ten_vat_tu: "", loai_vt: "", don_vi_tinh: "", supplier_id: "", ghi_chu: "" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [s, sup] = await Promise.all([fetchStock(), fetchSuppliers()]);
      setItems(s);
      setSuppliers(sup.map((x: { id: string; ten_ncc: string }) => ({ id: x.id, ten_ncc: x.ten_ncc })));
    } catch { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }

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
    } catch { toast.error("Lỗi nhập kho"); }
    finally { setSaving(false); }
  };

  // Add new chemical/supply
  const openAddNew = () => {
    setChemForm({ ten_thuong_mai: "", hoat_chat: "", doi_tuong: "", dang_su_dung: "", don_vi_tinh: "", supplier_id: "", ghi_chu: "" });
    setSupForm({ ten_vat_tu: "", loai_vt: "", don_vi_tinh: "", supplier_id: "", ghi_chu: "" });
    setAddDialogOpen(true);
  };

  const handleAddNew = async () => {
    setAddSaving(true);
    try {
      if (itemType === "chemicals") {
        if (!chemForm.ten_thuong_mai) { toast.error("Nhập tên thương mại"); setAddSaving(false); return; }
        const sup = suppliers.find((s) => s.id === chemForm.supplier_id);
        const input: CreateChemicalInput = {
          ten_thuong_mai: chemForm.ten_thuong_mai,
          hoat_chat: chemForm.hoat_chat || null,
          doi_tuong: chemForm.doi_tuong || null,
          dang_su_dung: chemForm.dang_su_dung || null,
          don_vi_tinh: chemForm.don_vi_tinh || null,
          supplier_id: chemForm.supplier_id || null,
          nha_cung_cap: sup?.ten_ncc || null,
          so_luong_ton: 0,
          nguong_canh_bao: 5,
          ghi_chu: chemForm.ghi_chu || null,
        };
        const created = await createChemical(input);
        toast.success("Đã thêm hóa chất mới");
        // Reload and select the new item
        const newItems = await fetchStock();
        setItems(newItems);
        setItemId(created.id);
        setDonVi(chemForm.don_vi_tinh || "");
      } else {
        if (!supForm.ten_vat_tu) { toast.error("Nhập tên vật tư"); setAddSaving(false); return; }
        const sup = suppliers.find((s) => s.id === supForm.supplier_id);
        const input: CreateSupplyInput = {
          ten_vat_tu: supForm.ten_vat_tu,
          loai_vt: supForm.loai_vt || null,
          don_vi_tinh: supForm.don_vi_tinh || null,
          supplier_id: supForm.supplier_id || null,
          nha_cung_cap: sup?.ten_ncc || null,
          so_luong_ton: 0,
          nguong_canh_bao: 5,
          ghi_chu: supForm.ghi_chu || null,
        };
        const created = await createSupply(input);
        toast.success("Đã thêm vật tư mới");
        const newItems = await fetchStock();
        setItems(newItems);
        setItemId(created.id);
        setDonVi(supForm.don_vi_tinh || "");
      }
      setAddDialogOpen(false);
    } catch { toast.error("Lỗi thêm mặt hàng"); }
    finally { setAddSaving(false); }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/admin/kho" className="admin-btn admin-btn-ghost">
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
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
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
            <button className="admin-btn admin-btn-outline" onClick={openAddNew} title="Thêm mới" style={{ padding: "8px" }}>
              <Plus size={16} />
            </button>
          </div>
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
            <SearchSelect
              placeholder="Tìm nhà cung cấp..."
              value={nhaCungCap}
              onChange={(v) => setNhaCungCap(v)}
              options={suppliers.map((s) => ({ value: s.ten_ncc, label: s.ten_ncc }))}
            />
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
          <Link href="/admin/kho" className="admin-btn admin-btn-outline">Hủy</Link>
          <button className="admin-btn admin-btn-primary" onClick={handleSubmit} disabled={saving}>
            <Save size={14} /> {saving ? "Đang lưu..." : "Nhập kho"}
          </button>
        </div>
      </div>

      {/* Add New Chemical/Supply Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {itemType === "chemicals" ? "Thêm hóa chất mới" : "Thêm vật tư mới"}
            </DialogTitle>
          </DialogHeader>
          {itemType === "chemicals" ? (
            <div className="form-grid">
              <div className="form-field">
                <Label>Tên thương mại *</Label>
                <Input placeholder="VD: Fendona 10SC" value={chemForm.ten_thuong_mai} onChange={(e) => setChemForm({ ...chemForm, ten_thuong_mai: e.target.value })} />
              </div>
              <div className="form-field">
                <Label>Hoạt chất</Label>
                <Input placeholder="VD: Alpha-cypermethrin" value={chemForm.hoat_chat} onChange={(e) => setChemForm({ ...chemForm, hoat_chat: e.target.value })} />
              </div>
              <div className="form-field">
                <Label>Đối tượng</Label>
                <Input placeholder="VD: Gián, Muỗi" value={chemForm.doi_tuong} onChange={(e) => setChemForm({ ...chemForm, doi_tuong: e.target.value })} />
              </div>
              <div className="form-field">
                <Label>Dạng sử dụng</Label>
                <Input placeholder="VD: Phun, Gel" value={chemForm.dang_su_dung} onChange={(e) => setChemForm({ ...chemForm, dang_su_dung: e.target.value })} />
              </div>
              <div className="form-field">
                <Label>Đơn vị tính</Label>
                <Input placeholder="VD: Lít, Chai" value={chemForm.don_vi_tinh} onChange={(e) => setChemForm({ ...chemForm, don_vi_tinh: e.target.value })} />
              </div>
              <div className="form-field">
                <Label>Nhà cung cấp</Label>
                <SearchSelect
                  placeholder="Tìm nhà cung cấp..."
                  value={chemForm.supplier_id}
                  onChange={(v) => setChemForm({ ...chemForm, supplier_id: v })}
                  options={suppliers.map((s) => ({ value: s.id, label: s.ten_ncc }))}
                />
              </div>
              <div className="form-field full-width">
                <Label>Ghi chú</Label>
                <Textarea placeholder="Ghi chú..." value={chemForm.ghi_chu} onChange={(e) => setChemForm({ ...chemForm, ghi_chu: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-field">
                <Label>Tên vật tư *</Label>
                <Input placeholder="VD: Bẫy dính chuột" value={supForm.ten_vat_tu} onChange={(e) => setSupForm({ ...supForm, ten_vat_tu: e.target.value })} />
              </div>
              <div className="form-field">
                <Label>Loại vật tư</Label>
                <Input placeholder="VD: Bẫy, Thiết bị" value={supForm.loai_vt} onChange={(e) => setSupForm({ ...supForm, loai_vt: e.target.value })} />
              </div>
              <div className="form-field">
                <Label>Đơn vị tính</Label>
                <Input placeholder="VD: Cái, Bộ" value={supForm.don_vi_tinh} onChange={(e) => setSupForm({ ...supForm, don_vi_tinh: e.target.value })} />
              </div>
              <div className="form-field">
                <Label>Nhà cung cấp</Label>
                <SearchSelect
                  placeholder="Tìm nhà cung cấp..."
                  value={supForm.supplier_id}
                  onChange={(v) => setSupForm({ ...supForm, supplier_id: v })}
                  options={suppliers.map((s) => ({ value: s.id, label: s.ten_ncc }))}
                />
              </div>
              <div className="form-field full-width">
                <Label>Ghi chú</Label>
                <Textarea placeholder="Ghi chú..." value={supForm.ghi_chu} onChange={(e) => setSupForm({ ...supForm, ghi_chu: e.target.value })} />
              </div>
            </div>
          )}
          <div className="form-actions">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleAddNew} disabled={addSaving}>
              {addSaving ? "Đang lưu..." : "Thêm mới"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
