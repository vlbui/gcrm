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

const contractSchema = z.object({
  customer_id: z.string().min(1, "Vui lòng chọn khách hàng"),
  dich_vu: z.string().min(1, "Dịch vụ là bắt buộc"),
  dien_tich: z.string().nullable(),
  gia_tri: z.coerce.number().nullable(),
  trang_thai: z.string(),
  ngay_bat_dau: z.string().nullable(),
  ngay_ket_thuc: z.string().nullable(),
  ghi_chu: z.string().nullable(),
});

type ContractFormData = z.infer<typeof contractSchema>;

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("vi-VN") + " \u20AB";
}

export default function HopDongPage() {
  const { user } = useCurrentUser();
  const [data, setData] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.ma_hd.toLowerCase().includes(q) ||
      item.dich_vu.toLowerCase().includes(q) ||
      (item.customers?.ten_kh.toLowerCase().includes(q) ?? false)
    );
  });

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

  const handleDelete = async (item: Contract) => {
    if (!window.confirm(`Xác nhận xóa hợp đồng "${item.ma_hd}"?`)) return;
    try {
      await deleteContract(item.id);
      toast.success("Xóa hợp đồng thành công");
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
              onChange={(e) => setSearch(e.target.value)}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã HĐ</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Dịch vụ</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
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
                    {item.ngay_bat_dau
                      ? new Date(item.ngay_bat_dau).toLocaleDateString("vi-VN")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {canEdit(item) && (
                      <>
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
                      </>
                    )}
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
              {editing ? "Cập nhật hợp đồng" : "Thêm hợp đồng"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Khách hàng *</Label>
                <Select
                  defaultValue={editing?.customer_id ?? ""}
                  onValueChange={(val) => setValue("customer_id", val)}
                >
                  <SelectTrigger>
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
                {errors.customer_id && (
                  <span className="error">{errors.customer_id.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Dịch vụ *</Label>
                <Input {...register("dich_vu")} />
                {errors.dich_vu && (
                  <span className="error">{errors.dich_vu.message}</span>
                )}
              </div>
              <div className="form-field">
                <Label>Diện tích</Label>
                <Input {...register("dien_tich")} />
              </div>
              <div className="form-field">
                <Label>Giá trị (VNĐ)</Label>
                <Input type="number" {...register("gia_tri")} />
              </div>
              <div className="form-field">
                <Label>Trạng thái</Label>
                <Select
                  defaultValue={editing?.trang_thai ?? "Mới"}
                  onValueChange={(val) => setValue("trang_thai", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mới">Mới</SelectItem>
                    <SelectItem value="Đang thực hiện">
                      Đang thực hiện
                    </SelectItem>
                    <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
                    <SelectItem value="Hủy">Hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="form-field">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" {...register("ngay_bat_dau")} />
              </div>
              <div className="form-field">
                <Label>Ngày kết thúc</Label>
                <Input type="date" {...register("ngay_ket_thuc")} />
              </div>
              <div className="form-field full-width">
                <Label>Ghi chú</Label>
                <Textarea {...register("ghi_chu")} />
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
