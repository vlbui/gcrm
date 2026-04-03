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
  fetchCmsTable,
  createCmsRecord,
  updateCmsRecord,
  deleteCmsRecord,
  type CmsService,
} from "@/lib/api/cms.api";

const serviceSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  description: z.string().optional().default(""),
  icon: z.string().optional().default(""),
  image: z.string().optional().default(""),
  features: z.string().optional().default(""),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function ServicesCmsPage() {
  const [data, setData] = useState<CmsService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CmsService | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CmsService | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  const loadData = async () => {
    try {
      const result = await fetchCmsTable<CmsService>("cms_services", {
        orderBy: "sort_order",
      });
      setData(result);
    } catch {
      toast.error("Không thể tải danh sách dịch vụ");
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
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    reset({
      title: "",
      description: "",
      icon: "",
      image: "",
      features: "",
      sort_order: 0,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: CmsService) => {
    setEditing(item);
    reset({
      title: item.title,
      description: item.description ?? "",
      icon: item.icon ?? "",
      image: item.image ?? "",
      features: Array.isArray(item.features) ? item.features.join("\n") : "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: ServiceFormData) => {
    try {
      const features = formData.features
        ? formData.features
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean)
        : [];

      const record = {
        title: formData.title,
        description: formData.description || "",
        icon: formData.icon || "",
        image: formData.image || null,
        features,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (editing) {
        await updateCmsRecord("cms_services", editing.id, record);
        toast.success("Cập nhật dịch vụ thành công");
      } else {
        await createCmsRecord("cms_services", record);
        toast.success("Thêm dịch vụ thành công");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleToggleActive = async (item: CmsService, newValue: boolean) => {
    try {
      setData((prev) => prev.map((d) => d.id === item.id ? { ...d, is_active: newValue } : d));
      await updateCmsRecord("cms_services", item.id, { is_active: newValue });
      toast.success(newValue ? "Đã bật hiển thị" : "Đã tắt hiển thị");
    } catch {
      setData((prev) => prev.map((d) => d.id === item.id ? { ...d, is_active: !newValue } : d));
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteCmsRecord("cms_services", deletingItem.id);
      toast.success("Xóa dịch vụ thành công");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadData();
    } catch {
      toast.error("Không thể xóa dịch vụ");
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý Dịch vụ</h1>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo tiêu đề, mô tả..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="data-table-actions">
            <Button className="btn-add" onClick={openAdd}>
              <Plus size={16} /> Thêm dịch vụ
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
                <TableHead>Icon</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Hiển thị</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-2xl">{item.icon || "—"}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    {item.description
                      ? item.description.length > 60
                        ? item.description.slice(0, 60) + "..."
                        : item.description
                      : "—"}
                  </TableCell>
                  <TableCell>{item.sort_order}</TableCell>
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
              {editing ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Tiêu đề *</Label>
                <Input {...register("title")} />
                {errors.title && (
                  <span className="error">{errors.title.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Icon (emoji)</Label>
                <Input placeholder="VD: 🐛" {...register("icon")} />
              </div>
              <div className="form-field full-width">
                <Label>Mô tả</Label>
                <Textarea rows={3} {...register("description")} />
              </div>
              <div className="form-field">
                <Label>Hình ảnh (URL)</Label>
                <Input {...register("image")} />
              </div>
              <div className="form-field">
                <Label>Thứ tự</Label>
                <Input type="number" {...register("sort_order")} />
              </div>
              <div className="form-field full-width">
                <Label>Tính năng (mỗi dòng = 1 tính năng)</Label>
                <Textarea
                  rows={4}
                  placeholder={"Tính năng 1\nTính năng 2\nTính năng 3"}
                  {...register("features")}
                />
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
              <span dangerouslySetInnerHTML={{ __html: `Bạn có chắc chắn muốn xóa dịch vụ <strong>${deletingItem?.title}</strong>? Hành động này không thể hoàn tác.` }} />
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
