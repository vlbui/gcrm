"use client";

import { useEffect, useState } from "react";
import {
  fetchReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  type Reminder,
  type CreateReminderInput,
} from "@/lib/api/reminders.api";
import { fetchCustomers, type Customer } from "@/lib/api/customers.api";
import { fetchContracts, type Contract } from "@/lib/api/contracts.api";
import { fetchUsers, type User } from "@/lib/api/users.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import Pagination from "@/components/admin/Pagination";
import DateInput from "@/components/admin/DateInput";
import {
  Plus,
  Search,
  Trash2,
  Bell,
  CheckCircle2,
  Pencil,
  AlertTriangle,
} from "lucide-react";
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

const LOAI_OPTIONS = [
  "Lần DV tiếp theo",
  "Bảo hành",
  "Tái ký",
  "Hỏi thăm",
  "Thanh toán",
  "Khác",
];
type Swatch = { bg: string; color: string; border: string };
const LOAI_COLORS: Record<string, Swatch> = {
  "Lần DV tiếp theo": { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  "Bảo hành": { bg: "#FFFBEB", color: "#B45309", border: "#FCD34D" },
  "Tái ký": { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
  "Hỏi thăm": { bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE" },
  "Thanh toán": { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA" },
  Khác: { bg: "#F3F4F6", color: "#374151", border: "#D1D5DB" },
};
const TT_COLORS: Record<string, Swatch> = {
  Chờ: { bg: "#FFFBEB", color: "#B45309", border: "#FCD34D" },
  "Đã làm": { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
  "Bỏ qua": { bg: "#F3F4F6", color: "#374151", border: "#D1D5DB" },
};

function Chip({ swatch, children }: { swatch?: Swatch; children: React.ReactNode }) {
  const s = swatch ?? LOAI_COLORS.Khác;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 999,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

type FormState = {
  customer_id: string;
  contract_id: string;
  loai: string;
  ngay_nhac: string;
  noi_dung: string;
  nguoi_phu_trach: string;
  trang_thai: string;
};

const emptyForm = (): FormState => ({
  customer_id: "",
  contract_id: "",
  loai: "Hỏi thăm",
  ngay_nhac: new Date().toISOString().split("T")[0],
  noi_dung: "",
  nguoi_phu_trach: "",
  trang_thai: "Chờ",
});

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Chờ");
  const [filterLoai, setFilterLoai] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  // Delete confirm dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Reminder | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [r, c, ct, u] = await Promise.all([
        fetchReminders(),
        fetchCustomers(),
        fetchContracts(),
        fetchUsers(),
      ]);
      setReminders(r);
      setCustomers(c);
      setContracts(ct);
      setUsers(u);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }

  const filtered = reminders.filter((r) => {
    if (filterStatus && r.trang_thai !== filterStatus) return false;
    if (filterLoai && r.loai !== filterLoai) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.customers?.ten_kh.toLowerCase().includes(q) &&
        !r.noi_dung?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const today = new Date().toISOString().split("T")[0];

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (r: Reminder) => {
    setEditing(r);
    setForm({
      customer_id: r.customer_id ?? "",
      contract_id: r.contract_id ?? "",
      loai: r.loai,
      ngay_nhac: r.ngay_nhac,
      noi_dung: r.noi_dung ?? "",
      nguoi_phu_trach: r.nguoi_phu_trach ?? "",
      trang_thai: r.trang_thai,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.ngay_nhac || !form.loai) {
      toast.error("Vui lòng nhập loại và ngày nhắc");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateReminder(editing.id, {
          customer_id: form.customer_id || null,
          contract_id: form.contract_id || null,
          loai: form.loai,
          ngay_nhac: form.ngay_nhac,
          noi_dung: form.noi_dung || null,
          nguoi_phu_trach: form.nguoi_phu_trach || null,
          trang_thai: form.trang_thai,
        });
        toast.success("Đã cập nhật nhắc nhở");
      } else {
        const payload: CreateReminderInput = {
          loai: form.loai,
          ngay_nhac: form.ngay_nhac,
        };
        if (form.customer_id) payload.customer_id = form.customer_id;
        if (form.contract_id) payload.contract_id = form.contract_id;
        if (form.noi_dung) payload.noi_dung = form.noi_dung;
        if (form.nguoi_phu_trach) payload.nguoi_phu_trach = form.nguoi_phu_trach;
        await createReminder(payload);
        toast.success("Đã tạo nhắc nhở");
      }
      setDialogOpen(false);
      await loadData();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSaving(false);
    }
  };

  const handleDone = async (id: string) => {
    try {
      await updateReminder(id, { trang_thai: "Đã làm" });
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, trang_thai: "Đã làm" } : r))
      );
      toast.success("Đã đánh dấu hoàn thành");
    } catch {
      toast.error("Lỗi cập nhật");
    }
  };

  const confirmDelete = (r: Reminder) => {
    // Close the edit dialog first so two Radix Dialogs don't fight
    // over focus-trap / overlay.
    setDialogOpen(false);
    setDeletingItem(r);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteReminder(deletingItem.id);
      setReminders((prev) => prev.filter((r) => r.id !== deletingItem.id));
      toast.success("Đã xóa nhắc nhở");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      setEditing(null);
    } catch {
      toast.error("Lỗi xóa nhắc nhở");
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Lịch nhắc</h1>
          <p className="admin-page-subtitle">
            Quản lý nhắc nhở &amp; chăm sóc ({filtered.length})
          </p>
        </div>
        <Button className="btn-add" onClick={openAdd}>
          <Plus size={16} /> Tạo nhắc nhở
        </Button>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-toolbar">
          <div className="data-table-search">
            <Search size={16} />
            <Input
              placeholder="Tìm theo khách hàng, nội dung..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                { key: "", label: "Tất cả" },
                { key: "Chờ", label: "Chờ" },
                { key: "Đã làm", label: "Đã làm" },
                { key: "Bỏ qua", label: "Bỏ qua" },
              ].map((s) => (
                <Button
                  key={s.key}
                  size="sm"
                  variant={filterStatus === s.key ? "default" : "outline"}
                  onClick={() => {
                    setFilterStatus(s.key);
                    setPage(1);
                  }}
                >
                  {s.label}
                </Button>
              ))}
            </div>
            <select
              className="native-select"
              style={{ width: 160 }}
              value={filterLoai}
              onChange={(e) => {
                setFilterLoai(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả loại</option>
              {LOAI_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Đang tải...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} strokeWidth={1} />
            <p>Không có nhắc nhở</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Ngày nhắc</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>HĐ</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Phụ trách</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead style={{ width: 120, textAlign: "right" }}></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((r) => {
                  const isOverdue =
                    r.trang_thai === "Chờ" && r.ngay_nhac < today;
                  return (
                    <TableRow
                      key={r.id}
                      onClick={() => openEdit(r)}
                      style={isOverdue ? { background: "#FEF2F2" } : undefined}
                    >
                      <TableCell>
                        <Chip swatch={LOAI_COLORS[r.loai]}>{r.loai}</Chip>
                      </TableCell>
                      <TableCell
                        style={
                          isOverdue
                            ? { color: "#DC2626", fontWeight: 600 }
                            : undefined
                        }
                      >
                        {formatDate(r.ngay_nhac)}
                        {isOverdue && " (quá hạn)"}
                      </TableCell>
                      <TableCell>{r.customers?.ten_kh || "—"}</TableCell>
                      <TableCell>{r.contracts?.ma_hd || "—"}</TableCell>
                      <TableCell
                        style={{
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.noi_dung || "—"}
                      </TableCell>
                      <TableCell>{r.users?.ho_ten || "—"}</TableCell>
                      <TableCell>
                        <Chip swatch={TT_COLORS[r.trang_thai]}>{r.trang_thai}</Chip>
                      </TableCell>
                      <TableCell
                        style={{ textAlign: "right" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          {r.trang_thai === "Chờ" && (
                            <Button
                              variant="outline"
                              size="icon-sm"
                              title="Đánh dấu đã làm"
                              onClick={() => handleDone(r.id)}
                            >
                              <CheckCircle2 size={16} />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon-sm"
                            title="Sửa"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            title="Xóa"
                            onClick={() => confirmDelete(r)}
                            style={{ color: "#DC2626", borderColor: "#FCA5A5" }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination
              total={filtered.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Cập nhật nhắc nhở" : "Tạo nhắc nhở mới"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Chỉnh sửa thông tin nhắc nhở và lưu lại."
                : "Điền thông tin bên dưới để tạo một lời nhắc mới."}
            </DialogDescription>
          </DialogHeader>

          <div className="form-grid">
            <div className="form-field">
              <Label>
                Loại nhắc <span style={{ color: "#DC2626" }}>*</span>
              </Label>
              <select
                className="native-select"
                value={form.loai}
                onChange={(e) => setForm({ ...form, loai: e.target.value })}
              >
                {LOAI_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <Label>
                Ngày nhắc <span style={{ color: "#DC2626" }}>*</span>
              </Label>
              <DateInput
                value={form.ngay_nhac}
                onChange={(v) => setForm({ ...form, ngay_nhac: v })}
              />
            </div>

            <div className="form-field">
              <Label>Khách hàng</Label>
              <select
                className="native-select"
                value={form.customer_id}
                onChange={(e) =>
                  setForm({ ...form, customer_id: e.target.value, contract_id: "" })
                }
              >
                <option value="">— Không chọn —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ma_kh} — {c.ten_kh}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <Label>Hợp đồng</Label>
              <select
                className="native-select"
                value={form.contract_id}
                onChange={(e) => setForm({ ...form, contract_id: e.target.value })}
              >
                <option value="">— Không chọn —</option>
                {contracts
                  .filter(
                    (c) => !form.customer_id || c.customer_id === form.customer_id
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ma_hd} — {c.dich_vu}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-field">
              <Label>Người phụ trách</Label>
              <select
                className="native-select"
                value={form.nguoi_phu_trach}
                onChange={(e) =>
                  setForm({ ...form, nguoi_phu_trach: e.target.value })
                }
              >
                <option value="">— Không chọn —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.ho_ten}
                  </option>
                ))}
              </select>
            </div>
            {editing && (
              <div className="form-field">
                <Label>Trạng thái</Label>
                <select
                  className="native-select"
                  value={form.trang_thai}
                  onChange={(e) =>
                    setForm({ ...form, trang_thai: e.target.value })
                  }
                >
                  <option value="Chờ">Chờ</option>
                  <option value="Đã làm">Đã làm</option>
                  <option value="Bỏ qua">Bỏ qua</option>
                </select>
              </div>
            )}

            <div className="form-field full-width">
              <Label>Nội dung</Label>
              <Textarea
                rows={3}
                placeholder="Mô tả nội dung nhắc nhở..."
                value={form.noi_dung}
                onChange={(e) => setForm({ ...form, noi_dung: e.target.value })}
              />
            </div>
          </div>

          <div className="form-actions">
            {editing && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => confirmDelete(editing)}
                style={{ marginRight: "auto" }}
              >
                <Trash2 size={16} /> Xóa
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {saving
                ? "Đang lưu..."
                : editing
                ? "Cập nhật"
                : "Tạo nhắc nhở"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <AlertTriangle size={20} style={{ color: "#DC2626" }} />
              Xác nhận xóa
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa nhắc nhở{" "}
              <strong>{deletingItem?.loai}</strong>
              {deletingItem?.customers?.ten_kh && (
                <>
                  {" "}cho khách hàng <strong>{deletingItem.customers.ten_kh}</strong>
                </>
              )}
              ? Hành động này không thể hoàn tác.
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
              <Trash2 size={16} /> Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
