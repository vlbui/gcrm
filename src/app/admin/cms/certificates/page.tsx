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
  fetchCmsTable,
  createCmsRecord,
  updateCmsRecord,
  deleteCmsRecord,
  type CmsCertificate,
} from "@/lib/api/cms.api";

const certificateSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  image_url: z.string().nullable(),
  sort_order: z.coerce.number().int().min(0),
  is_active: z.boolean(),
});

type CertificateFormData = z.infer<typeof certificateSchema>;

export default function CertificatesPage() {
  const [data, setData] = useState<CmsCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CmsCertificate | null>(null);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "",
      image_url: "",
      sort_order: 0,
      is_active: true,
    },
  });

  const loadData = async () => {
    try {
      const result = await fetchCmsTable<CmsCertificate>("cms_certificates", {
        orderBy: "sort_order",
      });
      setData(result);
    } catch {
      toast.error("Không thể tải danh sách chứng nhận");
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
      item.description.toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditing(null);
    reset({
      title: "",
      description: "",
      icon: "",
      image_url: "",
      sort_order: 0,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: CmsCertificate) => {
    setEditing(item);
    reset({
      title: item.title,
      description: item.description ?? "",
      icon: item.icon ?? "",
      image_url: item.image_url ?? "",
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: CertificateFormData) => {
    try {
      const record = {
        title: formData.title,
        description: formData.description || "",
        icon: formData.icon || "",
        image_url: formData.image_url || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (editing) {
        await updateCmsRecord("cms_certificates", editing.id, record);
        toast.success("Cập nhật chứng nhận thành công");
      } else {
        await createCmsRecord("cms_certificates", record);
        toast.success("Thêm chứng nhận thành công");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleDelete = async (item: CmsCertificate) => {
    if (!window.confirm(`Xác nhận xóa chứng nhận "${item.title}"?`)) return;
    try {
      await deleteCmsRecord("cms_certificates", item.id);
      toast.success("Xóa chứng nhận thành công");
      loadData();
    } catch {
      toast.error("Không thể xóa chứng nhận");
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý Chứng nhận</h1>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo tiêu đề, mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="data-table-actions">
            <Button className="btn-add" onClick={openAdd}>
              <Plus size={16} /> Thêm chứng nhận
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
                <TableHead>Active</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell style={{ fontSize: "1.5rem" }}>
                    {item.icon || "—"}
                  </TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    {item.description.length > 60
                      ? item.description.substring(0, 60) + "..."
                      : item.description}
                  </TableCell>
                  <TableCell>{item.sort_order}</TableCell>
                  <TableCell>
                    <span
                      className={`status-badge ${
                        item.is_active ? "hoan-thanh" : "inactive"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
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
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 size={14} />
                    </button>
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
              {editing ? "Cập nhật chứng nhận" : "Thêm chứng nhận"}
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
                <Input {...register("icon")} placeholder="VD: 🏆" />
              </div>
              <div className="form-field">
                <Label>URL hình ảnh</Label>
                <Input {...register("image_url")} />
              </div>
              <div className="form-field">
                <Label>Thứ tự</Label>
                <Input type="number" {...register("sort_order")} />
              </div>
              <div className="form-field">
                <Label>Trạng thái</Label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={watch("is_active")}
                    onChange={(e) => setValue("is_active", e.target.checked)}
                  />
                  Active
                </label>
              </div>
              <div className="form-field full-width">
                <Label>Mô tả</Label>
                <Textarea {...register("description")} rows={4} />
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
