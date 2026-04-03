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
  type CmsFaq,
} from "@/lib/api/cms.api";

const faqSchema = z.object({
  question: z.string().min(1, "Câu hỏi là bắt buộc"),
  answer: z.string().min(1, "Câu trả lời là bắt buộc"),
  category: z.string().optional().default(""),
  sort_order: z.coerce.number().int().default(0),
  is_active: z.boolean().default(true),
});

type FaqFormData = z.infer<typeof faqSchema>;

export default function FaqCmsPage() {
  const [data, setData] = useState<CmsFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CmsFaq | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<CmsFaq | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema),
  });

  const loadData = async () => {
    try {
      const result = await fetchCmsTable<CmsFaq>("cms_faq", {
        orderBy: "sort_order",
      });
      setData(result);
    } catch {
      toast.error("Không thể tải danh sách FAQ");
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
      item.question.toLowerCase().includes(q) ||
      item.answer?.toLowerCase().includes(q) ||
      (item.category?.toLowerCase().includes(q) ?? false)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    reset({
      question: "",
      answer: "",
      category: "",
      sort_order: 0,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (item: CmsFaq) => {
    setEditing(item);
    reset({
      question: item.question,
      answer: item.answer ?? "",
      category: item.category ?? "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: FaqFormData) => {
    try {
      const record = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      if (editing) {
        await updateCmsRecord("cms_faq", editing.id, record);
        toast.success("Cập nhật FAQ thành công");
      } else {
        await createCmsRecord("cms_faq", record);
        toast.success("Thêm FAQ thành công");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleToggleActive = async (item: CmsFaq, newValue: boolean) => {
    try {
      setData((prev) => prev.map((d) => d.id === item.id ? { ...d, is_active: newValue } : d));
      await updateCmsRecord("cms_faq", item.id, { is_active: newValue });
      toast.success(newValue ? "Đã bật hiển thị" : "Đã tắt hiển thị");
    } catch {
      setData((prev) => prev.map((d) => d.id === item.id ? { ...d, is_active: !newValue } : d));
      toast.error("Không thể cập nhật trạng thái");
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteCmsRecord("cms_faq", deletingItem.id);
      toast.success("Xóa FAQ thành công");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadData();
    } catch {
      toast.error("Không thể xóa FAQ");
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quản lý FAQ</h1>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo câu hỏi, danh mục..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="data-table-actions">
            <Button className="btn-add" onClick={openAdd}>
              <Plus size={16} /> Thêm FAQ
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
                <TableHead>Câu hỏi</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Thứ tự</TableHead>
                <TableHead>Hiển thị</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.question.length > 80
                      ? item.question.slice(0, 80) + "..."
                      : item.question}
                  </TableCell>
                  <TableCell>{item.category || "—"}</TableCell>
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
              {editing ? "Cập nhật FAQ" : "Thêm FAQ"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field full-width">
                <Label>Câu hỏi *</Label>
                <Input {...register("question")} />
                {errors.question && (
                  <span className="error">{errors.question.message}</span>
                )}
              </div>
              <div className="form-field full-width">
                <Label>Câu trả lời *</Label>
                <Textarea rows={5} {...register("answer")} />
                {errors.answer && (
                  <span className="error">{errors.answer.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Danh mục</Label>
                <Input
                  placeholder="VD: Dịch vụ, Giá cả, Chung..."
                  {...register("category")}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa FAQ <strong>{deletingItem?.question}</strong>? Hành động này không thể hoàn tác.
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
