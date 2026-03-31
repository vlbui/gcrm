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
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
} from "@/lib/api/users.api";
import type { UserRole } from "@/lib/api/auth.api";

const formSchema = z.object({
  email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
  ho_ten: z.string().min(2, "Họ tên tối thiểu 2 ký tự"),
  vai_tro: z.enum(["Admin", "Nhân viên", "Xem"]),
  trang_thai: z.enum(["Hoạt động", "Tạm khóa"]),
  avatar_url: z.string().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const roleLabelMap: Record<UserRole, string> = {
  "Admin": "Admin",
  "Nhân viên": "Nhân viên",
  "Xem": "Xem",
};

const roleBadgeClass: Record<UserRole, string> = {
  "Admin": "status-badge active",
  "Nhân viên": "status-badge pending",
  "Xem": "status-badge inactive",
};

export default function NguoiDungPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [deletingItem, setDeletingItem] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      ho_ten: "",
      vai_tro: "Xem",
      trang_thai: "Hoạt động",
      avatar_url: "",
    },
  });

  const loadData = async () => {
    try {
      const users = await fetchUsers();
      setData(users);
    } catch {
      toast.error("Khong the tai du lieu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateDialog = () => {
    setEditingItem(null);
    form.reset({
      email: "",
      ho_ten: "",
      vai_tro: "Xem",
      trang_thai: "Hoạt động",
      avatar_url: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (item: User) => {
    setEditingItem(item);
    form.reset({
      email: item.email,
      ho_ten: item.ho_ten,
      vai_tro: item.vai_tro,
      trang_thai: item.trang_thai as "Hoạt động" | "Tạm khóa",
      avatar_url: item.avatar_url ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        email: values.email,
        ho_ten: values.ho_ten,
        vai_tro: values.vai_tro as UserRole,
        trang_thai: values.trang_thai,
        avatar_url: values.avatar_url || null,
      };

      if (editingItem) {
        await updateUser(editingItem.id, payload);
        toast.success("Cap nhat nguoi dung thanh cong");
      } else {
        await createUser(payload);
        toast.success("Them nguoi dung thanh cong");
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
      await deleteUser(deletingItem.id);
      toast.success("Xoa nguoi dung thanh cong");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      loadData();
    } catch {
      toast.error("Khong the xoa nguoi dung");
    }
  };

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.email.toLowerCase().includes(q) ||
      item.ho_ten.toLowerCase().includes(q) ||
      item.vai_tro.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Quan ly nguoi dung</h1>
          <p className="admin-page-subtitle">
            Quan ly tai khoan va phan quyen nguoi dung
          </p>
        </div>
        <Button className="btn-add" onClick={openCreateDialog}>
          <Plus size={16} />
          Them moi
        </Button>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tim kiem nguoi dung..."
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
                <TableHead>Email</TableHead>
                <TableHead>Ho ten</TableHead>
                <TableHead>Vai tro</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead>Ngay tao</TableHead>
                <TableHead>Thao tac</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.ho_ten}</TableCell>
                  <TableCell>
                    <span className={roleBadgeClass[item.vai_tro]}>
                      {roleLabelMap[item.vai_tro]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`status-badge ${item.trang_thai === "Hoạt động" ? "active" : "inactive"}`}
                    >
                      {item.trang_thai}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Cap nhat nguoi dung" : "Them nguoi dung"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Chinh sua thong tin nguoi dung"
                : "Nhap thong tin nguoi dung moi"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="form-grid">
              <div className="form-field">
                <Label>Email *</Label>
                <Input
                  type="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="error">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="form-field">
                <Label>Ho ten *</Label>
                <Input {...form.register("ho_ten")} />
                {form.formState.errors.ho_ten && (
                  <p className="error">
                    {form.formState.errors.ho_ten.message}
                  </p>
                )}
              </div>

              <div className="form-field">
                <Label>Vai tro</Label>
                <Select
                  value={form.watch("vai_tro")}
                  onValueChange={(v) =>
                    form.setValue("vai_tro", v as "Admin" | "Nhân viên" | "Xem")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chon vai tro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Nhân viên">Nhân viên</SelectItem>
                    <SelectItem value="Xem">Xem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label>Trang thai</Label>
                <Select
                  value={form.watch("trang_thai")}
                  onValueChange={(v) =>
                    form.setValue("trang_thai", v as "Hoạt động" | "Tạm khóa")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chon trang thai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hoạt động">Hoạt động</SelectItem>
                    <SelectItem value="Tạm khóa">Tạm khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field full-width">
                <Label>Avatar URL</Label>
                <Input {...form.register("avatar_url")} />
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
              Ban co chac chan muon xoa nguoi dung{" "}
              <strong>{deletingItem?.ho_ten}</strong> ({deletingItem?.email})?
              Hanh dong nay khong the hoan tac.
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
