"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Eye, ArrowRightLeft, AlertTriangle } from "lucide-react";
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
  type ServiceRequest,
} from "@/lib/api/serviceRequests.api";
import { createCustomer, fetchCustomers, type Customer } from "@/lib/api/customers.api";
import { createContract } from "@/lib/api/contracts.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Pagination from "@/components/admin/Pagination";

const statusLabels: Record<string, string> = {
  "Mới": "Mới",
  "Đã liên hệ": "Đã liên hệ",
  "Đã tạo HĐ": "Đã tạo HĐ",
  "Từ chối": "Từ chối",
};

const statusBadgeClass: Record<string, string> = {
  "Mới": "status-badge moi",
  "Đã liên hệ": "status-badge dang-xu-ly",
  "Đã tạo HĐ": "status-badge hoan-thanh",
  "Từ chối": "status-badge huy",
};

export default function YeuCauPage() {
  const { user } = useCurrentUser();
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceRequest | null>(null);
  const [converting, setConverting] = useState(false);

  // Convert form fields
  const [convertTenKH, setConvertTenKH] = useState("");
  const [convertSDT, setConvertSDT] = useState("");
  const [convertEmail, setConvertEmail] = useState("");
  const [convertDiaChi, setConvertDiaChi] = useState("");
  const [convertLoaiKH, setConvertLoaiKH] = useState("Hộ gia đình");
  const [convertDichVu, setConvertDichVu] = useState("");
  const [convertDienTich, setConvertDienTich] = useState("");
  const [convertLoaiHinh, setConvertLoaiHinh] = useState("");
  const [convertGhiChu, setConvertGhiChu] = useState("");

  // Duplicate customer check
  const [duplicateCustomer, setDuplicateCustomer] = useState<Customer | null>(null);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

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

  const openDetailDialog = (item: ServiceRequest) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const openConvertDialog = (item: ServiceRequest) => {
    setSelectedItem(item);
    const isOrg = item.loai_kh === "Tổ chức";

    setConvertTenKH(isOrg ? (item.ten_cong_ty ?? item.ten_kh) : item.ten_kh);
    setConvertSDT(item.sdt);
    setConvertEmail(item.email ?? "");
    setConvertDiaChi(item.dia_chi ?? "");
    setConvertLoaiKH(isOrg ? "Doanh nghiệp" : "Cá nhân");
    setConvertDichVu(item.loai_con_trung ?? "");
    setConvertDienTich(item.dien_tich ?? "");
    setConvertLoaiHinh(item.loai_hinh ?? "");

    // Build ghi_chu from all request details
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

    setDuplicateCustomer(null);
    setShowDuplicateConfirm(false);
    setConvertDialogOpen(true);
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

  const checkDuplicateAndConvert = async () => {
    if (!selectedItem) return;

    try {
      const customers = await fetchCustomers();
      const existing = customers.find((c) => c.sdt === convertSDT.trim());

      if (existing) {
        setDuplicateCustomer(existing);
        setShowDuplicateConfirm(true);
        return;
      }

      await doConvert(null);
    } catch {
      toast.error("Có lỗi xảy ra khi kiểm tra");
    }
  };

  const doConvert = async (existingCustomer: Customer | null) => {
    if (!selectedItem) return;
    setConverting(true);
    setShowDuplicateConfirm(false);

    try {
      let customerId: string;

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const customer = await createCustomer({
          ten_kh: convertTenKH,
          sdt: convertSDT,
          email: convertEmail || null,
          dia_chi: convertDiaChi || null,
          loai_kh: convertLoaiKH === "Cá nhân" ? "Hộ gia đình" : "Doanh nghiệp",
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
      setConvertDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra khi chuyển đổi");
    } finally {
      setConverting(false);
    }
  };

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.ma_yc.toLowerCase().includes(q) ||
      item.ten_kh.toLowerCase().includes(q) ||
      item.sdt.toLowerCase().includes(q) ||
      (item.loai_hinh ?? "").toLowerCase().includes(q) ||
      (item.loai_con_trung ?? "").toLowerCase().includes(q)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

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
                <TableHead>Loại KH</TableHead>
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
                  <TableCell>
                    <span className={`status-badge ${item.loai_kh === "Tổ chức" ? "active" : "moi"}`}>
                      {item.loai_kh ?? "Cá nhân"}
                    </span>
                  </TableCell>
                  <TableCell>{item.loai_kh === "Tổ chức" ? (item.ten_cong_ty ?? item.ten_kh) : item.ten_kh}</TableCell>
                  <TableCell>{item.sdt}</TableCell>
                  <TableCell>{item.loai_hinh ?? "—"}</TableCell>
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
                            Đã tạo HĐ
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
                    {new Date(item.created_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <div className="data-table-actions">
                      <button
                        className="btn-action"
                        onClick={() => openDetailDialog(item)}
                      >
                        <Eye size={14} />
                      </button>
                      {canEdit && item.trang_thai !== "Đã tạo HĐ" && (
                        <button
                          className="btn-action"
                          onClick={() => openConvertDialog(item)}
                          title="Chuyển đổi thành khách hàng"
                        >
                          <ArrowRightLeft size={14} />
                        </button>
                      )}
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Chi tiết yêu cầu {selectedItem?.ma_yc}
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết yêu cầu dịch vụ
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="form-grid">
              <div className="form-field">
                <Label>Mã yêu cầu</Label>
                <p>{selectedItem.ma_yc}</p>
              </div>
              <div className="form-field">
                <Label>Trạng thái</Label>
                <p>
                  <span
                    className={
                      statusBadgeClass[selectedItem.trang_thai] ??
                      "status-badge"
                    }
                  >
                    {statusLabels[selectedItem.trang_thai] ??
                      selectedItem.trang_thai}
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
                <p>{selectedItem.loai_hinh ?? "—"}</p>
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
                <p>
                  {new Date(selectedItem.created_at).toLocaleDateString(
                    "vi-VN"
                  )}
                </p>
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
          )}
          <div className="form-actions">
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              Đóng
            </Button>
            {canEdit &&
              selectedItem &&
              selectedItem.trang_thai !== "Đã tạo HĐ" && (
                <Button
                  onClick={() => {
                    setDetailDialogOpen(false);
                    openConvertDialog(selectedItem);
                  }}
                >
                  <ArrowRightLeft size={16} />
                  Chuyển đổi
                </Button>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Chuyển đổi yêu cầu {selectedItem?.ma_yc}
            </DialogTitle>
            <DialogDescription>
              Tạo khách hàng và hợp đồng mới từ yêu cầu này. Kiểm tra và chỉnh
              sửa thông tin trước khi chuyển đổi.
            </DialogDescription>
          </DialogHeader>

          {showDuplicateConfirm && duplicateCustomer ? (
            <div className="form-grid">
              <div className="form-field full-width" style={{ background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 8, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={20} color="#F57C00" />
                  <strong style={{ color: "#E65100" }}>Khách hàng đã tồn tại</strong>
                </div>
                <p style={{ fontSize: 14, color: "#424242", margin: 0 }}>
                  SĐT <strong>{convertSDT}</strong> đã thuộc về khách hàng{" "}
                  <strong>{duplicateCustomer.ma_kh} - {duplicateCustomer.ten_kh}</strong>.
                  <br />
                  Bạn có muốn tạo hợp đồng mới cho khách hàng này?
                </p>
              </div>
              <div className="form-actions" style={{ width: "100%" }}>
                <Button variant="outline" onClick={() => setShowDuplicateConfirm(false)}>
                  Quay lại
                </Button>
                <Button onClick={() => doConvert(duplicateCustomer)} disabled={converting}>
                  {converting ? "Đang xử lý..." : "Tạo HĐ cho KH cũ"}
                </Button>
              </div>
            </div>
          ) : (
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
                  <p>{convertLoaiHinh || "—"}</p>
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
                  onClick={() => setConvertDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button onClick={checkDuplicateAndConvert} disabled={converting}>
                  {converting ? "Đang xử lý..." : "Chuyển đổi"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
