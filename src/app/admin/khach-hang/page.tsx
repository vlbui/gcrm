"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type Customer,
  type CreateCustomerInput,
} from "@/lib/api/customers.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Pagination from "@/components/admin/Pagination";

const customerSchema = z.object({
  ten_kh: z.string().min(2, "Tên khách hàng tối thiểu 2 ký tự"),
  sdt: z.string().regex(/^(0\d{9,10})$/, "SĐT phải có 10-11 số, bắt đầu bằng 0"),
  email: z.string().email("Email không hợp lệ").or(z.literal("")).nullable(),
  dia_chi: z.string().min(1, "Địa chỉ là bắt buộc"),
  loai_kh: z.string(),
  trang_thai: z.string(),
  ghi_chu: z.string().nullable(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function KhachHangPage() {
  const { user } = useCurrentUser();
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      ten_kh: "",
      sdt: "",
      email: "",
      dia_chi: "",
      loai_kh: "Hộ gia đình",
      trang_thai: "Mới",
      ghi_chu: "",
    },
  });

  const loadData = async () => {
    try {
      const result = await fetchCustomers();
      setData(result);
    } catch {
      toast.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.ten_kh.toLowerCase().includes(q) ||
      item.sdt.toLowerCase().includes(q) ||
      (item.email?.toLowerCase().includes(q) ?? false) ||
      item.ma_kh.toLowerCase().includes(q)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    reset({
      ten_kh: "",
      sdt: "",
      email: "",
      dia_chi: "",
      loai_kh: "Hộ gia đình",
      trang_thai: "Mới",
      ghi_chu: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Customer) => {
    setEditing(item);
    reset({
      ten_kh: item.ten_kh,
      sdt: item.sdt,
      email: item.email ?? "",
      dia_chi: item.dia_chi ?? "",
      loai_kh: item.loai_kh,
      trang_thai: item.trang_thai,
      ghi_chu: item.ghi_chu ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: CustomerFormData) => {
    try {
      const input: CreateCustomerInput = {
        ten_kh: formData.ten_kh,
        sdt: formData.sdt,
        email: formData.email || null,
        dia_chi: formData.dia_chi || null,
        loai_kh: formData.loai_kh,
        trang_thai: formData.trang_thai,
        ghi_chu: formData.ghi_chu || null,
      };
      if (editing) {
        await updateCustomer(editing.id, input);
        toast.success("Cập nhật khách hàng thành công");
      } else {
        await createCustomer(input);
        toast.success("Thêm khách hàng thành công");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleDelete = async (item: Customer) => {
    if (!window.confirm(`Xác nhận xóa khách hàng "${item.ten_kh}"?`)) return;
    try {
      await deleteCustomer(item.id);
      toast.success("Xóa khách hàng thành công");
      loadData();
    } catch {
      toast.error("Không thể xóa khách hàng");
    }
  };

  const canEdit = (item: Customer) => {
    if (!user) return false;
    if (user.vai_tro === "Xem") return false;
    if (user.vai_tro === "Admin") return true;
    return item.created_by === user.id;
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Khách hàng</h1>
          <p className="admin-page-subtitle">Quản lý danh sách khách hàng</p>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo tên, SĐT, email, mã KH..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="data-table-actions">
            {user?.vai_tro !== "Xem" && (
              <Button className="btn-add" onClick={openAdd}>
                <Plus size={16} /> Thêm khách hàng
              </Button>
            )}
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
                <TableHead>Mã KH</TableHead>
                <TableHead>Tên KH</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Loại KH</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.ma_kh}</TableCell>
                  <TableCell>{item.ten_kh}</TableCell>
                  <TableCell>{item.sdt}</TableCell>
                  <TableCell>{item.email ?? "—"}</TableCell>
                  <TableCell>{item.loai_kh}</TableCell>
                  <TableCell>
                    <span
                      className={`status-badge ${
                        item.trang_thai === "Mới"
                          ? "moi"
                          : item.trang_thai === "Đang phục vụ"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {item.trang_thai}
                    </span>
                  </TableCell>
                  <TableCell>
                    {canEdit(item) && (
                      <>
                        <button
                          className="btn-action"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn-action danger"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Cập nhật khách hàng" : "Thêm khách hàng"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Tên khách hàng *</Label>
                <Input placeholder="Nhập tên khách hàng" {...register("ten_kh")} />
                {errors.ten_kh && (
                  <span className="error">{errors.ten_kh.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Số điện thoại *</Label>
                <Input placeholder="VD: 0859955969" {...register("sdt")} />
                {errors.sdt && (
                  <span className="error">{errors.sdt.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Email</Label>
                <Input placeholder="VD: email@gmail.com" {...register("email")} />
                {errors.email && (
                  <span className="error">{errors.email.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Loại khách hàng</Label>
                <Select
                  defaultValue={editing?.loai_kh ?? "Hộ gia đình"}
                  onValueChange={(val) => setValue("loai_kh", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hộ gia đình">Hộ gia đình</SelectItem>
                    <SelectItem value="Doanh nghiệp">Doanh nghiệp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="form-field">
                <Label>Trạng thái</Label>
                <Select
                  defaultValue={editing?.trang_thai ?? "Mới"}
                  onValueChange={(val) => setValue("trang_thai", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mới">Mới</SelectItem>
                    <SelectItem value="Đang phục vụ">Đang phục vụ</SelectItem>
                    <SelectItem value="Ngưng">Ngưng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="form-field full-width">
                <Label>Địa chỉ *</Label>
                <Textarea placeholder="Nhập địa chỉ đầy đủ" {...register("dia_chi")} />
                {errors.dia_chi && (
                  <span className="error">{errors.dia_chi.message}</span>
                )}
              </div>
              <div className="form-field full-width">
                <Label>Ghi chú</Label>
                <Textarea placeholder="Thêm ghi chú nếu cần..." {...register("ghi_chu")} />
              </div>
            </div>
            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Đang lưu..."
                  : editing
                  ? "Cập nhật"
                  : "Thêm mới"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
