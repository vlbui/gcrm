"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchContracts,
  createContract,
  updateContract,
  deleteContract,
  type Contract,
  type CreateContractInput,
} from "@/lib/api/contracts.api";
import {
  fetchCustomers,
  type Customer,
} from "@/lib/api/customers.api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDate } from "@/lib/utils/date";
import Pagination from "@/components/admin/Pagination";
import DateInput from "@/components/admin/DateInput";
import SearchSelect from "@/components/admin/SearchSelect";

const contractSchema = z.object({
  customer_id: z.string().min(1, "Vui lòng chọn khách hàng"),
  dich_vu: z.string().min(2, "Dịch vụ tối thiểu 2 ký tự"),
  dien_tich: z.string().nullable(),
  gia_tri: z.coerce.number().min(0, "Giá trị không được âm").nullable(),
  trang_thai: z.string(),
  ngay_bat_dau: z.string().min(1, "Vui lòng chọn ngày bắt đầu"),
  ngay_ket_thuc: z.string().nullable(),
  ghi_chu: z.string().nullable(),
});

type ContractFormData = z.infer<typeof contractSchema>;

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("vi-VN") + " \u20AB";
}

export default function HopDongPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useCurrentUser();
  const [data, setData] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Contract | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      customer_id: "",
      dich_vu: "",
      dien_tich: "",
      gia_tri: null,
      trang_thai: "Mới",
      ngay_bat_dau: "",
      ngay_ket_thuc: "",
      ghi_chu: "",
    },
  });

  const loadData = async () => {
    try {
      const [contractsResult, customersResult] = await Promise.all([
        fetchContracts(),
        fetchCustomers(),
      ]);
      setData(contractsResult);
      setCustomers(customersResult);
    } catch {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-open create dialog when navigated from khach-hang with customer_id
  useEffect(() => {
    const customerId = searchParams.get("customer_id");
    if (customerId && customers.length > 0) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        setEditing(null);
        reset({
          customer_id: customerId,
          dich_vu: "",
          dien_tich: "",
          gia_tri: null,
          trang_thai: "Mới",
          ngay_bat_dau: "",
          ngay_ket_thuc: "",
          ghi_chu: "",
        });
        setDialogOpen(true);
        // Clean up URL
        router.replace("/admin/hop-dong");
      }
    }
  }, [customers, searchParams]);

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.ma_hd.toLowerCase().includes(q) ||
      item.dich_vu.toLowerCase().includes(q) ||
      (item.customers?.ten_kh.toLowerCase().includes(q) ?? false)
    );
  });

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openAdd = () => {
    setEditing(null);
    reset({
      customer_id: "",
      dich_vu: "",
      dien_tich: "",
      gia_tri: null,
      trang_thai: "Mới",
      ngay_bat_dau: "",
      ngay_ket_thuc: "",
      ghi_chu: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (item: Contract) => {
    setEditing(item);
    reset({
      customer_id: item.customer_id,
      dich_vu: item.dich_vu,
      dien_tich: item.dien_tich ?? "",
      gia_tri: item.gia_tri,
      trang_thai: item.trang_thai,
      ngay_bat_dau: item.ngay_bat_dau ?? "",
      ngay_ket_thuc: item.ngay_ket_thuc ?? "",
      ghi_chu: item.ghi_chu ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (formData: ContractFormData) => {
    try {
      const input: CreateContractInput = {
        customer_id: formData.customer_id,
        dich_vu: formData.dich_vu,
        dien_tich: formData.dien_tich || null,
        gia_tri: formData.gia_tri ?? null,
        trang_thai: formData.trang_thai,
        ngay_bat_dau: formData.ngay_bat_dau || null,
        ngay_ket_thuc: formData.ngay_ket_thuc || null,
        ghi_chu: formData.ghi_chu || null,
      };
      if (editing) {
        await updateContract(editing.id, input);
        toast.success("Cập nhật hợp đồng thành công");
      } else {
        await createContract(input);
        toast.success("Thêm hợp đồng thành công");
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteContract(deletingItem.id);
      toast.success("Xóa hợp đồng thành công");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadData();
    } catch {
      toast.error("Không thể xóa hợp đồng");
    }
  };

  const canEdit = (item: Contract) => {
    if (!user) return false;
    if (user.vai_tro === "Xem") return false;
    if (user.vai_tro === "Admin") return true;
    return item.created_by === user.id;
  };

  const statusClass = (status: string) => {
    switch (status) {
      case "Mới":
        return "moi";
      case "Đang thực hiện":
        return "active";
      case "Hoàn thành":
        return "hoan-thanh";
      case "Hủy":
        return "huy";
      default:
        return "";
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Hợp đồng</h1>
          <p className="admin-page-subtitle">Quản lý danh sách hợp đồng</p>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm kiếm theo mã HĐ, dịch vụ, khách hàng..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="data-table-actions">
            {user?.vai_tro !== "Xem" && (
              <Button className="btn-add" onClick={openAdd}>
                <Plus size={16} /> Thêm hợp đồng
              </Button>
            )}
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
                <TableHead>Mã HĐ</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Dịch vụ</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id} onClick={() => openEdit(item)}>
                  <TableCell>{item.ma_hd}</TableCell>
                  <TableCell>
                    {item.customers?.ten_kh ?? "—"}
                  </TableCell>
                  <TableCell>{item.dich_vu}</TableCell>
                  <TableCell>{formatCurrency(item.gia_tri)}</TableCell>
                  <TableCell>
                    <span
                      className={`status-badge ${statusClass(item.trang_thai)}`}
                    >
                      {item.trang_thai}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatDate(item.ngay_bat_dau)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Cập nhật hợp đồng" : "Thêm hợp đồng"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field full-width">
                <Label>Khách hàng *</Label>
                {editing ? (
                  <p style={{ fontSize: 14, fontWeight: 600, padding: "8px 0" }}>
                    {editing.customers?.ten_kh ?? "—"}
                  </p>
                ) : (
                  <SearchSelect
                    placeholder="Tìm theo tên, mã KH, SĐT..."
                    value={watch("customer_id")}
                    onChange={(v) => setValue("customer_id", v)}
                    options={[...customers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((c) => ({
                      value: c.id,
                      label: `${c.ma_kh} - ${c.ten_kh} (${c.sdt})`,
                    }))}
                  />
                )}
                {errors.customer_id && (
                  <span className="error">{errors.customer_id.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Dịch vụ *</Label>
                <Input placeholder="VD: Kiểm soát côn trùng" {...register("dich_vu")} />
                {errors.dich_vu && (
                  <span className="error">{errors.dich_vu.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Diện tích</Label>
                <Input placeholder="VD: 100m²" {...register("dien_tich")} />
              </div>
              <div className="form-field">
                <Label>Giá trị (VNĐ)</Label>
                <Input type="number" placeholder="VD: 2000000" {...register("gia_tri")} />
                {errors.gia_tri && (
                  <span className="error">{errors.gia_tri.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Trạng thái</Label>
                <select className="native-select" value={watch("trang_thai")} onChange={(e) => setValue("trang_thai", e.target.value)}>
                  <option value="Mới">Mới</option>
                  <option value="Đang thực hiện">Đang thực hiện</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Hủy">Hủy</option>
                </select>
              </div>
              <div className="form-field">
                <Label>Ngày bắt đầu *</Label>
                <DateInput value={watch("ngay_bat_dau")} onChange={(v) => setValue("ngay_bat_dau", v)} />
                {errors.ngay_bat_dau && (
                  <span className="error">{errors.ngay_bat_dau.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Ngày kết thúc</Label>
                <DateInput value={watch("ngay_ket_thuc") ?? ""} onChange={(v) => setValue("ngay_ket_thuc", v || null)} />
              </div>
              <div className="form-field full-width">
                <Label>Ghi chú</Label>
                <Textarea placeholder="Thêm ghi chú nếu cần..." {...register("ghi_chu")} />
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
              {editing && canEdit(editing) && (
                <Button type="button" variant="destructive" onClick={() => { setDialogOpen(false); setDeletingItem(editing); setDeleteDialogOpen(true); }}>
                  <Trash2 size={14} /> Xóa
                </Button>
              )}
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
              Bạn có chắc chắn muốn xóa hợp đồng{" "}
              <strong>{deletingItem?.ma_hd}</strong>?
              Hành động này không thể hoàn tác.
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
