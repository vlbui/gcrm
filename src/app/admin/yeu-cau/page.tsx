"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Eye, ArrowRightLeft, AlertTriangle, Plus, Check } from "lucide-react";
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { createCustomer, fetchCustomers, deleteCustomer, type Customer } from "@/lib/api/customers.api";
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

const statusLabels: Record<string, string> = {
  "Mới": "Mới",
  "Đã liên hệ": "Đã liên hệ",
  "Đã tạo HĐ": "Đã chuyển đổi",
  "Từ chối": "Từ chối",
};

const statusBadgeClass: Record<string, string> = {
  "Mới": "status-badge moi",
  "Đã liên hệ": "status-badge dang-xu-ly",
  "Đã tạo HĐ": "status-badge hoan-thanh",
  "Từ chối": "status-badge huy",
};

function getLoaiHinhBadgeClass(loaiHinh: string | null): string {
  const val = loaiHinh ?? "";
  if (val.includes("Doanh nghiệp") || val.includes("Khu công nghiệp")) return "loai-hinh-badge nha-hang";
  if (val.includes("Khu chung cư") || val.includes("Văn phòng") || val.includes("Trường học")) return "loai-hinh-badge van-phong";
  if (val.includes("Trang trại")) return "loai-hinh-badge trang-trai";
  if (val.includes("Cá nhân") || val.includes("Hộ gia đình")) return "loai-hinh-badge ca-nhan";
  return "loai-hinh-badge khac";
}

