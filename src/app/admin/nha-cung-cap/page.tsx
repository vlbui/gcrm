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
  DialogDescription,
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
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type Supplier,
  type CreateSupplierInput,
} from "@/lib/api/suppliers.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Pagination from "@/components/admin/Pagination";

const supplierSchema = z.object({
  ten_ncc: z.string().min(2, "Tên nhà cung cấp tối thiểu 2 ký tự"),
  sdt: z.string().nullable(),
  email: z.string().nullable(),
  dia_chi: z.string().nullable(),
  ghi_chu: z.string().nullable(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function NhaCungCapPage() {
  const { user } = useCurrentUser();
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Supplier | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      ten_ncc: "",
      sdt: "",
      email: "",
      dia_chi: "",
      ghi_chu: "",
    },
  });

  const loadData = async () => {
    try {
      const result = await fetchSuppliers();
      setData(result);
    } catch {
      toast.error("Không thể tải danh sách nhà cung cấp");
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
      item.ten_ncc.toLowerCase().includes(q) ||
      item.ma_ncc.toLowerCase().includes(q) ||
      (item.sdt?.toLowerCase().includes(q) ?? false) ||
      (item.email?.toLowerCase().includes(q) ?? false)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    reset({
      ten_ncc: "",
      sdt: "",
      email: "",
      dia_chi: "",
      ghi_chu: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Supplier) => {
    setEditing(item);
    reset({
      ten_ncc: item.ten_ncc,
      sdt: item.sdt ?? "",
      email: item.email ?? "",
      dia_chi: item.dia_chi ?? "",
      ghi_chu: item.ghi_chu ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: SupplierFormData) => {
    try {
      const input: CreateSupplierInput = {
        ten_ncc: formData.ten_ncc,
        sdt: formData.sdt || null,
        email: formData.email || null,
        dia_chi: formData.dia_chi || null,
        ghi_chu: formData.ghi_chu || null,
      };
      if (editing) {
        await updateSupplier(editing.id, input);
        toast.success("Cập nhật nhà cung cấp thành công");
      } else {
        await createSupplier(input);
        toast.success("Thêm nhà cung cấp thành công");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteSupplier(deletingItem.id);
      toast.success("Xóa nhà cung cấp thành công");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadData();
    } catch {
      toast.error("Không thể xóa nhà cung cấp");
    }
  };

  const canEdit = (item: Supplier) => {
    if (!user) return false;
    if (user.vai_tro === "Xem") return false;
    if (user.vai_tro === "Admin") return true;
    return item.created_by === user.id;
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Nhà cung cấp</h1>
          <p className="admin-page-subtitle">Quản lý danh sách nhà cung cấp vật tư, hóa chất</p>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo tên, mã NCC, SĐT, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="data-table-actions">
            {user?.vai_tro !== "Xem" && (
              <Button className="btn-add" onClick={openAdd}>
                <Plus size={16} /> Thêm NCC
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
                <TableHead>Mã NCC</TableHead>
                <TableHead>Tên nhà cung cấp</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.ma_ncc}</TableCell>
                  <TableCell>{item.ten_ncc}</TableCell>
                  <TableCell>{item.sdt ?? "—"}</TableCell>
                  <TableCell>{item.email ?? "—"}</TableCell>
                  <TableCell>{item.dia_chi ?? "—"}</TableCell>
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
                          onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}
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
              {editing ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Tên nhà cung cấp *</Label>
                <Input placeholder="VD: Công ty ABC" {...register("ten_ncc")} />
                {errors.ten_ncc && (
                  <span className="error">{errors.ten_ncc.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Số điện thoại</Label>
                <Input placeholder="VD: 0901234567" {...register("sdt")} />
              </div>
              <div className="form-field">
                <Label>Email</Label>
                <Input placeholder="VD: info@abc.com" {...register("email")} />
              </div>
              <div className="form-field">
                <Label>Địa chỉ</Label>
                <Input placeholder="Địa chỉ nhà cung cấp" {...register("dia_chi")} />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa nhà cung cấp{" "}
              <strong>{deletingItem?.ten_ncc}</strong>?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="form-actions">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
