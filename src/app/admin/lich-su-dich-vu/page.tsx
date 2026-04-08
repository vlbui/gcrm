"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search, Plus, X, Trash2, CheckCircle, Clock, Calendar,
  Phone, ChevronDown, ChevronRight, Camera, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  fetchVisitsByContract,
  createVisit,
  updateVisit,
  completeVisit,
  deleteVisit,
  type ServiceVisit,
} from "@/lib/api/serviceVisits.api";
import { fetchContracts, deleteContract, type Contract } from "@/lib/api/contracts.api";
import { fetchActiveTechnicians, type Technician } from "@/lib/api/technicians.api";
import { fetchChemicals, type Chemical } from "@/lib/api/chemicals.api";
import { fetchSupplies, type Supply } from "@/lib/api/supplies.api";
import { uploadFile, getPublicUrl } from "@/lib/api/storage.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDate } from "@/lib/utils/date";
import SearchSelect from "@/components/admin/SearchSelect";

export default function LichSuDichVuPage() {
  const { user } = useCurrentUser();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Selected contract + visits
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [visits, setVisits] = useState<ServiceVisit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  // Form dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceVisit | null>(null);

  // Form state
  const [formDate, setFormDate] = useState("");
  const [formStart, setFormStart] = useState("08:00");
  const [formEnd, setFormEnd] = useState("11:00");
  const [formKtv, setFormKtv] = useState<string[]>([]);
  const [formNoteBefore, setFormNoteBefore] = useState("");
  const [formNoteAfter, setFormNoteAfter] = useState("");
  const [formResult, setFormResult] = useState("Đã lên lịch");
  const [hoaChatRows, setHoaChatRows] = useState<{ id: string; ten: string; so_luong: number; don_vi: string }[]>([]);
  const [vatTuRows, setVatTuRows] = useState<{ id: string; ten: string; so_luong: number; don_vi: string }[]>([]);
  const [formPaid, setFormPaid] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Delete visit
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingVisit, setDeletingVisit] = useState<ServiceVisit | null>(null);

  // Delete contract
  const [deleteContractOpen, setDeleteContractOpen] = useState(false);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);

  // Expanded contract rows
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Contract visits cache
  const [contractVisits, setContractVisits] = useState<Map<string, ServiceVisit[]>>(new Map());

  useEffect(() => { loadInitial(); }, []);

  async function loadInitial() {
    try {
      const [c, t, ch, su] = await Promise.all([
        fetchContracts(),
        fetchActiveTechnicians(),
        fetchChemicals(),
        fetchSupplies(),
      ]);
      setContracts(c);
      setTechnicians(t);
      setChemicals(ch);
      setSupplies(su);
    } catch { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }

  async function loadVisits(contractId: string) {
    try {
      const v = await fetchVisitsByContract(contractId);
      setContractVisits((prev) => new Map(prev).set(contractId, v));
    } catch { toast.error("Lỗi tải lần DV"); }
  }

  const toggleExpand = async (contractId: string) => {
    const next = new Set(expanded);
    if (next.has(contractId)) {
      next.delete(contractId);
    } else {
      next.add(contractId);
      if (!contractVisits.has(contractId)) await loadVisits(contractId);
    }
    setExpanded(next);
  };

  const filteredContracts = contracts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.ma_hd.toLowerCase().includes(q)
      || (c.customers?.ten_kh ?? "").toLowerCase().includes(q)
      || c.dich_vu.toLowerCase().includes(q);
  });

  // Open form
  const openCreate = (contract: Contract) => {
    setEditing(null);
    setSelectedContract(contract);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormStart("08:00");
    setFormEnd("11:00");
    setFormKtv([]);
    setFormNoteBefore("");
    setFormNoteAfter("");
    setFormResult("Đã lên lịch");
    setFormPaid(0);
    setHoaChatRows([]);
    setVatTuRows([]);
    setDialogOpen(true);
  };

  const openEdit = (visit: ServiceVisit, contract: Contract) => {
    setEditing(visit);
    setSelectedContract(contract);
    setFormDate(visit.ngay_du_kien || visit.ngay_thuc_te || "");
    setFormStart(visit.gio_bat_dau?.slice(0, 5) || "08:00");
    setFormEnd(visit.gio_ket_thuc?.slice(0, 5) || "11:00");
    setFormKtv(visit.ktv_ids || []);
    setFormNoteBefore(visit.ghi_chu_truoc || "");
    setFormNoteAfter(visit.ghi_chu_sau || "");
    setFormResult(visit.trang_thai);
    setFormPaid(visit.da_thanh_toan || 0);
    setHoaChatRows((visit.hoa_chat || []).map((h) => ({
      id: h.id, ten: h.ten, so_luong: h.so_luong, don_vi: h.don_vi || "",
    })));
    setVatTuRows((visit.vat_tu || []).map((v) => ({
      id: v.id, ten: v.ten, so_luong: v.so_luong, don_vi: v.don_vi || "",
    })));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedContract) return;
    setSubmitting(true);
    try {
      const hcParsed = hoaChatRows.filter((r) => r.id).map((r) => {
        const chem = chemicals.find((c) => c.id === r.id);
        return { id: r.id, ten: r.ten, ma: chem?.ma_hc ?? "", so_luong: r.so_luong, don_vi: r.don_vi };
      });
      const vtParsed = vatTuRows.filter((r) => r.id).map((r) => {
        const sup = supplies.find((s) => s.id === r.id);
        return { id: r.id, ten: r.ten, ma: sup?.ma_vt ?? "", so_luong: r.so_luong, don_vi: r.don_vi };
      });

      if (editing) {
        await updateVisit(editing.id, {
          ngay_du_kien: formDate || null,
          gio_bat_dau: formStart || null,
          gio_ket_thuc: formEnd || null,
          ktv_ids: formKtv,
          hoa_chat: hcParsed,
          vat_tu: vtParsed,
          trang_thai: formResult,
          da_thanh_toan: formPaid,
          ghi_chu_truoc: formNoteBefore || null,
          ghi_chu_sau: formNoteAfter || null,
        });
        toast.success("Đã cập nhật");
      } else {
        await createVisit({
          contract_id: selectedContract.id,
          ngay_du_kien: formDate || undefined,
          gio_bat_dau: formStart || undefined,
          gio_ket_thuc: formEnd || undefined,
          ktv_ids: formKtv,
          ghi_chu_truoc: formNoteBefore || undefined,
        });
        toast.success("Đã tạo lần DV mới");
      }
      setDialogOpen(false);
      await loadVisits(selectedContract.id);
    } catch { toast.error("Lỗi lưu"); }
    finally { setSubmitting(false); }
  };

  const handleComplete = async (visit: ServiceVisit) => {
    if (!confirm("Hoàn thành lần DV này? Hóa chất/vật tư sẽ được tự động xuất kho.")) return;
    try {
      await completeVisit(visit.id);
      toast.success("Đã hoàn thành + xuất kho tự động");
      await loadVisits(visit.contract_id);
    } catch { toast.error("Lỗi"); }
  };

  const handleDelete = async () => {
    if (!deletingVisit) return;
    try {
      await deleteVisit(deletingVisit.id);
      toast.success("Đã xóa");
      setDeleteDialogOpen(false);
      await loadVisits(deletingVisit.contract_id);
    } catch { toast.error("Lỗi xóa"); }
  };

  const handleDeleteContract = async () => {
    if (!deletingContract) return;
    try {
      await deleteContract(deletingContract.id);
      setContracts((prev) => prev.filter((c) => c.id !== deletingContract.id));
      setContractVisits((prev) => { const next = new Map(prev); next.delete(deletingContract.id); return next; });
      setExpanded((prev) => { const next = new Set(prev); next.delete(deletingContract.id); return next; });
      setDeleteContractOpen(false);
      setDeletingContract(null);
      toast.success("Đã xóa hợp đồng");
    } catch { toast.error("Không thể xóa HĐ (có thể còn dữ liệu liên quan)"); }
  };

  const canEdit = user?.vai_tro === "Admin" || user?.vai_tro === "Nhân viên";

  const statusColor = (s: string) => {
    if (s === "Hoàn thành") return "green";
    if (s === "Đang làm") return "blue";
    if (s === "Hủy" || s === "Hoãn") return "gray";
    return "amber";
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lịch sử dịch vụ</h1>
          <p className="admin-page-subtitle">Quản lý các lần thực hiện dịch vụ theo hợp đồng</p>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input placeholder="Tìm mã HĐ, tên KH, dịch vụ..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="empty-state"><p>Đang tải...</p></div> : (
        <div className="sv-contract-list">
          {filteredContracts.map((c) => {
            const isExpanded = expanded.has(c.id);
            const cvs = contractVisits.get(c.id) || [];
            const completedCount = cvs.filter((v) => v.trang_thai === "Hoàn thành").length;

            return (
              <div key={c.id} className="sv-contract-card">
                <div className="sv-contract-header" onClick={() => toggleExpand(c.id)}>
                  <div className="sv-contract-chevron">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                  <div className="sv-contract-info">
                    <div className="sv-contract-title">
                      <strong>{c.ma_hd}</strong> — {c.customers?.ten_kh}
                    </div>
                    <div className="sv-contract-sub">
                      {c.dich_vu} · {formatDate(c.ngay_bat_dau)} → {c.ngay_ket_thuc ? formatDate(c.ngay_ket_thuc) : "—"}
                    </div>
                  </div>
                  <div className="sv-contract-meta">
                    {isExpanded && cvs.length > 0 && (
                      <span style={{ fontSize: 12, color: "var(--primary-700)" }}>
                        {completedCount}/{cvs.length} lần xong
                      </span>
                    )}
                    <span className={`admin-badge ${c.loai_hd === "Định kỳ" ? "blue" : "gray"}`}>
                      {c.loai_hd || "Một lần"}
                    </span>
                    {canEdit && (
                      <button
                        className="btn-action danger"
                        title="Xóa hợp đồng"
                        onClick={(e) => { e.stopPropagation(); setDeletingContract(c); setDeleteContractOpen(true); }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="sv-visits-body">
                    {canEdit && (
                      <button className="p-btn p-btn-primary" style={{ marginBottom: 10, fontSize: 12 }} onClick={() => openCreate(c)}>
                        <Plus size={14} /> Thêm lần dịch vụ
                      </button>
                    )}

                    {cvs.length === 0 ? (
                      <p style={{ fontSize: 13, color: "var(--neutral-500)", padding: 12 }}>Chưa có lần dịch vụ nào</p>
                    ) : (
                      <div className="sv-visits-list">
                        {cvs.map((v) => {
                          const ktvNames = (v.ktv_ids || []).map((id) => technicians.find((t) => t.id === id)?.ho_ten).filter(Boolean);
                          return (
                            <div key={v.id} className={`sv-visit-card ${v.trang_thai === "Hoàn thành" ? "done" : v.trang_thai === "Hủy" ? "cancelled" : ""}`}>
                              <div className="sv-visit-header">
                                <span className="sv-visit-num">Lần {v.lan_thu}</span>
                                <span className={`admin-badge ${statusColor(v.trang_thai)}`}>{v.trang_thai}</span>
                                <div className="sv-visit-date">
                                  <Calendar size={12} />
                                  {v.ngay_du_kien ? formatDate(v.ngay_du_kien) : "Chưa xếp"}
                                  {v.gio_bat_dau && ` ${v.gio_bat_dau.slice(0, 5)}`}
                                  {v.gio_ket_thuc && `–${v.gio_ket_thuc.slice(0, 5)}`}
                                </div>
                              </div>

                              {ktvNames.length > 0 && (
                                <div className="sv-visit-ktv">KTV: {ktvNames.join(", ")}</div>
                              )}

                              {(v.hoa_chat || []).length > 0 && (
                                <div className="sv-visit-materials">
                                  HC: {(v.hoa_chat || []).map((h) => `${h.ten} (${h.so_luong} ${h.don_vi || ""})`).join(", ")}
                                </div>
                              )}

                              {(v.vat_tu || []).length > 0 && (
                                <div className="sv-visit-materials">
                                  VT: {(v.vat_tu || []).map((vt) => `${vt.ten} (${vt.so_luong} ${vt.don_vi || ""})`).join(", ")}
                                </div>
                              )}

                              {(v.da_thanh_toan || 0) > 0 && (
                                <div className="sv-visit-note" style={{ color: "var(--primary-700)", fontWeight: 600 }}>
                                  Đã TT: {(v.da_thanh_toan || 0).toLocaleString("vi-VN")}đ
                                </div>
                              )}

                              {v.ghi_chu_truoc && <div className="sv-visit-note">Trước: {v.ghi_chu_truoc}</div>}
                              {v.ghi_chu_sau && <div className="sv-visit-note">Sau: {v.ghi_chu_sau}</div>}

                              {canEdit && (
                                <div className="sv-visit-actions">
                                  {v.trang_thai === "Đã lên lịch" && (
                                    <button className="p-btn p-btn-ghost" style={{ fontSize: 11 }} onClick={() => handleComplete(v)}>
                                      <CheckCircle size={12} /> Hoàn thành
                                    </button>
                                  )}
                                  <button className="p-btn p-btn-ghost" style={{ fontSize: 11 }} onClick={() => openEdit(v, c)}>
                                    Sửa
                                  </button>
                                  <button className="p-btn p-btn-ghost" style={{ fontSize: 11, color: "var(--danger-500)" }}
                                    onClick={() => { setDeletingVisit(v); setDeleteDialogOpen(true); }}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredContracts.length === 0 && <div className="empty-state"><p>Không có hợp đồng nào</p></div>}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Sửa lần ${editing.lan_thu}` : "Thêm lần dịch vụ mới"}
              {selectedContract && ` — ${selectedContract.ma_hd}`}
            </DialogTitle>
          </DialogHeader>

          <div className="form-grid">
            <div className="form-field">
              <Label>Ngày dự kiến *</Label>
              <input type="date" className="p-input" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="form-field">
              <Label>Giờ</Label>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <input type="time" className="p-input" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
                <span>—</span>
                <input type="time" className="p-input" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
              </div>
            </div>

            {/* KTV multi-select dropdown */}
            <div className="form-field full-width">
              <Label>Kỹ thuật viên</Label>
              <select className="p-select" value="" onChange={(e) => {
                if (e.target.value && !formKtv.includes(e.target.value)) setFormKtv((p) => [...p, e.target.value]);
              }}>
                <option value="">— Thêm KTV —</option>
                {technicians.filter((t) => !formKtv.includes(t.id)).map((t) => (
                  <option key={t.id} value={t.id}>{t.ho_ten} — {t.sdt}</option>
                ))}
              </select>
              {formKtv.length > 0 && (
                <div className="multi-select-tags" style={{ marginTop: 6 }}>
                  {formKtv.map((id) => {
                    const t = technicians.find((x) => x.id === id);
                    return t ? (
                      <div key={id} className="multi-select-tag">
                        <span className="multi-select-tag-avatar">{t.ho_ten.charAt(0)}</span>
                        <span>{t.ho_ten}</span>
                        <button type="button" className="multi-select-tag-remove" onClick={() => setFormKtv((p) => p.filter((x) => x !== id))}>
                          <X size={12} />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Hóa chất */}
            <div className="form-field full-width">
              <Label>Hóa chất sử dụng</Label>
              {hoaChatRows.map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <div style={{ flex: 2 }}>
                    <SearchSelect
                      placeholder="Tìm hóa chất..."
                      value={row.id}
                      onChange={(v) => {
                        const chem = chemicals.find((c) => c.id === v);
                        const updated = [...hoaChatRows];
                        updated[i] = { id: v, ten: chem?.ten_thuong_mai ?? "", so_luong: row.so_luong, don_vi: chem?.don_vi_tinh ?? "" };
                        setHoaChatRows(updated);
                      }}
                      options={chemicals.map((c) => ({ value: c.id, label: `${c.ten_thuong_mai} (Tồn: ${c.so_luong_ton ?? 0})` }))}
                    />
                  </div>
                  <input className="p-input" style={{ width: 80 }} type="number" min={0} placeholder="SL"
                    value={row.so_luong} onChange={(e) => { const u = [...hoaChatRows]; u[i] = { ...row, so_luong: Number(e.target.value) }; setHoaChatRows(u); }} />
                  <span style={{ fontSize: 12, color: "var(--neutral-500)", minWidth: 30 }}>{row.don_vi}</span>
                  <button type="button" className="p-btn p-btn-ghost" style={{ padding: 4 }} onClick={() => setHoaChatRows(hoaChatRows.filter((_, j) => j !== i))}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button type="button" className="p-btn p-btn-ghost" style={{ fontSize: 12 }} onClick={() => setHoaChatRows([...hoaChatRows, { id: "", ten: "", so_luong: 0, don_vi: "" }])}>
                <Plus size={14} /> Thêm hóa chất
              </button>
            </div>

            {/* Vật tư */}
            <div className="form-field full-width">
              <Label>Vật tư sử dụng</Label>
              {vatTuRows.map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <div style={{ flex: 2 }}>
                    <SearchSelect
                      placeholder="Tìm vật tư..."
                      value={row.id}
                      onChange={(v) => {
                        const sup = supplies.find((s) => s.id === v);
                        const u = [...vatTuRows];
                        u[i] = { id: v, ten: sup?.ten_vat_tu ?? "", so_luong: row.so_luong, don_vi: sup?.don_vi_tinh ?? "" };
                        setVatTuRows(u);
                      }}
                      options={supplies.map((s) => ({ value: s.id, label: `${s.ten_vat_tu} (Tồn: ${s.so_luong_ton ?? 0})` }))}
                    />
                  </div>
                  <input className="p-input" style={{ width: 80 }} type="number" min={0} placeholder="SL"
                    value={row.so_luong} onChange={(e) => { const u = [...vatTuRows]; u[i] = { ...row, so_luong: Number(e.target.value) }; setVatTuRows(u); }} />
                  <span style={{ fontSize: 12, color: "var(--neutral-500)", minWidth: 30 }}>{row.don_vi}</span>
                  <button type="button" className="p-btn p-btn-ghost" style={{ padding: 4 }} onClick={() => setVatTuRows(vatTuRows.filter((_, j) => j !== i))}>
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button type="button" className="p-btn p-btn-ghost" style={{ fontSize: 12 }} onClick={() => setVatTuRows([...vatTuRows, { id: "", ten: "", so_luong: 0, don_vi: "" }])}>
                <Plus size={14} /> Thêm vật tư
              </button>
            </div>

            <div className="form-field">
              <Label>Đã thanh toán (VNĐ)</Label>
              <Input type="number" min={0} placeholder="0" value={formPaid || ""} onChange={(e) => setFormPaid(Number(e.target.value) || 0)} />
            </div>

            {editing && (
              <div className="form-field">
                <Label>Trạng thái</Label>
                <select className="p-select" value={formResult} onChange={(e) => setFormResult(e.target.value)}>
                  <option>Đã lên lịch</option>
                  <option>Đang làm</option>
                  <option>Hoàn thành</option>
                  <option>Hủy</option>
                  <option>Hoãn</option>
                </select>
              </div>
            )}

            <div className="form-field">
              <Label>Ghi chú trước DV</Label>
              <Textarea rows={2} value={formNoteBefore} onChange={(e) => setFormNoteBefore(e.target.value)} placeholder="Tình trạng trước khi thực hiện..." />
            </div>

            {editing && (
              <div className="form-field">
                <Label>Ghi chú sau DV</Label>
                <Textarea rows={2} value={formNoteAfter} onChange={(e) => setFormNoteAfter(e.target.value)} placeholder="Kết quả sau khi thực hiện..." />
              </div>
            )}
          </div>

          <div className="form-actions">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            {editing && (
              <Button variant="destructive" onClick={() => { setDialogOpen(false); setDeletingVisit(editing); setDeleteDialogOpen(true); }}>
                <Trash2 size={14} /> Xóa
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm lần DV"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Visit Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="dialog-bordered">
          <DialogHeader>
            <DialogTitle>Xóa lần dịch vụ</DialogTitle>
            <DialogDescription>
              Xóa lần dịch vụ <strong>{deletingVisit?.lan_thu}</strong>? Không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa lần DV</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Contract Confirmation */}
      <Dialog open={deleteContractOpen} onOpenChange={setDeleteContractOpen}>
        <DialogContent className="dialog-bordered">
          <DialogHeader>
            <DialogTitle>Xóa hợp đồng</DialogTitle>
            <DialogDescription>
              Xóa hợp đồng <strong>{deletingContract?.ma_hd}</strong> ({deletingContract?.customers?.ten_kh})?
              Tất cả lần dịch vụ liên quan cũng sẽ bị xóa. Không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setDeleteContractOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDeleteContract}>Xóa hợp đồng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
