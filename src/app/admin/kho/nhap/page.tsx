"use client";

import { useEffect, useState } from "react";
import { createTransaction, fetchStock, type StockItem } from "@/lib/api/inventory.api";
import { createChemical, type CreateChemicalInput } from "@/lib/api/chemicals.api";
import { createSupply, type CreateSupplyInput } from "@/lib/api/supplies.api";
import { fetchSuppliers } from "@/lib/api/suppliers.api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ArrowDownCircle, Plus, Package2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SearchSelect from "@/components/admin/SearchSelect";

type Mode = "select" | "new";

export default function ImportInventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<StockItem[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; ten_ncc: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [itemType, setItemType] = useState<"chemicals" | "supplies">("chemicals");
  const [mode, setMode] = useState<Mode>("select");

  // Import fields (shared)
  const [itemId, setItemId] = useState("");
  const [soLuong, setSoLuong] = useState("");
  const [donVi, setDonVi] = useState("");
  const [nhaCungCap, setNhaCungCap] = useState("");
  const [giaNhap, setGiaNhap] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  // New chemical form
  const [chemForm, setChemForm] = useState({
    ten_thuong_mai: "", hoat_chat: "", doi_tuong: "", dang_su_dung: "",
    don_vi_tinh: "", supplier_id: "", quy_cach: "", don_gia: "", vat_pct: "0", ghi_chu: "",
  });

  // New supply form
  const [supForm, setSupForm] = useState({
    ten_vat_tu: "", loai_vt: "", don_vi_tinh: "", supplier_id: "",
    quy_cach: "", don_gia: "", vat_pct: "0", ghi_chu: "",
  });

  useEffect(() => { loadData(); }, []);

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

  // Reset when switching type or mode
  const handleTypeChange = (t: "chemicals" | "supplies") => {
    setItemType(t); setItemId(""); setDonVi("");
    setChemForm({ ten_thuong_mai: "", hoat_chat: "", doi_tuong: "", dang_su_dung: "", don_vi_tinh: "", supplier_id: "", quy_cach: "", don_gia: "", vat_pct: "0", ghi_chu: "" });
    setSupForm({ ten_vat_tu: "", loai_vt: "", don_vi_tinh: "", supplier_id: "", quy_cach: "", don_gia: "", vat_pct: "0", ghi_chu: "" });
  };

  const handleModeChange = (m: Mode) => {
    setMode(m); setItemId(""); setDonVi("");
  };

  // Create new item, then auto-fill the import form
  const handleCreateNew = async () => {
    setSaving(true);
    try {
      if (itemType === "chemicals") {
        if (!chemForm.ten_thuong_mai || !chemForm.don_vi_tinh) {
          toast.error("Nhập tên thương mại và đơn vị tính"); setSaving(false); return;
        }
        const sup = suppliers.find((s) => s.id === chemForm.supplier_id);
        const input: CreateChemicalInput = {
          ten_thuong_mai: chemForm.ten_thuong_mai,
          hoat_chat: chemForm.hoat_chat || null,
          doi_tuong: chemForm.doi_tuong || null,
          dang_su_dung: chemForm.dang_su_dung || null,
          don_vi_tinh: chemForm.don_vi_tinh,
          supplier_id: chemForm.supplier_id || null,
          nha_cung_cap: sup?.ten_ncc || null,
          quy_cach: chemForm.quy_cach || null,
          don_gia: Number(chemForm.don_gia) || 0,
          vat_pct: Number(chemForm.vat_pct) || 0,
          so_luong_ton: 0, nguong_canh_bao: 5, ghi_chu: chemForm.ghi_chu || null,
        };
        const created = await createChemical(input);
        toast.success("Đã tạo hóa chất mới — tiến hành nhập kho");
        const newItems = await fetchStock();
        setItems(newItems);
        setItemId(created.id);
        setDonVi(chemForm.don_vi_tinh);
        if (chemForm.supplier_id) setNhaCungCap(sup?.ten_ncc || "");
      } else {
        if (!supForm.ten_vat_tu || !supForm.don_vi_tinh) {
          toast.error("Nhập tên vật tư và đơn vị tính"); setSaving(false); return;
        }
        const sup = suppliers.find((s) => s.id === supForm.supplier_id);
        const input: CreateSupplyInput = {
          ten_vat_tu: supForm.ten_vat_tu,
          loai_vt: supForm.loai_vt || null,
          don_vi_tinh: supForm.don_vi_tinh,
          supplier_id: supForm.supplier_id || null,
          nha_cung_cap: sup?.ten_ncc || null,
          quy_cach: supForm.quy_cach || null,
          don_gia: Number(supForm.don_gia) || 0,
          vat_pct: Number(supForm.vat_pct) || 0,
          so_luong_ton: 0, nguong_canh_bao: 5, ghi_chu: supForm.ghi_chu || null,
        };
        const created = await createSupply(input);
        toast.success("Đã tạo vật tư mới — tiến hành nhập kho");
        const newItems = await fetchStock();
        setItems(newItems);
        setItemId(created.id);
        setDonVi(supForm.don_vi_tinh);
        if (supForm.supplier_id) setNhaCungCap(sup?.ten_ncc || "");
      }
      // Switch to select mode so user fills in quantity
      setMode("select");
    } catch (e) { toast.error(`Lỗi tạo mới: ${e instanceof Error ? e.message : e}`); }
    finally { setSaving(false); }
  };

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

  if (loading) return <div className="empty-state"><p>Đang tải...</p></div>;

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
            <p className="admin-page-subtitle">Bổ sung hoặc đăng ký mặt hàng mới</p>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: 640 }}>
        {/* Step 1: Chọn loại */}
        <div className="admin-form-group">
          <label className="admin-label">Loại hàng</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["chemicals", "supplies"] as const).map((t) => (
              <button
                key={t}
                className={`p-btn ${itemType === t ? "p-btn-primary" : "p-btn-outline"}`}
                style={{ flex: 1 }}
                onClick={() => handleTypeChange(t)}
              >
                {t === "chemicals" ? "🧪 Hóa chất" : "📦 Vật tư"}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Chọn mode */}
        <div className="admin-form-group">
          <label className="admin-label">Loại nhập</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`p-btn ${mode === "select" ? "p-btn-primary" : "p-btn-outline"}`}
              style={{ flex: 1 }}
              onClick={() => handleModeChange("select")}
            >
              Bổ sung tồn kho
            </button>
            <button
              className={`p-btn ${mode === "new" ? "p-btn-primary" : "p-btn-outline"}`}
              style={{ flex: 1 }}
              onClick={() => handleModeChange("new")}
            >
              <Plus size={14} /> Đăng ký mặt hàng mới
            </button>
          </div>
        </div>

        <hr style={{ margin: "4px 0 16px", border: "none", borderTop: "1px solid var(--neutral-100)" }} />

        {/* ===== MODE: SELECT EXISTING ===== */}
        {mode === "select" && (
          <>
            <div className="admin-form-group">
              <label className="admin-label">{itemType === "chemicals" ? "Hóa chất" : "Vật tư"} *</label>
              <SearchSelect
                placeholder="Tìm theo tên, mã, quy cách..."
                value={itemId}
                onChange={(v) => setItemId(v)}
                options={filteredItems.map((i) => ({
                  value: i.id,
                  label: `${i.code} — ${i.name}${(i as StockItem & { quy_cach?: string }).quy_cach ? ` (${(i as StockItem & { quy_cach?: string }).quy_cach})` : ""} · Tồn: ${i.so_luong_ton}`,
                }))}
              />
              {selectedItem && (
                <p style={{ fontSize: 12, color: "var(--neutral-500)", marginTop: 4 }}>
                  Tồn hiện tại: <strong style={{ color: (selectedItem.so_luong_ton ?? 0) <= (selectedItem.nguong_canh_bao ?? 5) ? "var(--danger-500)" : "inherit" }}>{selectedItem.so_luong_ton}</strong> {selectedItem.don_vi || ""}
                </p>
              )}
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
          </>
        )}

        {/* ===== MODE: NEW ITEM ===== */}
        {mode === "new" && (
          <>
            <div style={{ marginBottom: 12, padding: "8px 12px", background: "var(--primary-50)", borderRadius: 8, fontSize: 13, color: "var(--primary-700)" }}>
              <Package2 size={14} style={{ display: "inline", marginRight: 6 }} />
              Tạo {itemType === "chemicals" ? "hóa chất" : "vật tư"} mới. Sau khi tạo sẽ tự động chuyển sang bước nhập số lượng.
            </div>

            {itemType === "chemicals" ? (
              <div className="form-grid">
                <div className="form-field">
                  <Label>Tên thương mại *</Label>
                  <Input placeholder="VD: Fendona 10SC" value={chemForm.ten_thuong_mai} onChange={(e) => setChemForm({ ...chemForm, ten_thuong_mai: e.target.value })} />
                </div>
                <div className="form-field">
                  <Label>Quy cách</Label>
                  <Input placeholder="VD: Chai 1L, Hộp 500ml" value={chemForm.quy_cach} onChange={(e) => setChemForm({ ...chemForm, quy_cach: e.target.value })} />
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
                  <Label>Đơn vị tính *</Label>
                  <Input placeholder="VD: Lít, Chai" value={chemForm.don_vi_tinh} onChange={(e) => setChemForm({ ...chemForm, don_vi_tinh: e.target.value })} />
                </div>
                <div className="form-field">
                  <Label>Đơn giá (chưa VAT)</Label>
                  <Input type="number" min={0} placeholder="0" value={chemForm.don_gia} onChange={(e) => setChemForm({ ...chemForm, don_gia: e.target.value })} />
                </div>
                <div className="form-field">
                  <Label>VAT (%)</Label>
                  <select className="native-select" value={chemForm.vat_pct} onChange={(e) => setChemForm({ ...chemForm, vat_pct: e.target.value })}>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="8">8%</option>
                    <option value="10">10%</option>
                  </select>
                </div>
                <div className="form-field full-width">
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
                  <Label>Quy cách</Label>
                  <Input placeholder="VD: Hộp 10 cái, Túi 5kg" value={supForm.quy_cach} onChange={(e) => setSupForm({ ...supForm, quy_cach: e.target.value })} />
                </div>
                <div className="form-field">
                  <Label>Loại vật tư</Label>
                  <Input placeholder="VD: Bẫy, Thiết bị" value={supForm.loai_vt} onChange={(e) => setSupForm({ ...supForm, loai_vt: e.target.value })} />
                </div>
                <div className="form-field">
                  <Label>Đơn vị tính *</Label>
                  <Input placeholder="VD: Cái, Hộp" value={supForm.don_vi_tinh} onChange={(e) => setSupForm({ ...supForm, don_vi_tinh: e.target.value })} />
                </div>
                <div className="form-field">
                  <Label>Đơn giá (chưa VAT)</Label>
                  <Input type="number" min={0} placeholder="0" value={supForm.don_gia} onChange={(e) => setSupForm({ ...supForm, don_gia: e.target.value })} />
                </div>
                <div className="form-field">
                  <Label>VAT (%)</Label>
                  <select className="native-select" value={supForm.vat_pct} onChange={(e) => setSupForm({ ...supForm, vat_pct: e.target.value })}>
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="8">8%</option>
                    <option value="10">10%</option>
                  </select>
                </div>
                <div className="form-field full-width">
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="admin-btn admin-btn-outline" onClick={() => handleModeChange("select")}>Hủy</button>
              <button className="admin-btn admin-btn-primary" onClick={handleCreateNew} disabled={saving}>
                <Plus size={14} /> {saving ? "Đang tạo..." : `Tạo ${itemType === "chemicals" ? "hóa chất" : "vật tư"} & nhập kho`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
