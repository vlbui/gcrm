"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  type CmsBlog,
} from "@/lib/api/cms.api";

function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function generateSlug(title: string): string {
  return removeVietnameseDiacritics(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const blogSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  excerpt: z.string().nullable(),
  content: z.string().min(1, "Nội dung là bắt buộc"),
  cover_image: z.string().nullable(),
  category: z.string().nullable(),
  tags: z.string().nullable(),
  author: z.string().nullable(),
  trang_thai: z.string(),
});

type BlogFormData = z.infer<typeof blogSchema>;

export default function BlogPage() {
  const [data, setData] = useState<CmsBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CmsBlog | null>(null);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image: "",
      category: "",
      tags: "",
      author: "",
      trang_thai: "Nháp",
    },
  });

  const titleValue = watch("title");

  const loadData = async () => {
    try {
      const result = await fetchCmsTable<CmsBlog>("cms_blog", {
        orderBy: "created_at",
        ascending: false,
      });
      setData(result);
    } catch {
      toast.error("Không thể tải danh sách bài viết");
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
      item.slug.toLowerCase().includes(q) ||
      (item.category?.toLowerCase().includes(q) ?? false)
    );
  });

  const openAdd = () => {
    setEditing(null);
    reset({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      cover_image: "",
      category: "",
      tags: "",
      author: "",
      trang_thai: "Nháp",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: CmsBlog) => {
    setEditing(item);
    reset({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt ?? "",
      content: item.content,
      cover_image: item.cover_image ?? "",
      category: item.category ?? "",
      tags: item.tags?.join(", ") ?? "",
      author: item.author ?? "",
      trang_thai: item.trang_thai,
    });
    setDialogOpen(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue("title", newTitle);
    if (!editing) {
      setValue("slug", generateSlug(newTitle));
    }
  };

  const onSubmit = async (formData: BlogFormData) => {
    try {
      const tagsArray = formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const record = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        content: formData.content,
        cover_image: formData.cover_image || null,
        category: formData.category || null,
        tags: tagsArray,
        author: formData.author || null,
        trang_thai: formData.trang_thai,
        published_at:
          formData.trang_thai === "Đã xuất bản" ? new Date().toISOString() : null,
      };

      if (editing) {
        await updateCmsRecord("cms_blog", editing.id, record);
        toast.success("Cập nhật bài viết thành công");
      } else {
        await createCmsRecord("cms_blog", record);
        toast.success("Thêm bài viết thành công");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleDelete = async (item: CmsBlog) => {
    if (!window.confirm(`Xác nhận xóa bài viết "${item.title}"?`)) return;
    try {
      await deleteCmsRecord("cms_blog", item.id);
      toast.success("Xóa bài viết thành công");
      loadData();
    } catch {
      toast.error("Không thể xóa bài viết");
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý Bài viết</h1>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo tiêu đề, slug, danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="data-table-actions">
            <Button className="btn-add" onClick={openAdd}>
              <Plus size={16} /> Thêm bài viết
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
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Lượt xem</TableHead>
                <TableHead>Ngày đăng</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.slug}</TableCell>
                  <TableCell>{item.category ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`status-badge ${
                        item.trang_thai === "Đã xuất bản"
                          ? "hoan-thanh"
                          : item.trang_thai === "Ẩn"
                          ? "huy"
                          : "inactive"
                      }`}
                    >
                      {item.trang_thai}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Eye size={14} /> {item.views}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.published_at
                      ? new Date(item.published_at).toLocaleDateString("vi-VN")
                      : "—"}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Cập nhật bài viết" : "Thêm bài viết"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Tiêu đề *</Label>
                <Input
                  {...register("title")}
                  onChange={handleTitleChange}
                  value={titleValue}
                />
                {errors.title && (
                  <span className="error">{errors.title.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Slug *</Label>
                <Input {...register("slug")} />
                {errors.slug && (
                  <span className="error">{errors.slug.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Danh mục</Label>
                <Input {...register("category")} />
              </div>
              <div className="form-field">
                <Label>Tác giả</Label>
                <Input {...register("author")} />
              </div>
              <div className="form-field">
                <Label>Ảnh bìa (URL)</Label>
                <Input {...register("cover_image")} />
              </div>
              <div className="form-field">
                <Label>Trạng thái</Label>
                <Select
                  value={watch("trang_thai")}
                  onValueChange={(val) => setValue("trang_thai", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nháp">Nháp</SelectItem>
                    <SelectItem value="Đã xuất bản">Đã xuất bản</SelectItem>
                    <SelectItem value="Ẩn">Ẩn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="form-field full-width">
                <Label>Tóm tắt</Label>
                <Textarea {...register("excerpt")} rows={3} />
              </div>
              <div className="form-field full-width">
                <Label>Nội dung *</Label>
                <Textarea {...register("content")} rows={8} />
                {errors.content && (
                  <span className="error">{errors.content.message}</span>
                )}
              </div>
              <div className="form-field full-width">
                <Label>Tags (phân cách bằng dấu phẩy)</Label>
                <Textarea {...register("tags")} rows={2} />
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
