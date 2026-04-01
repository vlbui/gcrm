"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Plus, Pencil, Trash2, Star } from "lucide-react";
import Pagination from "@/components/admin/Pagination";
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
  type CmsPricing,
} from "@/lib/api/cms.api";

const LOAI_GOI_OPTIONS = [
  { value: "Đơn lẻ", label: "Đơn lẻ" },
  { value: "Định kỳ", label: "Định kỳ" },
  { value: "Doanh nghiệp", label: "Doanh nghiệp" },
];

const pricingSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  subtitle: z.string().optional().default(""),
  loai_goi: z.string().min(1, "Loại gói là bắt buộc"),
  gia_tham_khao: z.string().optional().default(""),
  gia_tu: z.coerce.number().optional().nullable(),
  don_vi: z.string().optional().default(""),
  features: z.string().optional().default(""),
  is_popular: z.boolean().default(false),
  ghi_chu: z.string().optional().default(""),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

type PricingFormData = z.infer<typeof pricingSchema>;

export default function PricingCmsPage() {
  const [data, setData] = useState<CmsPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CmsPricing | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
  });

  const loadData = async () => {
    try {
      const result = await fetchCmsTable<CmsPricing>("cms_pricing", {
        orderBy: "sort_order",
      });
      setData(result);
    } catch {
      toast.error("Không thể tải danh sách bảng giá");
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
      item.subtitle?.toLowerCase().includes(q)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    reset({
      title: "",
      subtitle: "",
      loai_goi: "Đơn lẻ",
      gia_tham_khao: "",
      gia_tu: null,
      don_vi: "",
      features: "",
      is_popular: false,
      ghi_chu: "",
      sort_order: 0,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: CmsPricing) => {
    setEditing(item);
    reset({
      title: item.title,
      subtitle: item.subtitle ?? "",
      loai_goi: item.loai_goi ?? "Đơn lẻ",
      gia_tham_khao: item.gia_tham_khao ?? "",
      gia_tu: item.gia_tu ?? null,
      don_vi: item.don_vi ?? "",
      features: Array.isArray(item.features) ? item.features.join("\n") : "",
      is_popular: item.is_popular ?? false,
      ghi_chu: item.ghi_chu ?? "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: PricingFormData) => {
    try {
      const features = formData.features
        ? formData.features
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean)
        : [];

      const record = {
        title: formData.title,
        subtitle: formData.subtitle || "",
        loai_goi: formData.loai_goi,
        gia_tham_khao: formData.gia_tham_khao || null,
        gia_tu: formData.gia_tu || null,
        don_vi: formData.don_vi || null,
        features,
        is_popular: formData.is_popular,
        ghi_chu: formData.ghi_chu || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (editing) {
        await updateCmsRecord("cms_pricing", editing.id, record);
        toast.success("Cập nhật bảng giá thành công");
      } else {
        await createCmsRecord("cms_pricing", record);
        toast.success("Thêm bảng giá thành công");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleDelete = async (item: CmsPricing) => {
    if (!window.confirm(`Xác nhận xóa bảng giá "${item.title}"?`)) return;
    try {
      await deleteCmsRecord("cms_pricing", item.id);
      toast.success("Xóa bảng giá thành công");
      loadData();
    } catch {
      toast.error("Không thể xóa bảng giá");
    }
  };

  const loaiGoiLabel = (val: string) =>
    LOAI_GOI_OPTIONS.find((o) => o.value === val)?.label ?? val;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý Bảng giá</h1>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo tiêu đề..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="data-table-actions">
            <Button className="btn-add" onClick={openAdd}>
              <Plus size={16} /> Thêm bảng giá
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
                <TableHead>Loại gói</TableHead>
                <TableHead>Giá tham khảo</TableHead>
                <TableHead>Phổ biến</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{loaiGoiLabel(item.loai_goi)}</TableCell>
                  <TableCell>{item.gia_tham_khao || "—"}</TableCell>
                  <TableCell>
                    {item.is_popular ? (
                      <span className="badge badge-warning flex items-center gap-1">
                        <Star size={12} /> Phổ biến
                      </span>
                    ) : (
                      "—"
                    )}
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
              {editing ? "Cập nhật bảng giá" : "Thêm bảng giá"}
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
                <Label>Subtitle</Label>
                <Input {...register("subtitle")} />
              </div>
              <div className="form-field">
                <Label>Loại gói *</Label>
                <Select
                  value={watch("loai_goi")}
                  onValueChange={(val) => setValue("loai_goi", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại gói" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAI_GOI_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.loai_goi && (
                  <span className="error">{errors.loai_goi.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Giá tham khảo</Label>
                <Input
                  placeholder="VD: 500.000đ - 1.000.000đ"
                  {...register("gia_tham_khao")}
                />
              </div>
              <div className="form-field">
                <Label>Giá từ (số)</Label>
                <Input type="number" {...register("gia_tu")} />
              </div>
              <div className="form-field">
                <Label>Đơn vị</Label>
                <Input
                  placeholder="VD: /lần, /tháng, /năm"
                  {...register("don_vi")}
                />
              </div>
              <div className="form-field full-width">
                <Label>Tính năng (mỗi dòng = 1 tính năng)</Label>
                <Textarea
                  rows={4}
                  placeholder={"Tính năng 1\nTính năng 2\nTính năng 3"}
                  {...register("features")}
                />
              </div>
              <div className="form-field full-width">
                <Label>Ghi chú</Label>
                <Textarea rows={2} {...register("ghi_chu")} />
              </div>
              <div className="form-field">
                <Label>Thứ tự</Label>
                <Input type="number" {...register("sort_order")} />
              </div>
              <div className="form-field">
                <Label className="flex items-center gap-2">
                  <input type="checkbox" {...register("is_popular")} />
                  Gói phổ biến
                </Label>
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
