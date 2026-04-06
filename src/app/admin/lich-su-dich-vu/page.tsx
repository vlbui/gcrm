"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchServiceHistories,
  createServiceHistory,
  updateServiceHistory,
  deleteServiceHistory,
  type ServiceHistory,
} from "@/lib/api/serviceHistory.api";
import { fetchContracts, type Contract } from "@/lib/api/contracts.api";
import { fetchCustomers, type Customer } from "@/lib/api/customers.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Pagination from "@/components/admin/Pagination";
import DateInput from "@/components/admin/DateInput";
import { formatDate } from "@/lib/utils/date";

const formSchema = z.object({
  contract_id: z.string().min(1, "Vui lòng chọn hợp đồng"),
  customer_id: z.string().min(1, "Vui lòng chọn khách hàng"),
  ngay_thuc_hien: z.string().min(1, "Vui lòng nhập ngày thực hiện"),
  ktv_thuc_hien: z.string().min(2, "Tên KTV tối thiểu 2 ký tự"),
  hoa_chat_su_dung: z.string().nullable(),
  vat_tu_su_dung: z.string().nullable(),
  ket_qua: z.string().nullable(),
  ghi_chu: z.string().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function LichSuDichVuPage() {
  const { user } = useCurrentUser();
  const [data, setData] = useState<ServiceHistory[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceHistory | null>(null);
  const [deletingItem, setDeletingItem] = useState<ServiceHistory | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contract_id: "",
      customer_id: "",
      ngay_thuc_hien: "",
      ktv_thuc_hien: "",
      hoa_chat_su_dung: "",
      vat_tu_su_dung: "",
      ket_qua: "",
      ghi_chu: "",
    },
  });

  const loadData = async () => {
    try {
      const [histories, contractList, customerList] = await Promise.all([
        fetchServiceHistories(),
        fetchContracts(),
        fetchCustomers(),
      ]);
      setData(histories);
      setContracts(contractList);
      setCustomers(customerList);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleContractChange = (contractId: string) => {
    form.setValue("contract_id", contractId);
    const contract = contracts.find((c) => c.id === contractId);
    if (contract) {
      form.setValue("customer_id", contract.customer_id);
    }
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset({
      contract_id: "",
      customer_id: "",
      ngay_thuc_hien: "",
      ktv_thuc_hien: "",
      hoa_chat_su_dung: "",
      vat_tu_su_dung: "",
      ket_qua: "",
      ghi_chu: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: ServiceHistory) => {
    setEditingItem(item);
    form.reset({
      contract_id: item.contract_id,
      customer_id: item.customer_id,
      ngay_thuc_hien: item.ngay_thuc_hien,
      ktv_thuc_hien: item.ktv_thuc_hien ?? "",
      hoa_chat_su_dung: item.hoa_chat_su_dung
        ? JSON.stringify(item.hoa_chat_su_dung, null, 2)
        : "",
      vat_tu_su_dung: item.vat_tu_su_dung
        ? JSON.stringify(item.vat_tu_su_dung, null, 2)
        : "",
      ket_qua: item.ket_qua ?? "",
      ghi_chu: item.ghi_chu ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      let hoaChatParsed = null;
      let vatTuParsed = null;

      if (values.hoa_chat_su_dung && values.hoa_chat_su_dung.trim()) {
        try {
          hoaChatParsed = JSON.parse(values.hoa_chat_su_dung);
        } catch {
          toast.error("Hóa chất sử dụng không đúng định dạng JSON");
          setSubmitting(false);
          return;
        }
      }

      if (values.vat_tu_su_dung && values.vat_tu_su_dung.trim()) {
        try {
          vatTuParsed = JSON.parse(values.vat_tu_su_dung);
        } catch {
          toast.error("Vật tư sử dụng không đúng định dạng JSON");
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        contract_id: values.contract_id,
        customer_id: values.customer_id,
        ngay_thuc_hien: values.ngay_thuc_hien,
        ktv_thuc_hien: values.ktv_thuc_hien || null,
        hoa_chat_su_dung: hoaChatParsed,
        vat_tu_su_dung: vatTuParsed,
        ket_qua: values.ket_qua || null,
        ghi_chu: values.ghi_chu || null,
        anh_truoc: null,
        anh_sau: null,
      };

      if (editingItem) {
        await updateServiceHistory(editingItem.id, payload);
        toast.success("Cập nhật lịch sử dịch vụ thành công");
      } else {
        await createServiceHistory(payload);
        toast.success("Thêm lịch sử dịch vụ thành công");
      }

      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteServiceHistory(deletingItem.id);
      toast.success("Xóa lịch sử dịch vụ thành công");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadData();
    } catch {
      toast.error("Không thể xóa lịch sử dịch vụ");
    }
  };

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.ma_lsdv.toLowerCase().includes(q) ||
      (item.customers?.ten_kh ?? "").toLowerCase().includes(q) ||
      (item.contracts?.ma_hd ?? "").toLowerCase().includes(q) ||
      (item.ktv_thuc_hien ?? "").toLowerCase().includes(q) ||
      (item.ket_qua ?? "").toLowerCase().includes(q)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const canEdit = user?.vai_tro === "Admin" || user?.vai_tro === "Nhân viên";

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lịch sử dịch vụ</h1>
          <p className="admin-page-subtitle">
            Quản lý lịch sử thực hiện dịch vụ
          </p>
        </div>
        {canEdit && (
          <Button className="btn-add" onClick={openCreateDialog}>
            <Plus size={16} />
            Thêm mới
          </Button>
        )}
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm lịch sử dịch vụ..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
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
                <TableHead>Mã LSDV</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Hợp đồng</TableHead>
                <TableHead>Ngày thực hiện</TableHead>
                <TableHead>KTV thực hiện</TableHead>
                <TableHead>Kết quả</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.ma_lsdv}</TableCell>
                  <TableCell>{item.customers?.ten_kh ?? "—"}</TableCell>
                  <TableCell>{item.contracts?.ma_hd ?? "—"}</TableCell>
                  <TableCell>
                    {formatDate(item.ngay_thuc_hien)}
                  </TableCell>
                  <TableCell>{item.ktv_thuc_hien ?? "—"}</TableCell>
                  <TableCell>
                    {item.ket_qua
                      ? item.ket_qua.length > 50
                        ? item.ket_qua.slice(0, 50) + "..."
                        : item.ket_qua
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <div className="data-table-actions">
                        <button
                          className="btn-action"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn-action danger"
                          onClick={() => {
                            setDeletingItem(item);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Cập nhật lịch sử dịch vụ" : "Thêm lịch sử dịch vụ"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Chỉnh sửa thông tin lịch sử dịch vụ"
                : "Nhập thông tin lịch sử dịch vụ mới"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Hợp đồng *</Label>
                <Select
                  value={form.watch("contract_id")}
                  onValueChange={handleContractChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn hợp đồng" />
                  </SelectTrigger>
                  <SelectContent>
                    {contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.ma_hd} - {c.customers?.ten_kh ?? ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.contract_id && (
                  <p className="error">
                    {form.formState.errors.contract_id.message}
                  </p>
                )}
              </div>

              <div className="form-field">
                <Label>Khách hàng *</Label>
                <Select
                  value={form.watch("customer_id")}
                  onValueChange={(v) => form.setValue("customer_id", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn khách hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.ma_kh} - {c.ten_kh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.customer_id && (
                  <p className="error">
                    {form.formState.errors.customer_id.message}
                  </p>
                )}
              </div>

              <div className="form-field">
                <Label>Ngày thực hiện *</Label>
                <DateInput
                  value={form.watch("ngay_thuc_hien")}
                  onChange={(v) => form.setValue("ngay_thuc_hien", v)}
                />
                {form.formState.errors.ngay_thuc_hien && (
                  <p className="error">
                    {form.formState.errors.ngay_thuc_hien.message}
                  </p>
                )}
              </div>

              <div className="form-field">
                <Label>KTV thực hiện *</Label>
                <Input {...form.register("ktv_thuc_hien")} />
                {form.formState.errors.ktv_thuc_hien && (
                  <span className="error">{form.formState.errors.ktv_thuc_hien.message}</span>
                )}
              </div>

              <div className="form-field">
                <Label>Hóa chất sử dụng (JSON)</Label>
                <Textarea
                  rows={3}
                  placeholder='[{"id":"1","ten":"Hóa chất A","lieu_luong":"100ml"}]'
                  {...form.register("hoa_chat_su_dung")}
                />
              </div>

              <div className="form-field">
                <Label>Vật tư sử dụng (JSON)</Label>
                <Textarea
                  rows={3}
                  placeholder='[{"id":"1","ten":"Bẫy dính","so_luong":5}]'
                  {...form.register("vat_tu_su_dung")}
                />
              </div>

              <div className="form-field">
                <Label>Kết quả</Label>
                <Textarea rows={3} {...form.register("ket_qua")} />
              </div>

              <div className="form-field full-width">
                <Label>Ghi chú</Label>
                <Textarea rows={3} {...form.register("ghi_chu")} />
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
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Đang xử lý..."
                  : editingItem
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
              Bạn có chắc chắn muốn xóa lịch sử dịch vụ{" "}
              <strong>{deletingItem?.ma_lsdv}</strong>? Hành động này không thể
              hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="form-actions">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
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
