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
  type CmsHero,
} from "@/lib/api/cms.api";

const heroSchema = z.object({
  headline: z.string().min(1, "Headline là bắt buộc"),
  sub_headline: z.string().optional().default(""),
  description: z.string().optional().default(""),
  cta_text: z.string().optional().default(""),
  cta_link: z.string().optional().default(""),
  cta2_text: z.string().optional().default(""),
  cta2_link: z.string().optional().default(""),
  badges: z.string().optional().default(""),
  stats: z.string().optional().default(""),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

type HeroFormData = z.infer<typeof heroSchema>;

export default function HeroCmsPage() {
  const [data, setData] = useState<CmsHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CmsHero | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
  });

  const loadData = async () => {
    try {
      const result = await fetchCmsTable<CmsHero>("cms_hero", {
        orderBy: "sort_order",
      });
      setData(result);
    } catch {
      toast.error("Không thể tải danh sách Hero Banner");
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
      item.headline.toLowerCase().includes(q) ||
      item.sub_headline?.toLowerCase().includes(q)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    reset({
      headline: "",
      sub_headline: "",
      description: "",
      cta_text: "",
      cta_link: "",
      cta2_text: "",
      cta2_link: "",
      badges: "",
      stats: "",
      sort_order: 0,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: CmsHero) => {
    setEditing(item);
    reset({
      headline: item.headline,
      sub_headline: item.sub_headline ?? "",
      description: item.description ?? "",
      cta_text: item.cta_text ?? "",
      cta_link: item.cta_link ?? "",
      cta2_text: item.cta2_text ?? "",
      cta2_link: item.cta2_link ?? "",
      badges: item.badges ? JSON.stringify(item.badges, null, 2) : "",
      stats: item.stats ? JSON.stringify(item.stats, null, 2) : "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: HeroFormData) => {
    try {
      let badges: { text: string; icon?: string }[] = [];
      let stats: { value: string; label: string }[] = [];

      if (formData.badges?.trim()) {
        try {
          badges = JSON.parse(formData.badges);
        } catch {
          toast.error("Badges JSON không hợp lệ");
          return;
        }
      }
      if (formData.stats?.trim()) {
        try {
          stats = JSON.parse(formData.stats);
        } catch {
          toast.error("Stats JSON không hợp lệ");
          return;
        }
      }

      const record = {
        headline: formData.headline,
        sub_headline: formData.sub_headline || "",
        description: formData.description || "",
        cta_text: formData.cta_text || "",
        cta_link: formData.cta_link || "",
        cta2_text: formData.cta2_text || "",
        cta2_link: formData.cta2_link || "",
        badges,
        stats,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (editing) {
        await updateCmsRecord("cms_hero", editing.id, record);
        toast.success("Cập nhật Hero Banner thành công");
      } else {
        await createCmsRecord("cms_hero", record);
        toast.success("Thêm Hero Banner thành công");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleDelete = async (item: CmsHero) => {
    if (!window.confirm(`Xác nhận xóa Hero Banner "${item.headline}"?`)) return;
    try {
      await deleteCmsRecord("cms_hero", item.id);
      toast.success("Xóa Hero Banner thành công");
      loadData();
    } catch {
      toast.error("Không thể xóa Hero Banner");
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý Hero Banner</h1>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo headline..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="data-table-actions">
            <Button className="btn-add" onClick={openAdd}>
              <Plus size={16} /> Thêm Hero Banner
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
                <TableHead>Headline</TableHead>
                <TableHead>Sub headline</TableHead>
                <TableHead>CTA Text</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.headline}</TableCell>
                  <TableCell>{item.sub_headline || "—"}</TableCell>
                  <TableCell>{item.cta_text || "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`badge ${
                        item.is_active ? "badge-success" : "badge-secondary"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>{item.sort_order}</TableCell>
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
        <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Cập nhật Hero Banner" : "Thêm Hero Banner"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Headline *</Label>
                <Input {...register("headline")} />
                {errors.headline && (
                  <span className="error">{errors.headline.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Sub headline</Label>
                <Input {...register("sub_headline")} />
              </div>
              <div className="form-field full-width">
                <Label>Description</Label>
                <Textarea rows={3} {...register("description")} />
              </div>
              <div className="form-field">
                <Label>CTA Text</Label>
                <Input {...register("cta_text")} />
              </div>
              <div className="form-field">
                <Label>CTA Link</Label>
                <Input {...register("cta_link")} />
              </div>
              <div className="form-field">
                <Label>CTA 2 Text</Label>
                <Input {...register("cta2_text")} />
              </div>
              <div className="form-field">
                <Label>CTA 2 Link</Label>
                <Input {...register("cta2_link")} />
              </div>
              <div className="form-field full-width">
                <Label>Badges (JSON)</Label>
                <Textarea
                  rows={3}
                  placeholder='[{"text": "Badge 1", "icon": "..."}]'
                  {...register("badges")}
                />
              </div>
              <div className="form-field full-width">
                <Label>Stats (JSON)</Label>
                <Textarea
                  rows={3}
                  placeholder='[{"value": "100+", "label": "Khách hàng"}]'
                  {...register("stats")}
                />
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
    </div>
  );
}
