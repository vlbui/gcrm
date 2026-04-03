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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchSupplies,
  createSupply,
  updateSupply,
  deleteSupply,
  type Supply,
  type CreateSupplyInput,
} from "@/lib/api/supplies.api";
import { fetchSuppliers, type Supplier } from "@/lib/api/suppliers.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Pagination from "@/components/admin/Pagination";

const supplySchema = z.object({
  ten_vat_tu: z.string().min(2, "Tên vật tư tối thiểu 2 ký tự"),
  loai_vt: z.string().min(1, "Loại vật tư là bắt buộc"),
  don_vi_tinh: z.string().min(1, "Đơn vị tính là bắt buộc"),
  nha_cung_cap: z.string().nullable(),
  ghi_chu: z.string().nullable(),
});

type SupplyFormData = z.infer<typeof supplySchema>;

export default function VatTuPage() {
  const { user } = useCurrentUser();
  const [data, setData] = useState<Supply[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supply | null>(null);
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Supply | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupplyFormData>({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      ten_vat_tu: "",
      loai_vt: "",
      don_vi_tinh: "",
      nha_cung_cap: "",
      ghi_chu: "",
    },
  });

  const loadData = async () => {
    try {
      const [result, supplierList] = await Promise.all([
        fetchSupplies(),
        fetchSuppliers(),
      ]);
      setData(result);
      setSuppliers(supplierList);
    } catch {
      toast.error("Không thể tải danh sách vật tư");
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
      item.ten_vat_tu.toLowerCase().includes(q) ||
      item.ma_vt.toLowerCase().includes(q) ||
      (item.loai_vt?.toLowerCase().includes(q) ?? false) ||
      (item.nha_cung_cap?.toLowerCase().includes(q) ?? false)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    reset({
      ten_vat_tu: "",
      loai_vt: "",
      don_vi_tinh: "",
      nha_cung_cap: "",
      ghi_chu: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Supply) => {
    setEditing(item);
    reset({
      ten_vat_tu: item.ten_vat_tu,
      loai_vt: item.loai_vt ?? "",
      don_vi_tinh: item.don_vi_tinh ?? "",
      nha_cung_cap: item.nha_cung_cap ?? "",
      ghi_chu: item.ghi_chu ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: SupplyFormData) => {
    try {
      const input: CreateSupplyInput = {
        ten_vat_tu: formData.ten_vat_tu,
        loai_vt: formData.loai_vt || null,
        don_vi_tinh: formData.don_vi_tinh || null,
        nha_cung_cap: formData.nha_cung_cap || null,
        ghi_chu: formData.ghi_chu || null,
      };
      if (editing) {
        await updateSupply(editing.id, input);
        toast.success("Cập nhật vật tư thành công");
      } else {
        await createSupply(input);
        toast.success("Thêm vật tư thành công");
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
      await deleteSupply(deletingItem.id);
      toast.success("Xóa vật tư thành công");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadData();
    } catch {
      toast.error("Không thể xóa vật tư");
    }
  };

  const canEdit = (item: Supply) => {
    if (!user) return false;
    if (user.vai_tro === "Xem") return false;
    if (user.vai_tro === "Admin") return true;
    return item.created_by === user.id;
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Vật tư</h1>
          <p className="admin-page-subtitle">Quản lý danh sách vật tư</p>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo tên, mã VT, loại, nhà cung cấp..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="data-table-actions">
            {user?.vai_tro !== "Xem" && (
              <Button className="btn-add" onClick={openAdd}>
                <Plus size={16} /> Thêm vật tư
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
                <TableHead>Mã VT</TableHead>
                <TableHead>Tên vật tư</TableHead>
                <TableHead>Loại VT</TableHead>
                <TableHead>Đơn vị tính</TableHead>
                <TableHead>Nhà cung cấp</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.ma_vt}</TableCell>
                  <TableCell>{item.ten_vat_tu}</TableCell>
                  <TableCell>{item.loai_vt ?? "—"}</TableCell>
                  <TableCell>{item.don_vi_tinh ?? "—"}</TableCell>
                  <TableCell>{item.nha_cung_cap ?? "—"}</TableCell>
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
              {editing ? "Cập nhật vật tư" : "Thêm vật tư"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Tên vật tư *</Label>
                <Input placeholder="VD: Bẫy dính chuột" {...register("ten_vat_tu")} />
                {errors.ten_vat_tu && (
                  <span className="error">{errors.ten_vat_tu.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Loại vật tư *</Label>
                <Input placeholder="VD: Bẫy, Thuốc, Dụng cụ" {...register("loai_vt")} />
                {errors.loai_vt && (
                  <span className="error">{errors.loai_vt.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Đơn vị tính *</Label>
                <Input placeholder="VD: Cái, Hộp, Kg" {...register("don_vi_tinh")} />
                {errors.don_vi_tinh && (
                  <span className="error">{errors.don_vi_tinh.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Nhà cung cấp</Label>
                <Select
                  value={watch("nha_cung_cap") ?? ""}
                  onValueChange={(val) => setValue("nha_cung_cap", val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.ten_ncc}>
                        {s.ten_ncc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              Bạn có chắc chắn muốn xóa vật tư{" "}
              <strong>{deletingItem?.ten_vat_tu}</strong>?
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
