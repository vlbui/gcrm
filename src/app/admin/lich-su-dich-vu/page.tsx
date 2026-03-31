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
      toast.error("Khong the tai du lieu");
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
          toast.error("Hoa chat su dung khong dung dinh dang JSON");
          setSubmitting(false);
          return;
        }
      }

      if (values.vat_tu_su_dung && values.vat_tu_su_dung.trim()) {
        try {
          vatTuParsed = JSON.parse(values.vat_tu_su_dung);
        } catch {
          toast.error("Vat tu su dung khong dung dinh dang JSON");
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
        toast.success("Cap nhat lich su dich vu thanh cong");
      } else {
        await createServiceHistory(payload);
        toast.success("Them lich su dich vu thanh cong");
      }

      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Co loi xay ra, vui long thu lai");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteServiceHistory(deletingItem.id);
      toast.success("Xoa lich su dich vu thanh cong");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadData();
    } catch {
      toast.error("Khong the xoa lich su dich vu");
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

  const canEdit = user?.vai_tro === "Admin" || user?.vai_tro === "Nhân viên";

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lich su dich vu</h1>
          <p className="admin-page-subtitle">
            Quan ly lich su thuc hien dich vu
          </p>
        </div>
        {canEdit && (
          <Button className="btn-add" onClick={openCreateDialog}>
            <Plus size={16} />
            Them moi
          </Button>
        )}
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tim kiem lich su dich vu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Dang tai...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>Khong co du lieu</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ma LSDV</TableHead>
                <TableHead>Khach hang</TableHead>
                <TableHead>Hop dong</TableHead>
                <TableHead>Ngay thuc hien</TableHead>
                <TableHead>KTV thuc hien</TableHead>
                <TableHead>Ket qua</TableHead>
                <TableHead>Thao tac</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.ma_lsdv}</TableCell>
                  <TableCell>{item.customers?.ten_kh ?? "—"}</TableCell>
                  <TableCell>{item.contracts?.ma_hd ?? "—"}</TableCell>
                  <TableCell>
                    {new Date(item.ngay_thuc_hien).toLocaleDateString("vi-VN")}
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
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Cap nhat lich su dich vu" : "Them lich su dich vu"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Chinh sua thong tin lich su dich vu"
                : "Nhap thong tin lich su dich vu moi"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Hop dong *</Label>
                <Select
                  value={form.watch("contract_id")}
                  onValueChange={handleContractChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chon hop dong" />
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
                <Label>Khach hang *</Label>
                <Select
                  value={form.watch("customer_id")}
                  onValueChange={(v) => form.setValue("customer_id", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chon khach hang" />
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
                <Label>Ngay thuc hien *</Label>
                <Input
                  type="date"
                  {...form.register("ngay_thuc_hien")}
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
                <Label>Hoa chat su dung (JSON)</Label>
                <Textarea
                  rows={3}
                  placeholder='[{"id":"1","ten":"Hoa chat A","lieu_luong":"100ml"}]'
                  {...form.register("hoa_chat_su_dung")}
                />
              </div>

              <div className="form-field">
                <Label>Vat tu su dung (JSON)</Label>
                <Textarea
                  rows={3}
                  placeholder='[{"id":"1","ten":"Bay dinh","so_luong":5}]'
                  {...form.register("vat_tu_su_dung")}
                />
              </div>

              <div className="form-field">
                <Label>Ket qua</Label>
                <Textarea rows={3} {...form.register("ket_qua")} />
              </div>

              <div className="form-field full-width">
                <Label>Ghi chu</Label>
                <Textarea rows={3} {...form.register("ghi_chu")} />
              </div>
            </div>

            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Huy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Dang xu ly..."
                  : editingItem
                    ? "Cap nhat"
                    : "Them moi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xac nhan xoa</DialogTitle>
            <DialogDescription>
              Ban co chac chan muon xoa lich su dich vu{" "}
              <strong>{deletingItem?.ma_lsdv}</strong>? Hanh dong nay khong the
              hoan tac.
            </DialogDescription>
          </DialogHeader>
          <div className="form-actions">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Huy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xoa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