export default function YeuCauPage() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterLoaiHinh, setFilterLoaiHinh] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceRequest | null>(null);
  const [converting, setConverting] = useState(false);
  const [isConvertMode, setIsConvertMode] = useState(false);

  // Convert form fields
  const [convertTenKH, setConvertTenKH] = useState("");
  const [convertSDT, setConvertSDT] = useState("");
  const [convertEmail, setConvertEmail] = useState("");
  const [convertDiaChi, setConvertDiaChi] = useState("");
  const [convertDichVu, setConvertDichVu] = useState("");
  const [convertDienTich, setConvertDienTich] = useState("");
  const [convertLoaiHinh, setConvertLoaiHinh] = useState("");
  const [convertGhiChu, setConvertGhiChu] = useState("");

  // Duplicate customer check
  const [duplicateCustomer, setDuplicateCustomer] = useState<Customer | null>(null);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [duplicateMatchType, setDuplicateMatchType] = useState<"phone" | "email" | "both">("phone");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTenKH, setNewTenKH] = useState("");
  const [newSDT, setNewSDT] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDiaChi, setNewDiaChi] = useState("");
  const [newLoaiHinh, setNewLoaiHinh] = useState("");
  const [newBugs, setNewBugs] = useState<string[]>([]);
  const [newDienTich, setNewDienTich] = useState("");
  const [newMoTa, setNewMoTa] = useState("");

  const loadData = async () => {
    try {
      const requests = await fetchServiceRequests();
      setData(requests);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDialog = (item: ServiceRequest, convertMode = false) => {
    setSelectedItem(item);
    setIsConvertMode(convertMode);
    setDuplicateCustomer(null);
    setShowDuplicateConfirm(false);

    // Always populate convert form fields so switching to convert mode is instant
    const isOrg = item.loai_kh === "Tổ chức";
    setConvertTenKH(isOrg ? (item.ten_cong_ty ?? item.ten_kh) : item.ten_kh);
    setConvertSDT(item.sdt);
    setConvertEmail(item.email ?? "");
    setConvertDiaChi(item.dia_chi ?? "");
    setConvertDichVu(item.loai_con_trung ?? "");
    setConvertDienTich(item.dien_tich ?? "");
    setConvertLoaiHinh(item.loai_hinh ?? (isOrg ? "Doanh nghiệp / Khu công nghiệp" : "Cá nhân / Hộ gia đình"));

    const notes: string[] = [];
    if (isOrg && item.nguoi_lien_he) notes.push(`Người liên hệ: ${item.nguoi_lien_he}`);
    if (item.loai_con_trung) notes.push(`Côn trùng: ${item.loai_con_trung}`);
    if (item.dien_tich) notes.push(`Diện tích: ${item.dien_tich} m²`);
    if (item.loai_hinh) notes.push(`Loại hình: ${item.loai_hinh}`);
    if (isOrg && item.so_chi_nhanh) notes.push(`Số chi nhánh: ${item.so_chi_nhanh}`);
    if (isOrg && item.nhu_cau) notes.push(`Nhu cầu: ${item.nhu_cau}`);
    if (item.mo_ta) notes.push(`Ghi chú: ${item.mo_ta}`);
    notes.push(`Từ yêu cầu ${item.ma_yc}`);
    setConvertGhiChu(notes.join("\n"));

    setDialogOpen(true);
  };

  const handleStatusChange = async (
    item: ServiceRequest,
    newStatus: string
  ) => {
    try {
      await updateServiceRequest(item.id, { trang_thai: newStatus });
      toast.success("Cập nhật trạng thái thành công");
      loadData();
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleNotesUpdate = async (item: ServiceRequest, notes: string) => {
    try {
      await updateServiceRequest(item.id, {
        ghi_chu_nv: notes,
        xu_ly_boi: user?.id ?? null,
      });
      toast.success("Cập nhật ghi chú thành công");
      loadData();
    } catch {
      toast.error("Không thể cập nhật ghi chú");
    }
  };

  const openCreateDialog = () => {
    setNewTenKH(""); setNewSDT(""); setNewEmail(""); setNewDiaChi("");
    setNewLoaiHinh(""); setNewBugs([]); setNewDienTich(""); setNewMoTa("");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!newTenKH.trim() || !newSDT.trim()) {
      toast.error("Vui lòng nhập tên và số điện thoại");
      return;
    }
    setCreating(true);
    try {
      await createServiceRequest({
        ten_kh: newTenKH.trim(),
        sdt: sanitizePhone(newSDT),
        email: newEmail ? sanitizeEmail(newEmail) : undefined,
        dia_chi: newDiaChi.trim() || undefined,
        loai_hinh: newLoaiHinh || undefined,
        loai_con_trung: newBugs.length ? newBugs.join(", ") : undefined,
        dien_tich: newDienTich || undefined,
        mo_ta: newMoTa.trim() || undefined,
      });
      toast.success("Tạo yêu cầu thành công");
      setCreateOpen(false);
      loadData();
    } catch {
      toast.error("Không thể tạo yêu cầu");
    } finally {
      setCreating(false);
    }
  };

  const checkDuplicateAndConvert = async () => {
    if (!selectedItem || converting) return;
    setConverting(true);

    try {
      const phone = sanitizePhone(convertSDT);
      const emailVal = convertEmail ? sanitizeEmail(convertEmail) : null;
      const customers = await fetchCustomers();

      // Check both phone and email
      const phoneMatch = customers.find((c) => sanitizePhone(c.sdt) === phone);
      const emailMatch = emailVal ? customers.find((c) => c.email && sanitizeEmail(c.email) === emailVal) : null;
      const existing = phoneMatch || emailMatch;

      if (existing) {
        const matchType = phoneMatch && emailMatch && phoneMatch.id === emailMatch.id
          ? "both"
          : phoneMatch ? "phone" : "email";
        setDuplicateMatchType(matchType);
        setDuplicateCustomer(existing);
        setShowDuplicateConfirm(true);
        setConverting(false);
        return;
      }

      await doConvert(null, false);
    } catch {
      toast.error("Có lỗi xảy ra khi kiểm tra");
      setConverting(false);
    }
  };

  const hasInfoChanged = (existing: Customer): boolean => {
    return (
      existing.ten_kh !== convertTenKH.trim() ||
      (existing.email ?? "") !== (convertEmail ? sanitizeEmail(convertEmail) : "") ||
      (existing.dia_chi ?? "") !== convertDiaChi.trim()
    );
  };

  const doConvert = async (existingCustomer: Customer | null, replaceExisting: boolean) => {
    if (!selectedItem) return;
    setConverting(true);
    setShowDuplicateConfirm(false);

    try {
      let customerId: string;
      const phone = sanitizePhone(convertSDT);
      const emailVal = convertEmail ? sanitizeEmail(convertEmail) : null;

      if (existingCustomer && !replaceExisting) {
        customerId = existingCustomer.id;
      } else {
        if (existingCustomer && replaceExisting) {
          try {
            await deleteCustomer(existingCustomer.id);
          } catch {
            // Old customer may have contracts, just create new one
          }
        }
        const customer = await createCustomer({
          ten_kh: convertTenKH.trim(),
          sdt: phone,
          email: emailVal || null,
          dia_chi: convertDiaChi.trim() || null,
          loai_kh: convertLoaiHinh || "Cá nhân / Hộ gia đình",
          trang_thai: "Mới",
          ghi_chu: convertGhiChu || null,
        });
        customerId = customer.id;
      }

      await createContract({
        customer_id: customerId,
        dich_vu: convertDichVu || "Kiểm soát côn trùng",
        dien_tich: convertDienTich || null,
        gia_tri: null,
        trang_thai: "Mới",
        ngay_bat_dau: new Date().toISOString().split("T")[0],
        ngay_ket_thuc: null,
        ghi_chu: convertGhiChu || null,
      });

      await updateServiceRequest(selectedItem.id, {
        trang_thai: "Đã tạo HĐ",
        xu_ly_boi: user?.id ?? null,
      });

      const msg = existingCustomer
        ? `Đã tạo hợp đồng mới cho khách hàng ${existingCustomer.ma_kh} - ${existingCustomer.ten_kh}`
        : "Chuyển đổi thành công! Đã tạo khách hàng và hợp đồng mới.";
      toast.success(msg);
      setDialogOpen(false);
      loadData();
      router.push("/admin/hop-dong");
    } catch {
      toast.error("Có lỗi xảy ra khi chuyển đổi");
    } finally {
      setConverting(false);
    }
  };

  const filtered = data.filter((item) => {
    // Status filter: "active" hides converted/rejected
    if (filterStatus === "active" && (item.trang_thai === "Đã tạo HĐ" || item.trang_thai === "Từ chối")) return false;
    if (filterStatus !== "active" && filterStatus !== "all" && item.trang_thai !== filterStatus) return false;

    // Loại hình filter
    if (filterLoaiHinh !== "all") {
      const val = item.loai_hinh ?? "Cá nhân / Hộ gia đình";
      if (!val.includes(filterLoaiHinh)) return false;
    }

    // Search
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      item.ma_yc.toLowerCase().includes(q) ||
      item.ten_kh.toLowerCase().includes(q) ||
      item.sdt.toLowerCase().includes(q) ||
      (item.loai_hinh ?? "").toLowerCase().includes(q) ||
      (item.loai_con_trung ?? "").toLowerCase().includes(q)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Detect duplicate phones in all data
  const phoneCounts = data.reduce<Record<string, number>>((acc, item) => {
    const p = sanitizePhone(item.sdt);
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  const canEdit = user?.vai_tro === "Admin" || user?.vai_tro === "Nhân viên";

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Yêu cầu dịch vụ</h1>
          <p className="admin-page-subtitle">
            Quản lý yêu cầu từ form liên hệ công khai
          </p>
        </div>
        {canEdit && (
          <Button className="btn-add" onClick={openCreateDialog}>
            <Plus size={16} /> Thêm yêu cầu
          </Button>
        )}
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm yêu cầu..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang xử lý</SelectItem>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Mới">Mới</SelectItem>
                <SelectItem value="Đã liên hệ">Đã liên hệ</SelectItem>
                <SelectItem value="Đã tạo HĐ">Đã chuyển đổi</SelectItem>
                <SelectItem value="Từ chối">Từ chối</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLoaiHinh} onValueChange={(v) => { setFilterLoaiHinh(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại hình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại hình</SelectItem>
                <SelectItem value="Cá nhân">Cá nhân / Hộ gia đình</SelectItem>
                <SelectItem value="Doanh nghiệp">Doanh nghiệp / Khu CN</SelectItem>
                <SelectItem value="chung cư">Chung cư / VP / Trường học</SelectItem>
                <SelectItem value="Trang trại">Trang trại</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>Không có dữ liệu</p>
          </div>
        ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã YC</TableHead>
                <TableHead>Tên KH</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Loại hình</TableHead>
                <TableHead>Loại côn trùng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.ma_yc}</TableCell>
                  <TableCell>{item.loai_kh === "Tổ chức" ? (item.ten_cong_ty ?? item.ten_kh) : item.ten_kh}</TableCell>
                  <TableCell>
                    {item.sdt}
                    {phoneCounts[sanitizePhone(item.sdt)] > 1 && (
                      <span title="SĐT trùng lặp" style={{ marginLeft: 4, color: "#E65100", fontSize: 12 }}>⚠️</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={getLoaiHinhBadgeClass(item.loai_hinh)}>
                      {item.loai_hinh ?? "Cá nhân / Hộ gia đình"}
                    </span>
                  </TableCell>
                  <TableCell>{item.loai_con_trung ?? "—"}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Select
                        value={item.trang_thai}
                        onValueChange={(v) => handleStatusChange(item, v)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mới">Mới</SelectItem>
                          <SelectItem value="Đã liên hệ">
                            Đã liên hệ
                          </SelectItem>
                          <SelectItem value="Đã tạo HĐ">
                            Đã chuyển đổi
                          </SelectItem>
                          <SelectItem value="Từ chối">Từ chối</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={
                          statusBadgeClass[item.trang_thai] ?? "status-badge"
                        }
                      >
                        {statusLabels[item.trang_thai] ?? item.trang_thai}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="data-table-actions">
                      <button
                        className="btn-action"
                        onClick={() => openDialog(item)}
                        title="Xem chi tiết"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm yêu cầu dịch vụ</DialogTitle>
            <DialogDescription>Tạo yêu cầu dịch vụ mới từ cuộc gọi, tin nhắn hoặc kênh khác.</DialogDescription>
          </DialogHeader>
          <div className="form-grid">
            <div className="form-field">
              <Label>Tên khách hàng *</Label>
              <Input value={newTenKH} onChange={(e) => setNewTenKH(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="form-field">
              <Label>Số điện thoại *</Label>
              <Input value={newSDT} onChange={(e) => setNewSDT(e.target.value)} placeholder="0912345678" />
            </div>
            <div className="form-field">
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="form-field">
              <Label>Địa chỉ</Label>
              <Input value={newDiaChi} onChange={(e) => setNewDiaChi(e.target.value)} />
            </div>
            <div className="form-field">
              <Label>Loại hình</Label>
              <select className="native-select" value={newLoaiHinh} onChange={(e) => setNewLoaiHinh(e.target.value)}>
                <option value="">Chọn loại hình</option>
                {LOAI_HINH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="form-field full-width">
              <Label>Loại côn trùng</Label>
              <div className="popup-bug-chips">
                {BUG_OPTIONS.map((bug) => (
                  <button key={bug} type="button" className={`popup-chip${newBugs.includes(bug) ? " active" : ""}`} onClick={() => setNewBugs((prev) => prev.includes(bug) ? prev.filter((b) => b !== bug) : [...prev, bug])}>
                    {newBugs.includes(bug) && <Check size={14} />}
                    {bug}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <Label>Diện tích (m²)</Label>
              <Input value={newDienTich} onChange={(e) => setNewDienTich(e.target.value)} placeholder="VD: 80" />
            </div>
            <div className="form-field full-width">
              <Label>Mô tả</Label>
              <Textarea rows={3} value={newMoTa} onChange={(e) => setNewMoTa(e.target.value)} placeholder="Tình trạng côn trùng, yêu cầu đặc biệt..." />
            </div>
          </div>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Đang tạo..." : "Tạo yêu cầu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified Detail + Convert Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setIsConvertMode(false); setShowDuplicateConfirm(false); setConverting(false); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isConvertMode ? `Chuyển đổi yêu cầu ${selectedItem?.ma_yc}` : `Chi tiết yêu cầu ${selectedItem?.ma_yc}`}
            </DialogTitle>
            <DialogDescription>
              {isConvertMode
                ? "Tạo khách hàng và hợp đồng mới từ yêu cầu này. Kiểm tra và chỉnh sửa thông tin trước khi chuyển đổi."
                : "Thông tin chi tiết yêu cầu dịch vụ"}
            </DialogDescription>
          </DialogHeader>

          {showDuplicateConfirm && duplicateCustomer ? (
            <div className="form-grid">
              <div className="form-field full-width" style={{ background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={20} color="#F57C00" />
                  <strong style={{ color: "#E65100" }}>Khách hàng đã tồn tại</strong>
                </div>
                <p style={{ fontSize: 14, color: "#424242", margin: "0 0 8px" }}>
                  {duplicateMatchType === "email"
                    ? <>Email <strong>{sanitizeEmail(convertEmail)}</strong></>
                    : duplicateMatchType === "both"
                    ? <>SĐT <strong>{sanitizePhone(convertSDT)}</strong> và Email <strong>{sanitizeEmail(convertEmail)}</strong></>
                    : <>SĐT <strong>{sanitizePhone(convertSDT)}</strong></>
                  }{" "}đã thuộc về khách hàng{" "}
                  <strong>{duplicateCustomer.ma_kh} - {duplicateCustomer.ten_kh}</strong>.
                </p>
                {hasInfoChanged(duplicateCustomer) && (
                  <div style={{ fontSize: 13, color: "#424242", background: "#fff", borderRadius: 6, padding: 10, marginTop: 8 }}>
                    <strong>Thông tin thay đổi:</strong>
                    <table style={{ width: "100%", marginTop: 6, fontSize: 13 }}>
                      <thead><tr><th style={{ textAlign: "left", padding: "2px 8px" }}></th><th style={{ textAlign: "left", padding: "2px 8px" }}>KH cũ</th><th style={{ textAlign: "left", padding: "2px 8px" }}>Yêu cầu mới</th></tr></thead>
                      <tbody>
                        {duplicateCustomer.ten_kh !== convertTenKH.trim() && (
                          <tr><td style={{ padding: "2px 8px" }}>Tên</td><td style={{ padding: "2px 8px" }}>{duplicateCustomer.ten_kh}</td><td style={{ padding: "2px 8px", fontWeight: 600 }}>{convertTenKH.trim()}</td></tr>
                        )}
                        {(duplicateCustomer.email ?? "") !== (convertEmail ? sanitizeEmail(convertEmail) : "") && (
                          <tr><td style={{ padding: "2px 8px" }}>Email</td><td style={{ padding: "2px 8px" }}>{duplicateCustomer.email ?? "—"}</td><td style={{ padding: "2px 8px", fontWeight: 600 }}>{convertEmail || "—"}</td></tr>
                        )}
                        {(duplicateCustomer.dia_chi ?? "") !== convertDiaChi.trim() && (
                          <tr><td style={{ padding: "2px 8px" }}>Địa chỉ</td><td style={{ padding: "2px 8px" }}>{duplicateCustomer.dia_chi ?? "—"}</td><td style={{ padding: "2px 8px", fontWeight: 600 }}>{convertDiaChi.trim() || "—"}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="form-actions" style={{ width: "100%", flexWrap: "wrap", gap: 8 }}>
                <Button variant="outline" onClick={() => setShowDuplicateConfirm(false)}>
                  Quay lại
                </Button>
                <Button onClick={() => doConvert(duplicateCustomer, false)} disabled={converting}>
                  {converting ? "Đang xử lý..." : "Tạo hợp đồng mới"}
                </Button>
                {hasInfoChanged(duplicateCustomer) && (
                  <Button variant="destructive" onClick={() => doConvert(duplicateCustomer, true)} disabled={converting}>
                    {converting ? "Đang xử lý..." : "Tạo KH mới (thay thế cũ)"}
                  </Button>
                )}
              </div>
            </div>
          ) : isConvertMode ? (
            <>
              <div className="form-grid">
                <div className="form-field">
                  <Label>Tên khách hàng *</Label>
                  <Input
                    value={convertTenKH}
                    onChange={(e) => setConvertTenKH(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <Label>Số điện thoại *</Label>
                  <Input
                    value={convertSDT}
                    onChange={(e) => setConvertSDT(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={convertEmail}
                    onChange={(e) => setConvertEmail(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <Label>Địa chỉ</Label>
                  <Input
                    value={convertDiaChi}
                    onChange={(e) => setConvertDiaChi(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <Label>Dịch vụ (hợp đồng)</Label>
                  <Input
                    value={convertDichVu}
                    onChange={(e) => setConvertDichVu(e.target.value)}
                    placeholder="Kiểm soát côn trùng"
                  />
                </div>
                <div className="form-field">
                  <Label>Loại hình</Label>
                  <p>{convertLoaiHinh || "Cá nhân"}</p>
                </div>
                <div className="form-field">
                  <Label>Diện tích (m²)</Label>
                  <Input
                    value={convertDienTich}
                    onChange={(e) => setConvertDienTich(e.target.value)}
                    placeholder="VD: 80"
                  />
                </div>
                <div className="form-field full-width">
                  <Label>Ghi chú</Label>
                  <Textarea
                    rows={4}
                    value={convertGhiChu}
                    onChange={(e) => setConvertGhiChu(e.target.value)}
                    placeholder="Thông tin bổ sung..."
                  />
                </div>
              </div>
              <div className="form-actions">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={checkDuplicateAndConvert} disabled={converting}>
                  {converting ? "Đang xử lý..." : "Chuyển đổi"}
                </Button>
              </div>
            </>
          ) : selectedItem && (
            <>
              <div className="form-grid">
                <div className="form-field">
                  <Label>Mã yêu cầu</Label>
                  <p>{selectedItem.ma_yc}</p>
                </div>
                <div className="form-field">
                  <Label>Trạng thái</Label>
                  <p>
                    <span className={statusBadgeClass[selectedItem.trang_thai] ?? "status-badge"}>
                      {statusLabels[selectedItem.trang_thai] ?? selectedItem.trang_thai}
                    </span>
                  </p>
                </div>
                <div className="form-field">
                  <Label>Tên khách hàng</Label>
                  <p>{selectedItem.ten_kh}</p>
                </div>
                {selectedItem.ten_cong_ty && (
                  <div className="form-field">
                    <Label>Tên công ty</Label>
                    <p>{selectedItem.ten_cong_ty}</p>
                  </div>
                )}
                {selectedItem.nguoi_lien_he && (
                  <div className="form-field">
                    <Label>Người liên hệ</Label>
                    <p>{selectedItem.nguoi_lien_he}</p>
                  </div>
                )}
                <div className="form-field">
                  <Label>Số điện thoại</Label>
                  <p>{selectedItem.sdt}</p>
                </div>
                <div className="form-field">
                  <Label>Email</Label>
                  <p>{selectedItem.email ?? "—"}</p>
                </div>
                <div className="form-field">
                  <Label>Địa chỉ</Label>
                  <p>{selectedItem.dia_chi ?? "—"}</p>
                </div>
                <div className="form-field">
                  <Label>Loại hình</Label>
                  <p>{selectedItem.loai_hinh ?? "Cá nhân / Hộ gia đình"}</p>
                </div>
                {selectedItem.nhu_cau && (
                  <div className="form-field">
                    <Label>Nhu cầu</Label>
                    <p>{selectedItem.nhu_cau}</p>
                  </div>
                )}
                {selectedItem.so_chi_nhanh && (
                  <div className="form-field">
                    <Label>Số chi nhánh</Label>
                    <p>{selectedItem.so_chi_nhanh}</p>
                  </div>
                )}
                <div className="form-field">
                  <Label>Loại côn trùng</Label>
                  <p>{selectedItem.loai_con_trung ?? "—"}</p>
                </div>
                <div className="form-field">
                  <Label>Diện tích</Label>
                  <p>{selectedItem.dien_tich ?? "—"}</p>
                </div>
                <div className="form-field">
                  <Label>Ngày gửi</Label>
                  <p>{formatDate(selectedItem.created_at)}</p>
                </div>
                <div className="form-field full-width">
                  <Label>Mô tả</Label>
                  <p>{selectedItem.mo_ta ?? "—"}</p>
                </div>
                <div className="form-field full-width">
                  <Label>Ghi chú nhân viên</Label>
                  {canEdit ? (
                    <Textarea
                      rows={3}
                      defaultValue={selectedItem.ghi_chu_nv ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (selectedItem.ghi_chu_nv ?? "")) {
                          handleNotesUpdate(selectedItem, e.target.value);
                        }
                      }}
                      placeholder="Nhập ghi chú..."
                    />
                  ) : (
                    <p>{selectedItem.ghi_chu_nv ?? "—"}</p>
                  )}
                </div>
              </div>
              <div className="form-actions">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Đóng
                </Button>
                {canEdit && selectedItem.trang_thai !== "Đã tạo HĐ" && (
                  <Button onClick={() => setIsConvertMode(true)}>
                    <ArrowRightLeft size={16} />
                    Chuyển đổi
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
