"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import Pagination from "@/components/admin/Pagination";
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
  fetchCmsTable,
  createCmsRecord,
  updateCmsRecord,
  deleteCmsRecord,
  type CmsTestimonial,
} from "@/lib/api/cms.api";

const testimonialSchema = z.object({
  ten_kh: z.string().min(1, "Tên khách hàng là bắt buộc"),
  chuc_vu: z.string().optional().default(""),
  cong_ty: z.string().optional().default(""),
  noi_dung: z.string().min(1, "Nội dung đánh giá là bắt buộc"),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  avatar_url: z.string().optional().default(""),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

export default function TestimonialsCmsPage() {
  const [data, setData] = useState<CmsTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CmsTestimonial | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CmsTestimonial | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
  });

  const loadData = async () => {
    try {
      const result = await fetchCmsTable<CmsTestimonial>("cms_testimonials", {
        orderBy: "sort_order",
      });
      setData(result);
    } catch {
      toast.error("Không thể tải danh sách đánh giá");
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
      (item.cong_ty?.toLowerCase().includes(q) ?? false) ||
      item.noi_dung?.toLowerCase().includes(q)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    reset({
      ten_kh: "",
      chuc_vu: "",
      cong_ty: "",
      noi_dung: "",
      rating: 5,
      avatar_url: "",
      sort_order: 0,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: CmsTestimonial) => {
    setEditing(item);
    reset({
      ten_kh: item.ten_kh,
      chuc_vu: item.chuc_vu ?? "",
      cong_ty: item.cong_ty ?? "",
      noi_dung: item.noi_dung ?? "",
      rating: item.rating ?? 5,
      avatar_url: item.avatar_url ?? "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: TestimonialFormData) => {
    try {
      const record = {
        ten_kh: formData.ten_kh,
        chuc_vu: formData.chuc_vu || null,
        cong_ty: formData.cong_ty || null,
        noi_dung: formData.noi_dung,
        rating: formData.rating,
        avatar_url: formData.avatar_url || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (editing) {
        await updateCmsRecord("cms_testimonials", editing.id, record);
        toast.success("Cập nhật đánh giá thành công");
      } else {
        await createCmsRecord("cms_testimonials", record);
        toast.success("Thêm đánh giá thành công");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleToggleActive = async (item: CmsTestimonial, newValue: boolean) => {
    try {
      setData((prev) => prev.map((d) => d.id === item.id ? { ...d, is_active: newValue } : d));
      await updateCmsRecord("cms_testimonials", item.id, { is_active: newValue });
      toast.success(newValue ? "Đã bật hiển thị" : "Đã tắt hiển thị");
    } catch {
      setData((prev) => prev.map((d) => d.id === item.id ? { ...d, is_active: !newValue } : d));
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteCmsRecord("cms_testimonials", deletingItem.id);
      toast.success("Xóa đánh giá thành công");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadData();
    } catch {
      toast.error("Không thể xóa đánh giá");
    }
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý Đánh giá</h1>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo tên, công ty..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="data-table-actions">
            <Button className="btn-add" onClick={openAdd}>
              <Plus size={16} /> Thêm đánh giá
            </Button>
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
                <TableHead>Tên KH</TableHead>
                <TableHead>Công ty</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Hiển thị</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.ten_kh}</TableCell>
                  <TableCell>{item.cong_ty || "—"}</TableCell>
                  <TableCell className="text-yellow-500">
                    {renderStars(item.rating)}
                  </TableCell>
                  <TableCell>
                    <button
                      className={`toggle-switch ${item.is_active ? "active" : ""}`}
                      onClick={() => handleToggleActive(item, !item.is_active)}
                      title={item.is_active ? "Đang hiển thị" : "Đang ẩn"}
                    />
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Cập nhật đánh giá" : "Thêm đánh giá"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Tên khách hàng *</Label>
                <Input {...register("ten_kh")} />
                {errors.ten_kh && (
                  <span className="error">{errors.ten_kh.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Chức vụ</Label>
                <Input {...register("chuc_vu")} />
              </div>
              <div className="form-field">
                <Label>Công ty</Label>
                <Input {...register("cong_ty")} />
              </div>
              <div className="form-field">
                <Label>Rating (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  {...register("rating")}
                />
                {errors.rating && (
                  <span className="error">{errors.rating.message}</span>
                )}
              </div>
              <div className="form-field full-width">
                <Label>Nội dung đánh giá *</Label>
                <Textarea rows={4} {...register("noi_dung")} />
                {errors.noi_dung && (
                  <span className="error">{errors.noi_dung.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Avatar URL</Label>
                <Input {...register("avatar_url")} />
              </div>
              <div className="form-field">
                <Label>Thứ tự</Label>
                <Input type="number" {...register("sort_order")} />
              </div>
              <div className="form-field">
                <Label className="flex items-center gap-2">
                  <input type="checkbox" {...register("is_active")} />
                  Kích hoạt
                </Label>
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
              Bạn có chắc chắn muốn xóa đánh giá của <strong>{deletingItem?.ten_kh}</strong>? Hành động này không thể hoàn tác.
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
