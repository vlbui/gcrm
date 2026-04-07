"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Eye, ArrowRightLeft, Phone, Mail, MapPin, Bug, Ruler } from "lucide-react";
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
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchServiceRequests,
  updateServiceRequest,
  createServiceRequest,
  type ServiceRequest,
} from "@/lib/api/serviceRequests.api";
import { createCustomer, fetchCustomers, type Customer } from "@/lib/api/customers.api";
import { createContract } from "@/lib/api/contracts.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { sanitizePhone, sanitizeEmail } from "@/lib/utils/sanitize";
import { formatDate } from "@/lib/utils/date";
import Pagination from "@/components/admin/Pagination";

const BUG_OPTIONS = ["Gián", "Chuột", "Mối", "Muỗi", "Kiến", "Ruồi", "Khác"];
const LOAI_HINH_OPTIONS = [
  "Cá nhân / Hộ gia đình",
  "Doanh nghiệp / Khu công nghiệp",
  "Khu chung cư / Văn phòng / Trường học",
  "Trang trại",
];
const STATUS_OPTIONS = [
  { value: "Mới", label: "Mới" },
  { value: "Đã liên hệ", label: "Đã liên hệ" },
  { value: "Đang tư vấn", label: "Đang tư vấn" },
  { value: "Đã báo giá", label: "Đã báo giá" },
  { value: "Chốt đơn", label: "Chốt đơn" },
  { value: "Đang triển khai", label: "Đang triển khai" },
  { value: "Hoàn thành", label: "Hoàn thành" },
  { value: "Từ chối", label: "Từ chối" },
];

const statusBadgeClass: Record<string, string> = {
  "Mới": "status-badge moi",
  "Đã liên hệ": "status-badge dang-xu-ly",
  "Đang tư vấn": "status-badge dang-xu-ly",
  "Đã báo giá": "status-badge dang-xu-ly",
  "Chốt đơn": "status-badge hoan-thanh",
  "Đang triển khai": "status-badge hoan-thanh",
  "Hoàn thành": "status-badge hoan-thanh",
  "Từ chối": "status-badge huy",
};

