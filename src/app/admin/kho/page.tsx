"use client";

import { useEffect, useState } from "react";
import {
  fetchStock,
  createTransaction,
  fetchTransactions,
  type StockItem,
  type InventoryTransaction,
} from "@/lib/api/inventory.api";
import {
  fetchChemicals,
  createChemical,
  updateChemical,
  deleteChemical,
  type Chemical,
  type CreateChemicalInput,
} from "@/lib/api/chemicals.api";
import {
  fetchSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
  type Supply,
  type CreateSupplyInput,
} from "@/lib/api/supplies.api";
import { fetchSuppliers, type Supplier } from "@/lib/api/suppliers.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import {
  Search, AlertTriangle, Package, FlaskConical, Plus, Pencil,
  ArrowDownCircle, ArrowUpCircle, X, Trash2, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import SearchSelect from "@/components/admin/SearchSelect";
import Pagination from "@/components/admin/Pagination";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Link from "next/link";

type TabKey = "dashboard" | "chemicals" | "supplies";

export default function KhoPage() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [loading, setLoading] = useState(true);

  // Stock data
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  // Search/filter
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Chemical form
  const [chemDialogOpen, setChemDialogOpen] = useState(false);
  const [editingChem, setEditingChem] = useState<Chemical | null>(null);
  const [chemForm, setChemForm] = useState({
    ten_thuong_mai: "", hoat_chat: "", doi_tuong: "", dang_su_dung: "",
    don_vi_tinh: "", supplier_id: "", quy_cach: "", don_gia: 0, vat_pct: 0, so_luong_ton: 0, nguong_canh_bao: 5, ghi_chu: "",
  });

  // Supply form
  const [supDialogOpen, setSupDialogOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<Supply | null>(null);
  const [supForm, setSupForm] = useState({
    ten_vat_tu: "", loai_vt: "", don_vi_tinh: "", supplier_id: "",
    quy_cach: "", don_gia: 0, vat_pct: 0, so_luong_ton: 0, nguong_canh_bao: 5, ghi_chu: "",
  });

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<"chem" | "sup">("chem");
  const [deletingId, setDeletingId] = useState("");
  const [deletingName, setDeletingName] = useState("");

  // Transaction form
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txType, setTxType] = useState<"Nhập" | "Xuất">("Nhập");
  const [txItemType, setTxItemType] = useState<"chemicals" | "supplies">("chemicals");
  const [txItemId, setTxItemId] = useState("");
  const [txQty, setTxQty] = useState("");
  const [txSupplierId, setTxSupplierId] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txNote, setTxNote] = useState("");
  const [saving, setSaving] = useState(false);

  const canEdit = user?.vai_tro === "Admin" || user?.vai_tro === "Manager";

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [st, ch, su, sup, tx] = await Promise.all([
        fetchStock(), fetchChemicals(), fetchSupplies(), fetchSuppliers(), fetchTransactions(),
      ]);
      setStockItems(st);
      setChemicals(ch);
      setSupplies(su);
      setSuppliers(sup);
      setTransactions(tx);
    } catch { toast.error("Lỗi tải dữ liệu kho"); }
    finally { setLoading(false); }
  }

  // === Dashboard stats ===
  const totalChemicals = stockItems.filter((i) => i.type === "chemicals").length;
  const totalSupplies = stockItems.filter((i) => i.type === "supplies").length;
  const lowCount = stockItems.filter((i) => i.is_low).length;
  const outOfStock = stockItems.filter((i) => i.so_luong_ton === 0).length;
  const recentTx = transactions.slice(0, 10);

  // === Filtered lists ===
  const filteredChemicals = chemicals.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.ten_thuong_mai.toLowerCase().includes(q) || c.ma_hc.toLowerCase().includes(q)
      || (c.hoat_chat?.toLowerCase().includes(q) ?? false);
  });
  const pagedChemicals = filteredChemicals.slice((page - 1) * pageSize, page * pageSize);

  const filteredSupplies = supplies.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.ten_vat_tu.toLowerCase().includes(q) || s.ma_vt.toLowerCase().includes(q)
      || (s.loai_vt?.toLowerCase().includes(q) ?? false);
  });
  const pagedSupplies = filteredSupplies.slice((page - 1) * pageSize, page * pageSize);

  // === Chemical CRUD ===
  const openAddChem = () => {
    setEditingChem(null);
    setChemForm({ ten_thuong_mai: "", hoat_chat: "", doi_tuong: "", dang_su_dung: "", don_vi_tinh: "", supplier_id: "", quy_cach: "", don_gia: 0, vat_pct: 0, so_luong_ton: 0, nguong_canh_bao: 5, ghi_chu: "" });
    setChemDialogOpen(true);
  };
  const openEditChem = (c: Chemical) => {
    setEditingChem(c);
    setChemForm({
      ten_thuong_mai: c.ten_thuong_mai, hoat_chat: c.hoat_chat ?? "", doi_tuong: c.doi_tuong ?? "",
      dang_su_dung: c.dang_su_dung ?? "", don_vi_tinh: c.don_vi_tinh ?? "",
      supplier_id: c.supplier_id ?? "", quy_cach: c.quy_cach ?? "", don_gia: c.don_gia ?? 0, vat_pct: c.vat_pct ?? 0,
      so_luong_ton: c.so_luong_ton ?? 0, nguong_canh_bao: c.nguong_canh_bao ?? 5, ghi_chu: c.ghi_chu ?? "",
    });
    setChemDialogOpen(true);
  };
  const handleSaveChem = async () => {
    if (!chemForm.ten_thuong_mai || !chemForm.don_vi_tinh) { toast.error("Nhập tên và đơn vị tính"); return; }
    setSaving(true);
    try {
      const sup = suppliers.find((s) => s.id === chemForm.supplier_id);
      const input: CreateChemicalInput = {
        ten_thuong_mai: chemForm.ten_thuong_mai, hoat_chat: chemForm.hoat_chat || null,
        doi_tuong: chemForm.doi_tuong || null, dang_su_dung: chemForm.dang_su_dung || null,
        don_vi_tinh: chemForm.don_vi_tinh, supplier_id: chemForm.supplier_id || null,
        nha_cung_cap: sup?.ten_ncc || null, quy_cach: chemForm.quy_cach || null,
        don_gia: chemForm.don_gia || 0, vat_pct: chemForm.vat_pct || 0,
        so_luong_ton: chemForm.so_luong_ton, nguong_canh_bao: chemForm.nguong_canh_bao, ghi_chu: chemForm.ghi_chu || null,
      };
      if (editingChem) { await updateChemical(editingChem.id, input); toast.success("Đã cập nhật"); }
      else { await createChemical(input); toast.success("Đã thêm hóa chất"); }
      setChemDialogOpen(false);
      await loadAll();
    } catch { toast.error("Lỗi lưu"); }
    finally { setSaving(false); }
  };

  // === Supply CRUD ===
  const openAddSup = () => {
    setEditingSup(null);
    setSupForm({ ten_vat_tu: "", loai_vt: "", don_vi_tinh: "", supplier_id: "", quy_cach: "", don_gia: 0, vat_pct: 0, so_luong_ton: 0, nguong_canh_bao: 5, ghi_chu: "" });
    setSupDialogOpen(true);
  };
  const openEditSup = (s: Supply) => {
    setEditingSup(s);
    setSupForm({
      ten_vat_tu: s.ten_vat_tu, loai_vt: s.loai_vt ?? "", don_vi_tinh: s.don_vi_tinh ?? "",
      supplier_id: s.supplier_id ?? "", quy_cach: s.quy_cach ?? "", don_gia: s.don_gia ?? 0, vat_pct: s.vat_pct ?? 0,
      so_luong_ton: s.so_luong_ton ?? 0, nguong_canh_bao: s.nguong_canh_bao ?? 5, ghi_chu: s.ghi_chu ?? "",
    });
    setSupDialogOpen(true);
  };
  const handleSaveSup = async () => {
    if (!supForm.ten_vat_tu || !supForm.don_vi_tinh) { toast.error("Nhập tên và đơn vị tính"); return; }
    setSaving(true);
    try {
      const sup = suppliers.find((s) => s.id === supForm.supplier_id);
      const input: CreateSupplyInput = {
        ten_vat_tu: supForm.ten_vat_tu, loai_vt: supForm.loai_vt || null,
        don_vi_tinh: supForm.don_vi_tinh, supplier_id: supForm.supplier_id || null,
        nha_cung_cap: sup?.ten_ncc || null, quy_cach: supForm.quy_cach || null,
        don_gia: supForm.don_gia || 0, vat_pct: supForm.vat_pct || 0,
        so_luong_ton: supForm.so_luong_ton, nguong_canh_bao: supForm.nguong_canh_bao, ghi_chu: supForm.ghi_chu || null,
      };
      if (editingSup) { await updateSupply(editingSup.id, input); toast.success("Đã cập nhật"); }
      else { await createSupply(input); toast.success("Đã thêm vật tư"); }
      setSupDialogOpen(false);
      await loadAll();
    } catch { toast.error("Lỗi lưu"); }
    finally { setSaving(false); }
  };

  // === Delete ===
  const confirmDelete = (type: "chem" | "sup", id: string, name: string) => {
    setDeletingType(type); setDeletingId(id); setDeletingName(name); setDeleteOpen(true);
  };
  const handleDelete = async () => {
    try {
      if (deletingType === "chem") await deleteChemical(deletingId);
      else await deleteSupply(deletingId);
      toast.success("Đã xóa");
      setDeleteOpen(false);
      await loadAll();
    } catch { toast.error("Lỗi xóa"); }
  };

  // === Transaction (Nhập/Xuất) ===
  const openTx = (type: "Nhập" | "Xuất", itemType?: "chemicals" | "supplies") => {
    setTxType(type);
    setTxItemType(itemType || "chemicals");
    setTxItemId(""); setTxQty(""); setTxSupplierId(""); setTxPrice(""); setTxNote("");
    setTxDialogOpen(true);
  };
  const handleTx = async () => {
    if (!txItemId || !txQty || Number(txQty) <= 0) { toast.error("Chọn mặt hàng và nhập số lượng"); return; }
    if (txType === "Xuất") {
      const item = stockItems.find((i) => i.id === txItemId);
      if (item && Number(txQty) > item.so_luong_ton) { toast.error(`Tồn kho chỉ còn ${item.so_luong_ton}`); return; }
    }
    setSaving(true);
    try {
      const sup = suppliers.find((s) => s.id === txSupplierId);
      await createTransaction({
        loai: txItemType, item_id: txItemId, loai_giao_dich: txType,
        so_luong: Number(txQty), nha_cung_cap: sup?.ten_ncc || undefined,
        gia_nhap: Number(txPrice) || undefined, ghi_chu: txNote || undefined,
      });
      toast.success(`${txType} kho thành công`);
      setTxDialogOpen(false);
      await loadAll();
    } catch { toast.error("Lỗi"); }
    finally { setSaving(false); }
  };

  const txStockItems = stockItems.filter((i) => i.type === txItemType);
  const selectedTxItem = stockItems.find((i) => i.id === txItemId);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Kho</h1>
          <p className="admin-page-subtitle">Quản lý hóa chất & vật tư</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {canEdit && (
            <>
              <button className="p-btn p-btn-primary" style={{ background: "#10B981" }} onClick={() => openTx("Nhập")}>
                <ArrowDownCircle size={15} /> Nhập kho
              </button>
              <button className="p-btn p-btn-primary" style={{ background: "#EF4444" }} onClick={() => openTx("Xuất")}>
                <ArrowUpCircle size={15} /> Xuất kho
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-toolbar" style={{ gap: 0, borderBottom: "2px solid var(--neutral-100)", marginBottom: 16 }}>
        {([
          { key: "dashboard" as TabKey, label: "Tổng quan" },
          { key: "chemicals" as TabKey, label: `Hóa chất (${chemicals.length})` },
          { key: "supplies" as TabKey, label: `Vật tư (${supplies.length})` },
        ]).map((t) => (
          <button
            key={t.key}
            className={`p-btn ${tab === t.key ? "p-btn-primary" : "p-btn-ghost"}`}
            style={{ borderRadius: "8px 8px 0 0", borderBottom: tab === t.key ? "2px solid var(--primary-700)" : "none" }}
            onClick={() => { setTab(t.key); setSearch(""); setPage(1); }}
          >
            {t.key === "chemicals" && <FlaskConical size={14} />}
            {t.key === "supplies" && <Package size={14} />}
            {t.label}
          </button>
        ))}
        <Link href="/admin/kho/lich-su" className="p-btn p-btn-ghost" style={{ marginLeft: "auto", borderRadius: "8px 8px 0 0" }}>
          <History size={14} /> Lịch sử
        </Link>
      </div>

      {loading ? <div className="empty-state"><p>Đang tải...</p></div> : (
        <>
          {/* ========== DASHBOARD TAB ========== */}
          {tab === "dashboard" && (
            <div>
              {/* Stats cards */}
              <div className="dash-kpi-grid" style={{ marginBottom: 20 }}>
                <div className="dash-kpi-card" onClick={() => setTab("chemicals")} style={{ cursor: "pointer" }}>
                  <div className="dash-kpi-icon" style={{ background: "#1565C015", color: "#1565C0" }}><FlaskConical size={20} /></div>
                  <div className="dash-kpi-value">{totalChemicals}</div>
                  <div className="dash-kpi-label">Hóa chất</div>
                </div>
                <div className="dash-kpi-card" onClick={() => setTab("supplies")} style={{ cursor: "pointer" }}>
                  <div className="dash-kpi-icon" style={{ background: "#E6510015", color: "#E65100" }}><Package size={20} /></div>
                  <div className="dash-kpi-value">{totalSupplies}</div>
                  <div className="dash-kpi-label">Vật tư</div>
                </div>
                <div className="dash-kpi-card">
                  <div className="dash-kpi-icon" style={{ background: "#F59E0B15", color: "#F59E0B" }}><AlertTriangle size={20} /></div>
                  <div className="dash-kpi-value">{lowCount}</div>
                  <div className="dash-kpi-label">Dưới ngưỡng</div>
                </div>
                <div className="dash-kpi-card">
                  <div className="dash-kpi-icon" style={{ background: "#EF444415", color: "#EF4444" }}><AlertTriangle size={20} /></div>
                  <div className="dash-kpi-value">{outOfStock}</div>
                  <div className="dash-kpi-label">Hết hàng</div>
                </div>
              </div>

              {/* Low stock items */}
              {lowCount > 0 && (
                <div className="dash-list-card" style={{ marginBottom: 20 }}>
                  <div className="dash-list-header">
                    <AlertTriangle size={16} style={{ color: "#F59E0B" }} />
                    <span>Hàng dưới ngưỡng / hết hàng</span>
                  </div>
                  <div className="stock-grid">
                    {stockItems.filter((i) => i.is_low).map((item) => (
                      <div key={`${item.type}-${item.id}`} className={`stock-card ${item.so_luong_ton === 0 ? "empty" : "low"}`}>
                        <div className="stock-card-header">
                          <div className="stock-card-icon">
                            {item.type === "chemicals" ? <FlaskConical size={16} /> : <Package size={16} />}
                          </div>
                          <span className={`admin-badge ${item.type === "chemicals" ? "blue" : "amber"}`}>
                            {item.type === "chemicals" ? "HC" : "VT"}
                          </span>
                        </div>
                        <div className="stock-card-name">{item.name}</div>
                        <div className="stock-card-code">{item.code}</div>
                        <div className="stock-card-qty">
                          <span className="stock-low">{item.so_luong_ton}</span>
                          <span className="stock-unit">{item.don_vi || ""}</span>
                        </div>
                        <div className="stock-warning">
                          <AlertTriangle size={12} /> {item.so_luong_ton === 0 ? "Hết hàng" : `Ngưỡng: ${item.nguong_canh_bao}`}
                        </div>
                        {canEdit && (
                          <div className="stock-card-actions">
                            <button className="stock-action-btn" onClick={() => { setTxItemType(item.type); setTxItemId(item.id); openTx("Nhập", item.type); }} title="Nhập">
                              <ArrowDownCircle size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent transactions */}
              <div className="dash-list-card">
                <div className="dash-list-header">
                  <History size={16} />
                  <span>Giao dịch gần đây</span>
                  <Link href="/admin/kho/lich-su" className="dash-list-link">Xem tất cả <span>→</span></Link>
                </div>
                {recentTx.length === 0 ? <p className="dash-empty">Chưa có giao dịch</p> : (
                  <div className="dash-list-items">
                    {recentTx.map((t) => (
                      <div key={t.id} className="dash-list-item">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className={`admin-badge ${t.loai_giao_dich === "Nhập" ? "green" : t.loai_giao_dich === "Xuất" ? "red" : "blue"}`}>
                            {t.loai_giao_dich}
                          </span>
                          <div>
                            <strong>{t.item_name}</strong>
                            <span className="dash-list-sub">x{t.so_luong} {t.don_vi || ""}</span>
                          </div>
                        </div>
                        <span className="dash-list-time">{formatDate(t.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========== CHEMICALS TAB ========== */}
          {tab === "chemicals" && (
            <div className="data-table-wrapper">
              <div className="data-table-toolbar">
                <div className="data-table-search">
                  <Search size={16} />
                  <Input placeholder="Tìm tên, mã, hoạt chất..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                {canEdit && (
                  <Button className="btn-add" onClick={openAddChem}><Plus size={16} /> Thêm hóa chất</Button>
                )}
              </div>
              {filteredChemicals.length === 0 ? (
                <div className="empty-state"><FlaskConical size={48} strokeWidth={1} /><p>Chưa có hóa chất</p></div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã</TableHead>
                        <TableHead>Tên thương mại</TableHead>
                        <TableHead>Quy cách</TableHead>
                        <TableHead>Hoạt chất</TableHead>
                        <TableHead>Đối tượng</TableHead>
                        <TableHead>ĐVT</TableHead>
                        <TableHead>Đơn giá (có VAT)</TableHead>
                        <TableHead>Tồn kho</TableHead>
                        <TableHead>NCC</TableHead>
                        {canEdit && <TableHead style={{ width: 50 }}></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedChemicals.map((c) => (
                        <TableRow key={c.id} onClick={() => openEditChem(c)} style={{ cursor: "pointer" }}>
                          <TableCell className="font-medium">{c.ma_hc}</TableCell>
                          <TableCell>{c.ten_thuong_mai}</TableCell>
                          <TableCell>{c.quy_cach ?? "—"}</TableCell>
                          <TableCell>{c.hoat_chat ?? "—"}</TableCell>
                          <TableCell>{c.doi_tuong ?? "—"}</TableCell>
                          <TableCell>{c.don_vi_tinh ?? "—"}</TableCell>
                          <TableCell>
                            {c.don_gia ? (
                              <span style={{ fontWeight: 600 }}>
                                {((c.don_gia) * (1 + (c.vat_pct ?? 0) / 100)).toLocaleString("vi-VN")}đ
                                {(c.vat_pct ?? 0) > 0 && <span style={{ fontSize: 11, color: "var(--neutral-500)", marginLeft: 4 }}>VAT {c.vat_pct}%</span>}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            <span style={{ color: (c.so_luong_ton ?? 0) <= (c.nguong_canh_bao ?? 5) ? "var(--danger-500)" : "var(--primary-700)", fontWeight: 600 }}>
                              {c.so_luong_ton ?? 0}
                            </span>
                          </TableCell>
                          <TableCell>{(c.suppliers as { ten_ncc: string } | null)?.ten_ncc ?? c.nha_cung_cap ?? "—"}</TableCell>
                          {canEdit && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <button className="btn-action danger" title="Xóa" onClick={() => confirmDelete("chem", c.id, c.ten_thuong_mai)}>
                                <Trash2 size={15} />
                              </button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination total={filteredChemicals.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
                </>
              )}
            </div>
          )}

          {/* ========== SUPPLIES TAB ========== */}
          {tab === "supplies" && (
            <div className="data-table-wrapper">
              <div className="data-table-toolbar">
                <div className="data-table-search">
                  <Search size={16} />
                  <Input placeholder="Tìm tên, mã, loại..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                </div>
                {canEdit && (
                  <Button className="btn-add" onClick={openAddSup}><Plus size={16} /> Thêm vật tư</Button>
                )}
              </div>
              {filteredSupplies.length === 0 ? (
                <div className="empty-state"><Package size={48} strokeWidth={1} /><p>Chưa có vật tư</p></div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã</TableHead>
                        <TableHead>Tên vật tư</TableHead>
                        <TableHead>Quy cách</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>ĐVT</TableHead>
                        <TableHead>Đơn giá (có VAT)</TableHead>
                        <TableHead>Tồn kho</TableHead>
                        <TableHead>NCC</TableHead>
                        {canEdit && <TableHead style={{ width: 50 }}></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedSupplies.map((s) => (
                        <TableRow key={s.id} onClick={() => openEditSup(s)} style={{ cursor: "pointer" }}>
                          <TableCell className="font-medium">{s.ma_vt}</TableCell>
                          <TableCell>{s.ten_vat_tu}</TableCell>
                          <TableCell>{s.quy_cach ?? "—"}</TableCell>
                          <TableCell>{s.loai_vt ?? "—"}</TableCell>
                          <TableCell>{s.don_vi_tinh ?? "—"}</TableCell>
                          <TableCell>
                            {s.don_gia ? (
                              <span style={{ fontWeight: 600 }}>
                                {((s.don_gia) * (1 + (s.vat_pct ?? 0) / 100)).toLocaleString("vi-VN")}đ
                                {(s.vat_pct ?? 0) > 0 && <span style={{ fontSize: 11, color: "var(--neutral-500)", marginLeft: 4 }}>VAT {s.vat_pct}%</span>}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            <span style={{ color: (s.so_luong_ton ?? 0) <= (s.nguong_canh_bao ?? 5) ? "var(--danger-500)" : "var(--primary-700)", fontWeight: 600 }}>
                              {s.so_luong_ton ?? 0}
                            </span>
                          </TableCell>
                          <TableCell>{(s.suppliers as { ten_ncc: string } | null)?.ten_ncc ?? s.nha_cung_cap ?? "—"}</TableCell>
                          {canEdit && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <button className="btn-action danger" title="Xóa" onClick={() => confirmDelete("sup", s.id, s.ten_vat_tu)}>
                                <Trash2 size={15} />
                              </button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination total={filteredSupplies.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ===== CHEMICAL FORM DIALOG ===== */}
      <Dialog open={chemDialogOpen} onOpenChange={setChemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChem ? "Sửa hóa chất" : "Thêm hóa chất"}</DialogTitle>
          </DialogHeader>
          <div className="form-grid">
            <div className="form-field">
              <Label>Tên thương mại *</Label>
              <Input value={chemForm.ten_thuong_mai} onChange={(e) => setChemForm({ ...chemForm, ten_thuong_mai: e.target.value })} placeholder="VD: Fendona 10SC" />
            </div>
            <div className="form-field">
              <Label>Hoạt chất</Label>
              <Input value={chemForm.hoat_chat} onChange={(e) => setChemForm({ ...chemForm, hoat_chat: e.target.value })} placeholder="VD: Alpha-cypermethrin" />
            </div>
            <div className="form-field">
              <Label>Đối tượng</Label>
              <Input value={chemForm.doi_tuong} onChange={(e) => setChemForm({ ...chemForm, doi_tuong: e.target.value })} placeholder="VD: Gián, Muỗi" />
            </div>
            <div className="form-field">
              <Label>Dạng sử dụng</Label>
              <Input value={chemForm.dang_su_dung} onChange={(e) => setChemForm({ ...chemForm, dang_su_dung: e.target.value })} placeholder="VD: Phun, Gel" />
            </div>
            <div className="form-field">
              <Label>Đơn vị tính *</Label>
              <Input value={chemForm.don_vi_tinh} onChange={(e) => setChemForm({ ...chemForm, don_vi_tinh: e.target.value })} placeholder="VD: Lít, Kg" />
            </div>
            <div className="form-field">
              <Label>Quy cách</Label>
              <Input value={chemForm.quy_cach} onChange={(e) => setChemForm({ ...chemForm, quy_cach: e.target.value })} placeholder="VD: Chai 1L, Hộp 500ml" />
            </div>
            <div className="form-field">
              <Label>Nhà cung cấp</Label>
              <SearchSelect
                placeholder="Chọn nhà cung cấp..."
                value={chemForm.supplier_id}
                onChange={(v) => setChemForm({ ...chemForm, supplier_id: v })}
                options={suppliers.map((s) => ({ value: s.id, label: s.ten_ncc }))}
              />
            </div>
            <div className="form-field">
              <Label>Đơn giá (chưa VAT)</Label>
              <Input type="number" min={0} placeholder="0" value={chemForm.don_gia || ""} onChange={(e) => setChemForm({ ...chemForm, don_gia: Number(e.target.value) })} />
            </div>
            <div className="form-field">
              <Label>VAT (%)</Label>
              <select className="native-select" value={chemForm.vat_pct} onChange={(e) => setChemForm({ ...chemForm, vat_pct: Number(e.target.value) })}>
                <option value={0}>0% (Không VAT)</option>
                <option value={5}>5%</option>
                <option value={8}>8%</option>
                <option value={10}>10%</option>
              </select>
            </div>
            {chemForm.don_gia > 0 && (
              <div className="form-field full-width" style={{ fontSize: 13, color: "var(--primary-700)", fontWeight: 600, padding: "4px 0" }}>
                Giá sau VAT: {((chemForm.don_gia || 0) * (1 + (chemForm.vat_pct || 0) / 100)).toLocaleString("vi-VN")}đ/{chemForm.don_vi_tinh || "đơn vị"}
              </div>
            )}
            <div className="form-field">
              <Label>Số lượng tồn</Label>
              <Input type="number" min={0} value={chemForm.so_luong_ton} onChange={(e) => setChemForm({ ...chemForm, so_luong_ton: Number(e.target.value) })} />
            </div>
            <div className="form-field">
              <Label>Ngưỡng cảnh báo</Label>
              <Input type="number" min={0} value={chemForm.nguong_canh_bao} onChange={(e) => setChemForm({ ...chemForm, nguong_canh_bao: Number(e.target.value) })} />
            </div>
            <div className="form-field full-width">
              <Label>Ghi chú</Label>
              <Textarea value={chemForm.ghi_chu} onChange={(e) => setChemForm({ ...chemForm, ghi_chu: e.target.value })} />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setChemDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveChem} disabled={saving}>{saving ? "Đang lưu..." : editingChem ? "Cập nhật" : "Thêm"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== SUPPLY FORM DIALOG ===== */}
      <Dialog open={supDialogOpen} onOpenChange={setSupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSup ? "Sửa vật tư" : "Thêm vật tư"}</DialogTitle>
          </DialogHeader>
          <div className="form-grid">
            <div className="form-field">
              <Label>Tên vật tư *</Label>
              <Input value={supForm.ten_vat_tu} onChange={(e) => setSupForm({ ...supForm, ten_vat_tu: e.target.value })} placeholder="VD: Bẫy dính chuột" />
            </div>
            <div className="form-field">
              <Label>Loại vật tư</Label>
              <Input value={supForm.loai_vt} onChange={(e) => setSupForm({ ...supForm, loai_vt: e.target.value })} placeholder="VD: Bẫy, Dụng cụ" />
            </div>
            <div className="form-field">
              <Label>Đơn vị tính *</Label>
              <Input value={supForm.don_vi_tinh} onChange={(e) => setSupForm({ ...supForm, don_vi_tinh: e.target.value })} placeholder="VD: Cái, Hộp" />
            </div>
            <div className="form-field">
              <Label>Quy cách</Label>
              <Input value={supForm.quy_cach} onChange={(e) => setSupForm({ ...supForm, quy_cach: e.target.value })} placeholder="VD: Hộp 10 cái, Túi 5kg" />
            </div>
            <div className="form-field">
              <Label>Nhà cung cấp</Label>
              <SearchSelect
                placeholder="Chọn nhà cung cấp..."
                value={supForm.supplier_id}
                onChange={(v) => setSupForm({ ...supForm, supplier_id: v })}
                options={suppliers.map((s) => ({ value: s.id, label: s.ten_ncc }))}
              />
            </div>
            <div className="form-field">
              <Label>Đơn giá (chưa VAT)</Label>
              <Input type="number" min={0} placeholder="0" value={supForm.don_gia || ""} onChange={(e) => setSupForm({ ...supForm, don_gia: Number(e.target.value) })} />
            </div>
            <div className="form-field">
              <Label>VAT (%)</Label>
              <select className="native-select" value={supForm.vat_pct} onChange={(e) => setSupForm({ ...supForm, vat_pct: Number(e.target.value) })}>
                <option value={0}>0% (Không VAT)</option>
                <option value={5}>5%</option>
                <option value={8}>8%</option>
                <option value={10}>10%</option>
              </select>
            </div>
            {supForm.don_gia > 0 && (
              <div className="form-field full-width" style={{ fontSize: 13, color: "var(--primary-700)", fontWeight: 600, padding: "4px 0" }}>
                Giá sau VAT: {((supForm.don_gia || 0) * (1 + (supForm.vat_pct || 0) / 100)).toLocaleString("vi-VN")}đ/{supForm.don_vi_tinh || "đơn vị"}
              </div>
            )}
            <div className="form-field">
              <Label>Số lượng tồn</Label>
              <Input type="number" min={0} value={supForm.so_luong_ton} onChange={(e) => setSupForm({ ...supForm, so_luong_ton: Number(e.target.value) })} />
            </div>
            <div className="form-field">
              <Label>Ngưỡng cảnh báo</Label>
              <Input type="number" min={0} value={supForm.nguong_canh_bao} onChange={(e) => setSupForm({ ...supForm, nguong_canh_bao: Number(e.target.value) })} />
            </div>
            <div className="form-field full-width">
              <Label>Ghi chú</Label>
              <Textarea value={supForm.ghi_chu} onChange={(e) => setSupForm({ ...supForm, ghi_chu: e.target.value })} />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setSupDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveSup} disabled={saving}>{saving ? "Đang lưu..." : editingSup ? "Cập nhật" : "Thêm"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== TRANSACTION DIALOG ===== */}
      <Dialog open={txDialogOpen} onOpenChange={setTxDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{txType === "Nhập" ? "Nhập kho" : "Xuất kho"}</DialogTitle>
          </DialogHeader>
          <div className="form-grid">
            <div className="form-field">
              <Label>Loại</Label>
              <select className="native-select" value={txItemType} onChange={(e) => { setTxItemType(e.target.value as "chemicals" | "supplies"); setTxItemId(""); }}>
                <option value="chemicals">Hóa chất</option>
                <option value="supplies">Vật tư</option>
              </select>
            </div>
            <div className="form-field">
              <Label>{txItemType === "chemicals" ? "Hóa chất" : "Vật tư"} *</Label>
              <SearchSelect
                placeholder="Chọn mặt hàng..."
                value={txItemId}
                onChange={(v) => setTxItemId(v)}
                options={txStockItems.map((i) => ({ value: i.id, label: `${i.name} (${i.code}) — Tồn: ${i.so_luong_ton} ${i.don_vi || ""}` }))}
              />
            </div>
            {selectedTxItem && (
              <div className="form-field full-width">
                <div style={{ padding: "8px 12px", background: "var(--neutral-50)", borderRadius: 8, fontSize: 13 }}>
                  Tồn kho: <strong>{selectedTxItem.so_luong_ton}</strong> {selectedTxItem.don_vi || ""}
                </div>
              </div>
            )}
            <div className="form-field">
              <Label>Số lượng *</Label>
              <Input type="number" min={1} value={txQty} onChange={(e) => setTxQty(e.target.value)} placeholder="0" />
            </div>
            {txType === "Nhập" && (
              <div className="form-field">
                <Label>Giá nhập (VNĐ)</Label>
                <Input type="number" min={0} value={txPrice} onChange={(e) => setTxPrice(e.target.value)} placeholder="0" />
              </div>
            )}
            {txType === "Nhập" && (
              <div className="form-field full-width">
                <Label>Nhà cung cấp</Label>
                <SearchSelect
                  placeholder="Chọn nhà cung cấp..."
                  value={txSupplierId}
                  onChange={(v) => setTxSupplierId(v)}
                  options={suppliers.map((s) => ({ value: s.id, label: s.ten_ncc }))}
                />
              </div>
            )}
            <div className="form-field full-width">
              <Label>Ghi chú</Label>
              <Textarea rows={2} value={txNote} onChange={(e) => setTxNote(e.target.value)} placeholder={txType === "Xuất" ? "VD: Xuất cho HĐ GS-2026-001..." : ""} />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setTxDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleTx} disabled={saving}>{saving ? "Đang lưu..." : `${txType} kho`}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRMATION ===== */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Xóa <strong>{deletingName}</strong>? Không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
