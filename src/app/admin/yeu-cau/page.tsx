"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Eye, ArrowRightLeft } from "lucide-react";
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
import { createCustomer } from "@/lib/api/customers.api";
import { createContract } from "@/lib/api/contracts.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceRequest | null>(null);
  const [converting, setConverting] = useState(false);

  // Convert form fields
  const [convertTenKH, setConvertTenKH] = useState("");
  const [convertSDT, setConvertSDT] = useState("");
  const [convertEmail, setConvertEmail] = useState("");
  const [convertDiaChi, setConvertDiaChi] = useState("");
  const [convertDichVu, setConvertDichVu] = useState("");

  const loadData = async () => {
    try {
      const requests = await fetchServiceRequests();
      setData(requests);
    } catch {
      toast.error("Khong the tai du lieu");
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
    setConvertTenKH(item.ten_kh);
    setConvertSDT(item.sdt);
    setConvertEmail(item.email ?? "");
    setConvertDiaChi(item.dia_chi ?? "");
    setConvertDichVu(item.loai_con_trung ?? "");
    setConvertDialogOpen(true);
  };

  const handleStatusChange = async (
    item: ServiceRequest,
    newStatus: string
  ) => {
    try {
      await updateServiceRequest(item.id, { trang_thai: newStatus });
      toast.success("Cap nhat trang thai thanh cong");
      loadData();
    } catch {
      toast.error("Khong the cap nhat trang thai");
    }
  };

  const handleNotesUpdate = async (item: ServiceRequest, notes: string) => {
    try {
      await updateServiceRequest(item.id, {
        ghi_chu_nv: notes,
        xu_ly_boi: user?.id ?? null,
      });
      toast.success("Cap nhat ghi chu thanh cong");
      loadData();
    } catch {
      toast.error("Khong the cap nhat ghi chu");
    }
  };

  const handleConvert = async () => {
    if (!selectedItem) return;
    setConverting(true);
    try {
      // Create customer
      const customer = await createCustomer({
        ten_kh: convertTenKH,
        sdt: convertSDT,
        email: convertEmail || null,
        dia_chi: convertDiaChi || null,
        loai_kh: "Hộ gia đình",
        trang_thai: "Mới",
        ghi_chu: `Chuyen doi tu yeu cau ${selectedItem.ma_yc}`,
      });

      // Create contract
      await createContract({
        customer_id: customer.id,
        dich_vu: convertDichVu || "Kiem soat con trung",
        dien_tich: selectedItem.dien_tich ?? null,
        gia_tri: null,
        trang_thai: "Mới",
        ngay_bat_dau: new Date().toISOString().split("T")[0],
        ngay_ket_thuc: null,
        ghi_chu: `Tu yeu cau ${selectedItem.ma_yc}. ${selectedItem.mo_ta ?? ""}`,
      });

      // Update request status
      await updateServiceRequest(selectedItem.id, {
        trang_thai: "Đã tạo HĐ",
        xu_ly_boi: user?.id ?? null,
      });

      toast.success("Chuyen doi thanh cong! Da tao khach hang va hop dong moi.");
      setConvertDialogOpen(false);
      loadData();
    } catch {
      toast.error("Co loi xay ra khi chuyen doi");
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

  const canEdit = user?.vai_tro === "Admin" || user?.vai_tro === "Nhân viên";

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Yeu cau dich vu</h1>
          <p className="admin-page-subtitle">
            Quan ly yeu cau tu form lien he cong khai
          </p>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tim kiem yeu cau..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Dang tai...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>Khong co du lieu</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ma YC</TableHead>
                <TableHead>Ten KH</TableHead>
                <TableHead>SDT</TableHead>
                <TableHead>Loai hinh</TableHead>
                <TableHead>Loai con trung</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead>Ngay gui</TableHead>
                <TableHead>Thao tac</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.ma_yc}</TableCell>
                  <TableCell>{item.ten_kh}</TableCell>
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
                      {canEdit && item.trang_thai === "Mới" && (
                        <button
                          className="btn-action"
                          onClick={() => openConvertDialog(item)}
                          title="Chuyen doi thanh khach hang"
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
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Chi tiet yeu cau {selectedItem?.ma_yc}
            </DialogTitle>
            <DialogDescription>
              Thong tin chi tiet yeu cau dich vu
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="form-grid">
              <div className="form-field">
                <Label>Ma yeu cau</Label>
                <p>{selectedItem.ma_yc}</p>
              </div>
              <div className="form-field">
                <Label>Trang thai</Label>
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
                <Label>Ten khach hang</Label>
                <p>{selectedItem.ten_kh}</p>
              </div>
              <div className="form-field">
                <Label>So dien thoai</Label>
                <p>{selectedItem.sdt}</p>
              </div>
              <div className="form-field">
                <Label>Email</Label>
                <p>{selectedItem.email ?? "—"}</p>
              </div>
              <div className="form-field">
                <Label>Dia chi</Label>
                <p>{selectedItem.dia_chi ?? "—"}</p>
              </div>
              <div className="form-field">
                <Label>Loai hinh</Label>
                <p>{selectedItem.loai_hinh ?? "—"}</p>
              </div>
              <div className="form-field">
                <Label>Loai con trung</Label>
                <p>{selectedItem.loai_con_trung ?? "—"}</p>
              </div>
              <div className="form-field">
                <Label>Dien tich</Label>
                <p>{selectedItem.dien_tich ?? "—"}</p>
              </div>
              <div className="form-field">
                <Label>Ngay gui</Label>
                <p>
                  {new Date(selectedItem.created_at).toLocaleDateString(
                    "vi-VN"
                  )}
                </p>
              </div>
              <div className="form-field full-width">
                <Label>Mo ta</Label>
                <p>{selectedItem.mo_ta ?? "—"}</p>
              </div>
              <div className="form-field full-width">
                <Label>Ghi chu nhan vien</Label>
                {canEdit ? (
                  <Textarea
                    rows={3}
                    defaultValue={selectedItem.ghi_chu_nv ?? ""}
                    onBlur={(e) => {
                      if (e.target.value !== (selectedItem.ghi_chu_nv ?? "")) {
                        handleNotesUpdate(selectedItem, e.target.value);
                      }
                    }}
                    placeholder="Nhap ghi chu..."
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
              Dong
            </Button>
            {canEdit &&
              selectedItem &&
              selectedItem.trang_thai === "Mới" && (
                <Button
                  onClick={() => {
                    setDetailDialogOpen(false);
                    openConvertDialog(selectedItem);
                  }}
                >
                  <ArrowRightLeft size={16} />
                  Chuyen doi
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
              Chuyen doi yeu cau {selectedItem?.ma_yc}
            </DialogTitle>
            <DialogDescription>
              Tao khach hang va hop dong moi tu yeu cau nay. Kiem tra va chinh
              sua thong tin truoc khi chuyen doi.
            </DialogDescription>
          </DialogHeader>
          <div className="form-grid">
            <div className="form-field">
              <Label>Ten khach hang *</Label>
              <Input
                value={convertTenKH}
                onChange={(e) => setConvertTenKH(e.target.value)}
              />
            </div>
            <div className="form-field">
              <Label>So dien thoai *</Label>
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
              <Label>Dia chi</Label>
              <Input
                value={convertDiaChi}
                onChange={(e) => setConvertDiaChi(e.target.value)}
              />
            </div>
            <div className="form-field full-width">
              <Label>Dich vu (hop dong)</Label>
              <Input
                value={convertDichVu}
                onChange={(e) => setConvertDichVu(e.target.value)}
                placeholder="Kiem soat con trung"
              />
            </div>
          </div>
          <div className="form-actions">
            <Button
              variant="outline"
              onClick={() => setConvertDialogOpen(false)}
            >
              Huy
            </Button>
            <Button onClick={handleConvert} disabled={converting}>
              {converting ? "Dang xu ly..." : "Chuyen doi"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
