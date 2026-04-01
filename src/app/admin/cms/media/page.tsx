"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, Pencil, Trash2, Image } from "lucide-react";
import Pagination from "@/components/admin/Pagination";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  fetchCmsTable,
  createCmsRecord,
  updateCmsRecord,
  deleteCmsRecord,
  type CmsMedia,
} from "@/lib/api/cms.api";
import { uploadFile, deleteFile } from "@/lib/api/storage.api";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const editSchema = z.object({
  alt_text: z.string().nullable(),
  category: z.string().nullable(),
});

type EditFormData = z.infer<typeof editSchema>;

export default function MediaPage() {
  const [data, setData] = useState<CmsMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CmsMedia | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      alt_text: "",
      category: "",
    },
  });

  const loadData = async () => {
    try {
      const result = await fetchCmsTable<CmsMedia>("cms_media", {
        orderBy: "created_at",
        ascending: false,
      });
      setData(result);
    } catch {
      toast.error("Không thể tải danh sách media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = Array.from(
    new Set(data.map((item) => item.category).filter(Boolean))
  ) as string[];

  const filtered =
    filterCategory === "all"
      ? data
      : data.filter((item) => item.category === filterCategory);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ hỗ trợ tải lên hình ảnh");
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `media/${timestamp}_${safeName}`;

      await uploadFile("cms", path, file);

      await createCmsRecord("cms_media", {
        file_name: file.name,
        file_path: path,
        file_type: file.type,
        file_size: file.size,
        alt_text: null,
        category: null,
      });

      toast.success("Tải lên thành công");
      loadData();
    } catch {
      toast.error("Không thể tải lên file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const openEdit = (item: CmsMedia) => {
    setEditing(item);
    reset({
      alt_text: item.alt_text ?? "",
      category: item.category ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: EditFormData) => {
    if (!editing) return;
    try {
      await updateCmsRecord("cms_media", editing.id, {
        alt_text: formData.alt_text || null,
        category: formData.category || null,
      });
      toast.success("Cập nhật thành công");
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleDelete = async (item: CmsMedia) => {
    if (!window.confirm(`Xác nhận xóa "${item.file_name}"?`)) return;
    try {
      await deleteFile("cms", item.file_path);
      await deleteCmsRecord("cms_media", item.id);
      toast.success("Xóa thành công");
      loadData();
    } catch {
      toast.error("Không thể xóa file");
    }
  };

  const getPublicUrl = (path: string) => {
    // Construct the Supabase storage public URL
    // This uses the same pattern as getPublicUrl in storage.api
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cms/${path}`;
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý Media</h1>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {categories.length > 0 && (
              <Select
                value={filterCategory}
                onValueChange={(val) => { setFilterCategory(val); setPage(1); }}
              >
                <SelectTrigger style={{ width: 180 }}>
                  <SelectValue placeholder="Lọc danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="data-table-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              style={{ display: "none" }}
            />
            <Button
              className="btn-add"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={16} />
              {uploading ? "Đang tải..." : "Tải lên"}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Đang tải...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>Không có media nào</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem",
              padding: "1rem",
            }}
          >
            {paged.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--border, #e2e8f0)",
                  borderRadius: "0.5rem",
                  overflow: "hidden",
                  backgroundColor: "var(--card, #fff)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 150,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "var(--muted, #f1f5f9)",
                    overflow: "hidden",
                  }}
                >
                  {item.file_type.startsWith("image/") ? (
                    <img
                      src={getPublicUrl(item.file_path)}
                      alt={item.alt_text ?? item.file_name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Image size={48} style={{ opacity: 0.3 }} />
                  )}
                </div>
                <div style={{ padding: "0.75rem" }}>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: "0.25rem",
                    }}
                    title={item.file_name}
                  >
                    {item.file_name}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--muted-foreground, #64748b)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {formatFileSize(item.file_size)}
                  </p>
                  {item.alt_text && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--muted-foreground, #64748b)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.alt_text}
                    </p>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.25rem",
                      marginTop: "0.5rem",
                    }}
                  >
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Media</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field full-width">
                <Label>Alt text</Label>
                <Input
                  {...register("alt_text")}
                  placeholder="Mô tả hình ảnh"
                />
              </div>
              <div className="form-field full-width">
                <Label>Danh mục</Label>
                <Input
                  {...register("category")}
                  placeholder="VD: banner, blog, service..."
                />
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
              <Button type="submit">Cập nhật</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
