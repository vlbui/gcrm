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
  fetchChemicals,
  createChemical,
  updateChemical,
  deleteChemical,
  type Chemical,
  type CreateChemicalInput,
} from "@/lib/api/chemicals.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const chemicalSchema = z.object({
  ten_thuong_mai: z.string().min(1, "Tên thương mại là bắt buộc"),
  hoat_chat: z.string().nullable(),
  doi_tuong: z.string().nullable(),
  dang_su_dung: z.string().nullable(),
  don_vi_tinh: z.string().nullable(),
  nha_cung_cap: z.string().nullable(),
  ghi_chu: z.string().nullable(),
});

type ChemicalFormData = z.infer<typeof chemicalSchema>;

export default function HoaChatPage() {
  const { user } = useCurrentUser();
  const [data, setData] = useState<Chemical[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Chemical | null>(null);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
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
      ghi_chu: "",
    },
  });

  const loadData = async () => {
    try {
      const result = await fetchChemicals();
      setData(result);
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

  const openAdd = () => {
    setEditing(null);
    reset({
      ten_thuong_mai: "",
      hoat_chat: "",
      doi_tuong: "",
      dang_su_dung: "",
      don_vi_tinh: "",
      nha_cung_cap: "",
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
        nha_cung_cap: formData.nha_cung_cap || null,
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

  const handleDelete = async (item: Chemical) => {
    if (!window.confirm(`Xác nhận xóa hóa chất "${item.ten_thuong_mai}"?`))
      return;
    try {
      await deleteChemical(item.id);
      toast.success("Xóa hóa chất thành công");
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
              onChange={(e) => setSearch(e.target.value)}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã HC</TableHead>
                <TableHead>Tên thương mại</TableHead>
                <TableHead>Hoạt chất</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>Dạng sử dụng</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.ma_hc}</TableCell>
                  <TableCell>{item.ten_thuong_mai}</TableCell>
                  <TableCell>{item.hoat_chat ?? "—"}</TableCell>
                  <TableCell>{item.doi_tuong ?? "—"}</TableCell>
                  <TableCell>{item.dang_su_dung ?? "—"}</TableCell>
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
                <Input {...register("ten_thuong_mai")} />
                {errors.ten_thuong_mai && (
                  <span className="error">
                    {errors.ten_thuong_mai.message}
                  </span>
                )}
              </div>
              <div className="form-field">
                <Label>Hoạt chất</Label>
                <Input {...register("hoat_chat")} />
              </div>
              <div className="form-field">
                <Label>Đối tượng</Label>
                <Input {...register("doi_tuong")} />
              </div>
              <div className="form-field">
                <Label>Dạng sử dụng</Label>
                <Input {...register("dang_su_dung")} />
              </div>
              <div className="form-field">
                <Label>Đơn vị tính</Label>
                <Input {...register("don_vi_tinh")} />
              </div>
              <div className="form-field">
                <Label>Nhà cung cấp</Label>
                <Input {...register("nha_cung_cap")} />
              </div>
              <div className="form-field full-width">
                <Label>Ghi chú</Label>
                <Textarea {...register("ghi_chu")} />
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
