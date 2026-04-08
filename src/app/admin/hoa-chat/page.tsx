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
  fetchChemicals,
  createChemical,
  updateChemical,
  deleteChemical,
  type Chemical,
  type CreateChemicalInput,
} from "@/lib/api/chemicals.api";
import { fetchSuppliers, type Supplier } from "@/lib/api/suppliers.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Pagination from "@/components/admin/Pagination";
import SearchSelect from "@/components/admin/SearchSelect";

const chemicalSchema = z.object({
  ten_thuong_mai: z.string().min(2, "Tên thương mại tối thiểu 2 ký tự"),
  hoat_chat: z.string().min(1, "Hoạt chất là bắt buộc"),
  doi_tuong: z.string().nullable(),
  dang_su_dung: z.string().nullable(),
  don_vi_tinh: z.string().min(1, "Đơn vị tính là bắt buộc"),
  nha_cung_cap: z.string().nullable(),
  supplier_id: z.string().nullable(),
  so_luong_ton: z.coerce.number().min(0).default(0),
  nguong_canh_bao: z.coerce.number().min(0).default(5),
  ghi_chu: z.string().nullable(),
});

type ChemicalFormData = z.infer<typeof chemicalSchema>;

export default function HoaChatPage() {
  const { user } = useCurrentUser();
  const [data, setData] = useState<Chemical[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Chemical | null>(null);
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Chemical | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChemicalFormData>({
    resolver: zodResolver(chemicalSchema),
    defaultValues: {
      ten_thuong_mai: "",
      hoat_chat: "",
      doi_tuong: "",
      dang_su_dung: "",
      don_vi_tinh: "",
      nha_cung_cap: "",
      supplier_id: "",
      ghi_chu: "",
    },
  });

  const loadData = async () => {
    try {
      const [result, supplierList] = await Promise.all([
        fetchChemicals(),
        fetchSuppliers(),
      ]);
      setData(result);
      setSuppliers(supplierList);
    } catch {
      toast.error("Không thể tải danh sách hóa chất");
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
      item.ten_thuong_mai.toLowerCase().includes(q) ||
      item.ma_hc.toLowerCase().includes(q) ||
      (item.hoat_chat?.toLowerCase().includes(q) ?? false) ||
      (item.doi_tuong?.toLowerCase().includes(q) ?? false)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    reset({
      ten_thuong_mai: "",
      hoat_chat: "",
      doi_tuong: "",
      dang_su_dung: "",
      don_vi_tinh: "",
      nha_cung_cap: "",
      supplier_id: "",
      so_luong_ton: 0,
      nguong_canh_bao: 5,
      ghi_chu: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Chemical) => {
    setEditing(item);
    reset({
      ten_thuong_mai: item.ten_thuong_mai,
      hoat_chat: item.hoat_chat ?? "",
      doi_tuong: item.doi_tuong ?? "",
      dang_su_dung: item.dang_su_dung ?? "",
      don_vi_tinh: item.don_vi_tinh ?? "",
      nha_cung_cap: item.nha_cung_cap ?? "",
      supplier_id: item.supplier_id ?? "",
      so_luong_ton: item.so_luong_ton ?? 0,
      nguong_canh_bao: item.nguong_canh_bao ?? 5,
      ghi_chu: item.ghi_chu ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: ChemicalFormData) => {
    try {
      const input: CreateChemicalInput = {
        ten_thuong_mai: formData.ten_thuong_mai,
        hoat_chat: formData.hoat_chat || null,
        doi_tuong: formData.doi_tuong || null,
        dang_su_dung: formData.dang_su_dung || null,
        don_vi_tinh: formData.don_vi_tinh || null,
        supplier_id: formData.supplier_id || null,
        nha_cung_cap: suppliers.find((s) => s.id === formData.supplier_id)?.ten_ncc || formData.nha_cung_cap || null,
        so_luong_ton: formData.so_luong_ton ?? 0,
        nguong_canh_bao: formData.nguong_canh_bao ?? 5,
        ghi_chu: formData.ghi_chu || null,
      };
      if (editing) {
        await updateChemical(editing.id, input);
        toast.success("Cập nhật hóa chất thành công");
      } else {
        await createChemical(input);
        toast.success("Thêm hóa chất thành công");
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
      await deleteChemical(deletingItem.id);
      toast.success("Xóa hóa chất thành công");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadData();
    } catch {
      toast.error("Không thể xóa hóa chất");
    }
  };

  const canEdit = (item: Chemical) => {
    if (!user) return false;
    if (user.vai_tro === "Xem") return false;
    if (user.vai_tro === "Admin") return true;
    return item.created_by === user.id;
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Hóa chất</h1>
          <p className="admin-page-subtitle">Quản lý danh sách hóa chất</p>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo tên, mã HC, hoạt chất, đối tượng..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="data-table-actions">
            {user?.vai_tro !== "Xem" && (
              <Button className="btn-add" onClick={openAdd}>
                <Plus size={16} /> Thêm hóa chất
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
                <TableHead>Mã HC</TableHead>
                <TableHead>Tên thương mại</TableHead>
                <TableHead>Hoạt chất</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Dạng sử dụng</TableHead>
                <TableHead>Tồn kho</TableHead>
                {user?.vai_tro !== "Xem" && <TableHead style={{ width: 50 }}></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id} onClick={() => openEdit(item)}>
                  <TableCell>{item.ma_hc}</TableCell>
                  <TableCell>{item.ten_thuong_mai}</TableCell>
                  <TableCell>{item.hoat_chat ?? "—"}</TableCell>
                  <TableCell>{item.doi_tuong ?? "—"}</TableCell>
                  <TableCell>{item.dang_su_dung ?? "—"}</TableCell>
                  <TableCell>
                    <span style={{ color: (item.so_luong_ton ?? 0) <= (item.nguong_canh_bao ?? 5) ? "var(--danger-500)" : "var(--primary-700)", fontWeight: 600 }}>
                      {item.so_luong_ton ?? 0}
                    </span>
                    {" "}{item.don_vi_tinh ?? ""}
                  </TableCell>
                  {canEdit(item) && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-action danger"
                        title="Xóa"
                        onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </TableCell>
                  )}
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
              {editing ? "Cập nhật hóa chất" : "Thêm hóa chất"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Tên thương mại *</Label>
                <Input placeholder="VD: Fendona 10SC" {...register("ten_thuong_mai")} />
                {errors.ten_thuong_mai && (
                  <span className="error">
                    {errors.ten_thuong_mai.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <Label>Hoạt chất *</Label>
                <Input placeholder="VD: Alpha-cypermethrin" {...register("hoat_chat")} />
                {errors.hoat_chat && (
                  <span className="error">{errors.hoat_chat.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Đối tượng</Label>
                <Input placeholder="VD: Gián, Muỗi, Kiến" {...register("doi_tuong")} />
              </div>
              <div className="form-field">
                <Label>Dạng sử dụng</Label>
                <Input placeholder="VD: Phun, Gel, Bả" {...register("dang_su_dung")} />
              </div>
              <div className="form-field">
                <Label>Đơn vị tính *</Label>
                <Input placeholder="VD: Lít, Kg, Chai" {...register("don_vi_tinh")} />
                {errors.don_vi_tinh && (
                  <span className="error">{errors.don_vi_tinh.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Nhà cung cấp</Label>
                <SearchSelect
                  placeholder="Tìm nhà cung cấp..."
                  value={watch("supplier_id") ?? ""}
                  onChange={(v) => setValue("supplier_id", v || null)}
                  options={suppliers.map((s) => ({ value: s.id, label: s.ten_ncc }))}
                />
              </div>
              <div className="form-field">
                <Label>Số lượng tồn</Label>
                <Input type="number" min={0} placeholder="0" {...register("so_luong_ton")} />
              </div>
              <div className="form-field">
                <Label>Ngưỡng cảnh báo</Label>
                <Input type="number" min={0} placeholder="5" {...register("nguong_canh_bao")} />
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
              {editing && canEdit(editing) && (
                <Button type="button" variant="destructive" onClick={() => { setDialogOpen(false); setDeletingItem(editing); setDeleteDialogOpen(true); }}>
                  <Trash2 size={14} /> Xóa
                </Button>
              )}
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
              Bạn có chắc chắn muốn xóa hóa chất{" "}
              <strong>{deletingItem?.ten_thuong_mai}</strong>?
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
