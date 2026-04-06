"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";
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
import { fetchChemicals, type Chemical } from "@/lib/api/chemicals.api";
import { fetchSupplies, type Supply } from "@/lib/api/supplies.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Pagination from "@/components/admin/Pagination";
import DateInput from "@/components/admin/DateInput";
import SearchSelect from "@/components/admin/SearchSelect";
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
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceHistory | null>(null);
  const [deletingItem, setDeletingItem] = useState<ServiceHistory | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic rows for chemicals & supplies
  const [hoaChatRows, setHoaChatRows] = useState<{ id: string; ten: string; lieu_luong: string }[]>([]);
  const [vatTuRows, setVatTuRows] = useState<{ id: string; ten: string; so_luong: string }[]>([]);

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
      const [histories, contractList, customerList, chemList, supplyList] = await Promise.all([
        fetchServiceHistories(),
        fetchContracts(),
        fetchCustomers(),
        fetchChemicals(),
        fetchSupplies(),
      ]);
      setData(histories);
      setContracts(contractList);
      setCustomers(customerList);
      setChemicals(chemList);
      setSupplies(supplyList);
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
    setHoaChatRows([]);
    setVatTuRows([]);
    setDialogOpen(true);
  };

  const openEditDialog = (item: ServiceHistory) => {
    setEditingItem(item);
    form.reset({
      contract_id: item.contract_id,
      customer_id: item.customer_id,
      ngay_thuc_hien: item.ngay_thuc_hien,
      ktv_thuc_hien: item.ktv_thuc_hien ?? "",
      hoa_chat_su_dung: "",
      vat_tu_su_dung: "",
      ket_qua: item.ket_qua ?? "",
      ghi_chu: item.ghi_chu ?? "",
    });
    setHoaChatRows(
      item.hoa_chat_su_dung?.map((h) => ({ id: h.id, ten: h.ten, lieu_luong: h.lieu_luong })) ?? []
    );
    setVatTuRows(
      item.vat_tu_su_dung?.map((v) => ({ id: v.id, ten: v.ten, so_luong: String(v.so_luong) })) ?? []
    );
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const hoaChatParsed = hoaChatRows.filter((r) => r.id).map((r) => ({
        id: r.id,
        ten: r.ten,
        lieu_luong: r.lieu_luong,
      }));
      const vatTuParsed = vatTuRows.filter((r) => r.id).map((r) => ({
        id: r.id,
        ten: r.ten,
        so_luong: Number(r.so_luong) || 0,
      }));

      const payload = {
        contract_id: values.contract_id,
        customer_id: values.customer_id,
        ngay_thuc_hien: values.ngay_thuc_hien,
        ktv_thuc_hien: values.ktv_thuc_hien || null,
        hoa_chat_su_dung: hoaChatParsed.length ? hoaChatParsed : null,
        vat_tu_su_dung: vatTuParsed.length ? vatTuParsed : null,
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id} onClick={() => openEditDialog(item)}>
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
                <SearchSelect
                  placeholder="Tìm theo mã HĐ, tên KH..."
                  value={form.watch("contract_id")}
                  onChange={handleContractChange}
                  options={contracts.map((c) => ({
                    value: c.id,
                    label: `${c.ma_hd} - ${c.customers?.ten_kh ?? ""}`,
                  }))}
                />
                {form.formState.errors.contract_id && (
                  <p className="error">
                    {form.formState.errors.contract_id.message}
                  </p>
                )}
              </div>

              <div className="form-field">
                <Label>Khách hàng *</Label>
                <SearchSelect
                  placeholder="Tìm theo tên, mã KH..."
                  value={form.watch("customer_id")}
                  onChange={(v) => form.setValue("customer_id", v)}
                  options={customers.map((c) => ({
                    value: c.id,
                    label: `${c.ma_kh} - ${c.ten_kh}`,
                  }))}
                />
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

              <div className="form-field full-width">
                <Label>Hóa chất sử dụng</Label>
                {hoaChatRows.map((row, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                    <select
                      className="native-select"
                      style={{ flex: 2 }}
                      value={row.id}
                      onChange={(e) => {
                        const chem = chemicals.find((c) => c.id === e.target.value);
                        const updated = [...hoaChatRows];
                        updated[i] = { id: e.target.value, ten: chem?.ten_thuong_mai ?? "", lieu_luong: row.lieu_luong };
                        setHoaChatRows(updated);
                      }}
                    >
                      <option value="">Chọn hóa chất</option>
                      {chemicals.map((c) => (
                        <option key={c.id} value={c.id}>{c.ten_thuong_mai}</option>
                      ))}
                    </select>
                    <Input
                      style={{ flex: 1 }}
                      placeholder="Liều lượng"
                      value={row.lieu_luong}
                      onChange={(e) => {
                        const updated = [...hoaChatRows];
                        updated[i] = { ...row, lieu_luong: e.target.value };
                        setHoaChatRows(updated);
                      }}
                    />
                    <button type="button" className="btn-action danger" onClick={() => setHoaChatRows(hoaChatRows.filter((_, j) => j !== i))}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setHoaChatRows([...hoaChatRows, { id: "", ten: "", lieu_luong: "" }])}>
                  <Plus size={14} /> Thêm hóa chất
                </Button>
              </div>

              <div className="form-field full-width">
                <Label>Vật tư sử dụng</Label>
                {vatTuRows.map((row, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                    <select
                      className="native-select"
                      style={{ flex: 2 }}
                      value={row.id}
                      onChange={(e) => {
                        const sup = supplies.find((s) => s.id === e.target.value);
                        const updated = [...vatTuRows];
                        updated[i] = { id: e.target.value, ten: sup?.ten_vat_tu ?? "", so_luong: row.so_luong };
                        setVatTuRows(updated);
                      }}
                    >
                      <option value="">Chọn vật tư</option>
                      {supplies.map((s) => (
                        <option key={s.id} value={s.id}>{s.ten_vat_tu}</option>
                      ))}
                    </select>
                    <Input
                      style={{ flex: 1 }}
                      type="number"
                      placeholder="Số lượng"
                      value={row.so_luong}
                      onChange={(e) => {
                        const updated = [...vatTuRows];
                        updated[i] = { ...row, so_luong: e.target.value };
                        setVatTuRows(updated);
                      }}
                    />
                    <button type="button" className="btn-action danger" onClick={() => setVatTuRows(vatTuRows.filter((_, j) => j !== i))}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setVatTuRows([...vatTuRows, { id: "", ten: "", so_luong: "" }])}>
                  <Plus size={14} /> Thêm vật tư
                </Button>
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
              {editingItem && canEdit && (
                <Button type="button" variant="destructive" onClick={() => { setDialogOpen(false); setDeletingItem(editingItem); setDeleteDialogOpen(true); }}>
                  <Trash2 size={14} /> Xóa
                </Button>
              )}
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