export default function YeuCauPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Dialogs
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  // Create form
  const [newForm, setNewForm] = useState({
    ten_kh: "", sdt: "", email: "", dia_chi: "", loai_hinh: "",
    loai_con_trung: "", dien_tich: "", mo_ta: "",
  });
  const [creating, setCreating] = useState(false);

  // Convert
  const [convertDichVu, setConvertDichVu] = useState("");
  const [converting, setConverting] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [reqs, custs] = await Promise.all([fetchServiceRequests(), fetchCustomers()]);
      setData(reqs);
      setCustomers(custs);
    } catch { toast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }

  const filtered = data.filter((item) => {
    if (filterStatus === "active" && ["Hoàn thành", "Từ chối", "Chốt đơn"].includes(item.trang_thai)) return false;
    if (filterStatus !== "active" && filterStatus !== "all" && item.trang_thai !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!item.ten_kh.toLowerCase().includes(q) && !item.sdt.includes(q) && !item.ma_yc.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const canEdit = user?.vai_tro !== "Xem";

  const handleStatusChange = async (id: string, trang_thai: string) => {
    try {
      await updateServiceRequest(id, { trang_thai });
      setData((prev) => prev.map((r) => r.id === id ? { ...r, trang_thai } : r));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, trang_thai } : null);
      toast.success(`→ ${trang_thai}`);
    } catch { toast.error("Lỗi cập nhật"); }
  };

  const handleNotesUpdate = async (id: string, ghi_chu_nv: string) => {
    try {
      await updateServiceRequest(id, { ghi_chu_nv });
      setData((prev) => prev.map((r) => r.id === id ? { ...r, ghi_chu_nv } : r));
    } catch { toast.error("Lỗi lưu ghi chú"); }
  };

  const handleCreate = async () => {
    if (!newForm.ten_kh.trim() || !newForm.sdt.trim()) { toast.error("Nhập tên và SĐT"); return; }
    setCreating(true);
    try {
      await createServiceRequest({
        ten_kh: newForm.ten_kh.trim(),
        sdt: sanitizePhone(newForm.sdt),
        email: newForm.email ? sanitizeEmail(newForm.email) : undefined,
        dia_chi: newForm.dia_chi.trim() || undefined,
        loai_hinh: newForm.loai_hinh || undefined,
        loai_con_trung: newForm.loai_con_trung || undefined,
        dien_tich: newForm.dien_tich || undefined,
        mo_ta: newForm.mo_ta.trim() || undefined,
      });
      toast.success("Đã tạo yêu cầu");
      setCreateOpen(false);
      setNewForm({ ten_kh: "", sdt: "", email: "", dia_chi: "", loai_hinh: "", loai_con_trung: "", dien_tich: "", mo_ta: "" });
      await loadData();
    } catch { toast.error("Lỗi tạo yêu cầu"); }
    finally { setCreating(false); }
  };

  const handleConvert = async () => {
    if (!selected) return;
    setConverting(true);
    try {
      const phone = sanitizePhone(selected.sdt);
      const existing = customers.find((c) => sanitizePhone(c.sdt) === phone);
      let customerId: string;
      if (existing) {
        customerId = existing.id;
      } else {
        const cust = await createCustomer({
          ten_kh: selected.ten_kh, sdt: phone,
          email: selected.email ?? "", dia_chi: selected.dia_chi ?? "",
          loai_kh: selected.loai_hinh || "Hộ gia đình", trang_thai: "Đang phục vụ",
          ghi_chu: `Từ yêu cầu ${selected.ma_yc}`,
        });
        customerId = cust.id;
      }
      await createContract({
        customer_id: customerId,
        dich_vu: convertDichVu || selected.loai_con_trung || "Kiểm soát côn trùng",
        gia_tri: null, trang_thai: "Mới", dien_tich: selected.dien_tich || null,
        ngay_bat_dau: new Date().toISOString().split("T")[0], ngay_ket_thuc: null,
        ghi_chu: `Từ ${selected.ma_yc}: ${selected.mo_ta || ""}`,
      });
      await updateServiceRequest(selected.id, { trang_thai: "Chốt đơn", xu_ly_boi: user?.id ?? null });
      toast.success(existing ? "Đã tạo HĐ cho KH hiện có" : "Đã tạo KH + HĐ");
      setConvertOpen(false);
      setDetailOpen(false);
      setSelected(null);
      await loadData();
      router.push("/admin/hop-dong");
    } catch { toast.error("Lỗi chuyển đổi"); }
    finally { setConverting(false); }
  };

  const openDetail = (item: ServiceRequest) => {
    setSelected(item);
    setDetailOpen(true);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Yêu cầu dịch vụ</h1>
          <p className="admin-page-subtitle">Quản lý yêu cầu từ khách hàng ({filtered.length})</p>
        </div>
        {canEdit && (
          <Button className="btn-add" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Thêm yêu cầu
          </Button>
        )}
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input placeholder="Tìm tên, SĐT, mã YC..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="data-table-actions">
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang xử lý</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><p>Đang tải...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>Không có yêu cầu nào</p></div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã YC</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Loại côn trùng</TableHead>
                  <TableHead>Loại hình</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((item) => (
                  <TableRow key={item.id} onClick={() => openDetail(item)} style={{ cursor: "pointer" }}>
                    <TableCell className="font-medium">{item.ma_yc}</TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600 }}>{item.ten_kh}</div>
                      {item.email && <div style={{ fontSize: 11, color: "var(--neutral-500)" }}>{item.email}</div>}
                    </TableCell>
                    <TableCell>{item.sdt}</TableCell>
                    <TableCell>{item.loai_con_trung || "—"}</TableCell>
                    <TableCell style={{ fontSize: 12 }}>{item.loai_hinh || "—"}</TableCell>
                    <TableCell>
                      <span className={statusBadgeClass[item.trang_thai] ?? "status-badge"}>
                        {item.trang_thai}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.ma_yc} — {selected?.ten_kh}</DialogTitle>
            <DialogDescription>
              <span className={statusBadgeClass[selected?.trang_thai ?? ""] ?? "status-badge"}>
                {selected?.trang_thai}
              </span>
              {" "}· Ngày tạo: {selected ? formatDate(selected.created_at) : ""}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <>
              <div className="form-grid">
                <div className="form-field">
                  <Label>SĐT</Label>
                  <p style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={14} /> {selected.sdt}</p>
                </div>
                {selected.email && (
                  <div className="form-field">
                    <Label>Email</Label>
                    <p style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={14} /> {selected.email}</p>
                  </div>
                )}
                {selected.dia_chi && (
                  <div className="form-field full-width">
                    <Label>Địa chỉ</Label>
                    <p style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={14} /> {selected.dia_chi}</p>
                  </div>
                )}
                {selected.loai_con_trung && (
                  <div className="form-field">
                    <Label>Côn trùng</Label>
                    <p style={{ display: "flex", alignItems: "center", gap: 4 }}><Bug size={14} /> {selected.loai_con_trung}</p>
                  </div>
                )}
                {selected.loai_hinh && (
                  <div className="form-field">
                    <Label>Loại hình</Label>
                    <p>{selected.loai_hinh}</p>
                  </div>
                )}
                {selected.dien_tich && (
                  <div className="form-field">
                    <Label>Diện tích</Label>
                    <p style={{ display: "flex", alignItems: "center", gap: 4 }}><Ruler size={14} /> {selected.dien_tich} m²</p>
                  </div>
                )}
                {selected.mo_ta && (
                  <div className="form-field full-width">
                    <Label>Mô tả</Label>
                    <p style={{ fontSize: 13, color: "var(--neutral-600)" }}>{selected.mo_ta}</p>
                  </div>
                )}

                {canEdit && (
                  <div className="form-field">
                    <Label>Trạng thái</Label>
                    <select className="native-select" value={selected.trang_thai}
                      onChange={(e) => handleStatusChange(selected.id, e.target.value)}>
                      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                )}

                {canEdit && (
                  <div className="form-field full-width">
                    <Label>Ghi chú nhân viên</Label>
                    <Textarea rows={3} defaultValue={selected.ghi_chu_nv || ""}
                      onBlur={(e) => {
                        if (e.target.value !== (selected.ghi_chu_nv || "")) handleNotesUpdate(selected.id, e.target.value);
                      }}
                      placeholder="Ghi chú xử lý..."
                    />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Đóng</Button>
                {canEdit && !["Chốt đơn", "Hoàn thành"].includes(selected.trang_thai) && (
                  <Button onClick={() => {
                    setConvertDichVu(selected.loai_con_trung ? `Dịch vụ ${selected.loai_con_trung}` : "");
                    setConvertOpen(true);
                  }}>
                    <ArrowRightLeft size={14} /> Chuyển thành KH + HĐ
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển đổi thành KH + HĐ</DialogTitle>
            <DialogDescription>
              {selected?.ten_kh} — {selected?.sdt}
            </DialogDescription>
          </DialogHeader>
          {selected && customers.find((c) => sanitizePhone(c.sdt) === sanitizePhone(selected.sdt)) && (
            <div style={{ padding: "8px 12px", background: "#F0FDF4", borderRadius: 8, fontSize: 13, color: "var(--primary-800)" }}>
              KH đã tồn tại — sẽ tạo HĐ mới cho KH này
            </div>
          )}
          <div className="form-grid">
            <div className="form-field full-width">
              <Label>Dịch vụ hợp đồng</Label>
              <Input value={convertDichVu} onChange={(e) => setConvertDichVu(e.target.value)} placeholder="Kiểm soát côn trùng" />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setConvertOpen(false)}>Hủy</Button>
            <Button onClick={handleConvert} disabled={converting}>
              {converting ? "Đang xử lý..." : "Tạo KH + HĐ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm yêu cầu mới</DialogTitle>
            <DialogDescription>Nhập thông tin yêu cầu dịch vụ từ khách hàng</DialogDescription>
          </DialogHeader>
          <div className="form-grid">
            <div className="form-field">
              <Label>Họ tên *</Label>
              <Input value={newForm.ten_kh} onChange={(e) => setNewForm({ ...newForm, ten_kh: e.target.value })} placeholder="Nguyễn Văn A" />
            </div>
            <div className="form-field">
              <Label>SĐT *</Label>
              <Input value={newForm.sdt} onChange={(e) => setNewForm({ ...newForm, sdt: e.target.value })} placeholder="085 9955 969" />
            </div>
            <div className="form-field">
              <Label>Email</Label>
              <Input type="email" value={newForm.email} onChange={(e) => setNewForm({ ...newForm, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="form-field">
              <Label>Địa chỉ</Label>
              <Input value={newForm.dia_chi} onChange={(e) => setNewForm({ ...newForm, dia_chi: e.target.value })} placeholder="Số nhà, đường, quận..." />
            </div>
            <div className="form-field">
              <Label>Loại hình</Label>
              <select className="native-select" value={newForm.loai_hinh} onChange={(e) => setNewForm({ ...newForm, loai_hinh: e.target.value })}>
                <option value="">— Chọn —</option>
                {LOAI_HINH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-field">
              <Label>Loại côn trùng</Label>
              <select className="native-select" value={newForm.loai_con_trung} onChange={(e) => setNewForm({ ...newForm, loai_con_trung: e.target.value })}>
                <option value="">— Chọn —</option>
                {BUG_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-field">
              <Label>Diện tích (m²)</Label>
              <Input type="number" value={newForm.dien_tich} onChange={(e) => setNewForm({ ...newForm, dien_tich: e.target.value })} placeholder="80" />
            </div>
            <div className="form-field full-width">
              <Label>Mô tả</Label>
              <Textarea rows={3} value={newForm.mo_ta} onChange={(e) => setNewForm({ ...newForm, mo_ta: e.target.value })} placeholder="Mô tả tình trạng..." />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Đang lưu..." : "Tạo yêu cầu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
