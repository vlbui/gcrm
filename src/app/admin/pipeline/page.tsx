"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchPipelineCards,
  updateCardStatus,
  updateCardDetails,
  createCustomerFromCard,
  createContractFromCard,
  findExistingCustomer,
  PIPELINE_COLUMNS,
  type PipelineCard,
} from "@/lib/api/pipeline.api";
import { fetchUsers, type User } from "@/lib/api/users.api";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Bug,
  Ruler,
  User as UserIcon,
  GripVertical,
  X,
  Filter,
  ChevronDown,
  UserPlus,
  FileText,
  Receipt,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

export default function PipelinePage() {
  const [cards, setCards] = useState<PipelineCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCard, setDraggedCard] = useState<PipelineCard | null>(null);
  const [selectedCard, setSelectedCard] = useState<PipelineCard | null>(null);
  const [filterUser, setFilterUser] = useState("");
  const [filterService, setFilterService] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Sync dialog
  const [syncCard, setSyncCard] = useState<PipelineCard | null>(null);
  const [syncTarget, setSyncTarget] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [cardsData, usersData] = await Promise.all([
        fetchPipelineCards(),
        fetchUsers(),
      ]);
      setCards(cardsData);
      setUsers(usersData);
    } catch {
      toast.error("Lỗi tải dữ liệu pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCards = cards.filter((card) => {
    if (filterUser && card.xu_ly_boi !== filterUser) return false;
    if (filterService && card.loai_con_trung !== filterService) return false;
    return true;
  });

  const getColumnCards = (status: string) =>
    filteredCards.filter((c) => c.trang_thai === status);

  const getColumnTotal = (status: string) =>
    getColumnCards(status).reduce((sum, c) => sum + (c.gia_tri || 0), 0);

  const handleDragStart = (card: PipelineCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("pipeline-col-drag-over");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("pipeline-col-drag-over");
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove("pipeline-col-drag-over");
    if (!draggedCard || draggedCard.trang_thai === newStatus) return;

    // Kéo sang "Chốt đơn" → hỏi tạo KH + HĐ
    if (newStatus === "Chốt đơn") {
      setSyncCard(draggedCard);
      setSyncTarget(newStatus);
      setDraggedCard(null);
      return;
    }

    // Kéo sang "Đã báo giá" → gợi ý tạo báo giá
    if (newStatus === "Đã báo giá") {
      setSyncCard(draggedCard);
      setSyncTarget(newStatus);
      setDraggedCard(null);
      return;
    }

    await moveCard(draggedCard, newStatus);
  };

  const moveCard = async (card: PipelineCard, newStatus: string) => {
    const oldStatus = card.trang_thai;
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, trang_thai: newStatus } : c))
    );
    setDraggedCard(null);

    try {
      await updateCardStatus(card.id, newStatus);
      toast.success(`Chuyển sang "${PIPELINE_COLUMNS.find((c) => c.key === newStatus)?.label || newStatus}"`);
    } catch {
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, trang_thai: oldStatus } : c))
      );
      toast.error("Lỗi cập nhật trạng thái");
    }
  };

  const handleSaveCard = async (updates: Partial<PipelineCard>) => {
    if (!selectedCard) return;
    try {
      await updateCardDetails(selectedCard.id, updates);
      setCards((prev) =>
        prev.map((c) => (c.id === selectedCard.id ? { ...c, ...updates } : c))
      );
      setSelectedCard(null);
      toast.success("Đã cập nhật");
    } catch {
      toast.error("Lỗi cập nhật");
    }
  };

  const serviceTypes = [...new Set(cards.map((c) => c.loai_con_trung).filter(Boolean))];

  if (loading) {
    return <div className="empty-state"><p>Đang tải pipeline...</p></div>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Sales Pipeline</h1>
          <p className="admin-page-subtitle">Quản lý quy trình bán hàng</p>
        </div>
        <button
          className="admin-btn admin-btn-outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} /> Bộ lọc <ChevronDown size={14} />
        </button>
      </div>

      {showFilters && (
        <div className="pipeline-filters">
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="admin-input">
            <option value="">Tất cả nhân viên</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.ho_ten}</option>
            ))}
          </select>
          <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="admin-input">
            <option value="">Tất cả dịch vụ</option>
            {serviceTypes.map((s) => (
              <option key={s} value={s!}>{s}</option>
            ))}
          </select>
          {(filterUser || filterService) && (
            <button className="admin-btn admin-btn-ghost" onClick={() => { setFilterUser(""); setFilterService(""); }}>
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      <div className="pipeline-board">
        {PIPELINE_COLUMNS.map((col) => {
          const colCards = getColumnCards(col.key);
          const total = getColumnTotal(col.key);
          return (
            <div
              key={col.key}
              className="pipeline-column"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className="pipeline-col-header">
                <div className="pipeline-col-title">
                  <span className="pipeline-col-dot" style={{ background: col.color }} />
                  {col.label}
                  <span className="pipeline-col-count">{colCards.length}</span>
                </div>
                {total > 0 && (
                  <div className="pipeline-col-total">{total.toLocaleString("vi-VN")}đ</div>
                )}
              </div>
              <div className="pipeline-col-body">
                {colCards.map((card) => (
                  <div
                    key={card.id}
                    className="pipeline-card"
                    draggable
                    onDragStart={() => handleDragStart(card)}
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="pipeline-card-grip"><GripVertical size={14} /></div>
                    <div className="pipeline-card-name">{card.ten_kh}</div>
                    <div className="pipeline-card-phone"><Phone size={12} /> {card.sdt}</div>
                    {card.loai_con_trung && (
                      <div className="pipeline-card-service"><Bug size={12} /> {card.loai_con_trung}</div>
                    )}
                    {card.gia_tri > 0 && (
                      <div className="pipeline-card-value">{card.gia_tri.toLocaleString("vi-VN")}đ</div>
                    )}
                    {card.users?.ho_ten && (
                      <div className="pipeline-card-user"><UserIcon size={12} /> {card.users.ho_ten}</div>
                    )}
                  </div>
                ))}
                {colCards.length === 0 && (
                  <div className="pipeline-col-empty">Kéo thả vào đây</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Dialog */}
      {selectedCard && (
        <CardDetailDialog
          card={selectedCard}
          users={users}
          onClose={() => setSelectedCard(null)}
          onSave={handleSaveCard}
          onReload={loadData}
        />
      )}

      {/* Sync Dialog */}
      {syncCard && (
        <SyncDialog
          card={syncCard}
          target={syncTarget}
          onClose={() => { setSyncCard(null); setSyncTarget(""); }}
          onDone={async () => {
            await moveCard(syncCard, syncTarget);
            setSyncCard(null);
            setSyncTarget("");
            await loadData();
          }}
          onSkip={async () => {
            await moveCard(syncCard, syncTarget);
            setSyncCard(null);
            setSyncTarget("");
          }}
        />
      )}
    </div>
  );
}

/* =========================================
   SYNC DIALOG - Tạo KH / HĐ / Báo giá
   ========================================= */
function SyncDialog({
  card,
  target,
  onClose,
  onDone,
  onSkip,
}: {
  card: PipelineCard;
  target: string;
  onClose: () => void;
  onDone: () => Promise<void>;
  onSkip: () => Promise<void>;
}) {
  const [step, setStep] = useState<"check" | "creating" | "done">("check");
  const [existingCustomer, setExistingCustomer] = useState<{ id: string; ten_kh: string; ma_kh: string } | null>(null);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [createdItems, setCreatedItems] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Check if customer already exists
    findExistingCustomer(card.sdt).then((c) => {
      if (c) setExistingCustomer(c);
    });
  }, [card.sdt]);

  const isClosing = target === "Chốt đơn";
  const isQuoting = target === "Đã báo giá";

  const handleCreateCustomer = async () => {
    setProcessing(true);
    try {
      const id = await createCustomerFromCard(card);
      setCreatedCustomerId(id);
      setCreatedItems((prev) => [...prev, "Khách hàng"]);
      toast.success("Đã tạo khách hàng");
    } catch {
      toast.error("Lỗi tạo khách hàng");
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateContract = async () => {
    const custId = createdCustomerId || existingCustomer?.id;
    if (!custId) {
      toast.error("Cần tạo/chọn khách hàng trước");
      return;
    }
    setProcessing(true);
    try {
      await createContractFromCard(card, custId);
      setCreatedItems((prev) => [...prev, "Hợp đồng"]);
      toast.success("Đã tạo hợp đồng");
    } catch {
      toast.error("Lỗi tạo hợp đồng");
    } finally {
      setProcessing(false);
    }
  };

  const handleDone = async () => {
    setProcessing(true);
    await onDone();
    setProcessing(false);
  };

  const customerId = createdCustomerId || existingCustomer?.id;
  const hasCustomer = !!customerId;
  const hasContract = createdItems.includes("Hợp đồng");

  return (
    <div className="admin-dialog-overlay" onClick={onClose}>
      <div className="admin-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="admin-dialog-header">
          <h2>
            {isClosing ? "Chốt đơn — Tạo KH & HĐ" : "Báo giá cho khách"}
          </h2>
          <button className="admin-dialog-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="admin-dialog-body">
          <div className="sync-card-info">
            <div><strong>{card.ten_kh}</strong></div>
            <div style={{ fontSize: 13, color: "var(--neutral-500)" }}>
              {card.sdt} {card.loai_con_trung && `· ${card.loai_con_trung}`}
              {card.gia_tri > 0 && ` · ${card.gia_tri.toLocaleString("vi-VN")}đ`}
            </div>
          </div>

          {isClosing && (
            <div className="sync-steps">
              {/* Step 1: Khách hàng */}
              <div className="sync-step">
                <div className="sync-step-header">
                  <UserPlus size={18} />
                  <span>1. Khách hàng</span>
                  {hasCustomer && <CheckCircle size={16} style={{ color: "#10B981", marginLeft: "auto" }} />}
                </div>
                {existingCustomer && !createdCustomerId ? (
                  <div className="sync-step-body">
                    <div className="sync-existing">
                      <CheckCircle size={14} style={{ color: "#10B981" }} />
                      Đã có KH: <strong>{existingCustomer.ma_kh} — {existingCustomer.ten_kh}</strong>
                    </div>
                  </div>
                ) : createdCustomerId ? (
                  <div className="sync-step-body">
                    <div className="sync-existing">
                      <CheckCircle size={14} style={{ color: "#10B981" }} />
                      Đã tạo khách hàng thành công
                    </div>
                  </div>
                ) : (
                  <div className="sync-step-body">
                    <p style={{ fontSize: 13, color: "var(--neutral-500)", marginBottom: 8 }}>
                      Chưa tìm thấy KH với SĐT {card.sdt}
                    </p>
                    <button
                      className="admin-btn admin-btn-primary"
                      onClick={handleCreateCustomer}
                      disabled={processing}
                    >
                      <UserPlus size={14} /> Tạo khách hàng mới
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Hợp đồng */}
              <div className="sync-step">
                <div className="sync-step-header">
                  <FileText size={18} />
                  <span>2. Hợp đồng</span>
                  {hasContract && <CheckCircle size={16} style={{ color: "#10B981", marginLeft: "auto" }} />}
                </div>
                <div className="sync-step-body">
                  {hasContract ? (
                    <div className="sync-existing">
                      <CheckCircle size={14} style={{ color: "#10B981" }} />
                      Đã tạo hợp đồng thành công
                    </div>
                  ) : (
                    <button
                      className="admin-btn admin-btn-primary"
                      onClick={handleCreateContract}
                      disabled={processing || !hasCustomer}
                    >
                      <FileText size={14} /> Tạo hợp đồng
                    </button>
                  )}
                  {!hasCustomer && !hasContract && (
                    <p style={{ fontSize: 12, color: "var(--neutral-400)", marginTop: 4 }}>
                      Cần có khách hàng trước
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isQuoting && (
            <div className="sync-steps">
              <div className="sync-step">
                <div className="sync-step-header">
                  <Receipt size={18} />
                  <span>Tạo báo giá cho yêu cầu này</span>
                </div>
                <div className="sync-step-body">
                  <Link
                    href={`/admin/bao-gia/tao-moi`}
                    className="admin-btn admin-btn-primary"
                  >
                    <Receipt size={14} /> Tạo báo giá <ExternalLink size={12} />
                  </Link>
                  <p style={{ fontSize: 12, color: "var(--neutral-400)", marginTop: 6 }}>
                    Hoặc bỏ qua nếu đã tạo báo giá bên ngoài
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="admin-dialog-footer">
          <button className="admin-btn admin-btn-outline" onClick={() => onSkip()}>
            Bỏ qua, chỉ chuyển trạng thái
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleDone}
            disabled={processing}
          >
            {isClosing
              ? hasContract ? "Hoàn tất chốt đơn" : "Chuyển sang Chốt đơn"
              : "Chuyển sang Đã báo giá"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   CARD DETAIL DIALOG
   ========================================= */
function CardDetailDialog({
  card,
  users,
  onClose,
  onSave,
  onReload,
}: {
  card: PipelineCard;
  users: User[];
  onClose: () => void;
  onSave: (updates: Partial<PipelineCard>) => void;
  onReload: () => void;
}) {
  const [giaTriStr, setGiaTriStr] = useState(String(card.gia_tri || ""));
  const [ghiChu, setGhiChu] = useState(card.ghi_chu_nv || "");
  const [xuLyBoi, setXuLyBoi] = useState(card.xu_ly_boi || "");
  const [existingCustomer, setExistingCustomer] = useState<{ id: string; ten_kh: string; ma_kh: string } | null>(null);

  useEffect(() => {
    findExistingCustomer(card.sdt).then(setExistingCustomer);
  }, [card.sdt]);

  const handleQuickCreateCustomer = async () => {
    try {
      await createCustomerFromCard(card);
      toast.success("Đã tạo khách hàng");
      const c = await findExistingCustomer(card.sdt);
      setExistingCustomer(c);
    } catch {
      toast.error("Lỗi tạo khách hàng");
    }
  };

  return (
    <div className="admin-dialog-overlay" onClick={onClose}>
      <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="admin-dialog-header">
          <h2>Chi tiết — {card.ma_yc}</h2>
          <button className="admin-dialog-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="admin-dialog-body">
          <div className="pipeline-detail-grid">
            <div className="pipeline-detail-item">
              <UserIcon size={16} />
              <div>
                <div className="pipeline-detail-label">Khách hàng</div>
                <div className="pipeline-detail-value">{card.ten_kh}</div>
              </div>
            </div>
            <div className="pipeline-detail-item">
              <Phone size={16} />
              <div>
                <div className="pipeline-detail-label">SĐT</div>
                <div className="pipeline-detail-value">{card.sdt}</div>
              </div>
            </div>
            {card.email && (
              <div className="pipeline-detail-item">
                <Mail size={16} />
                <div>
                  <div className="pipeline-detail-label">Email</div>
                  <div className="pipeline-detail-value">{card.email}</div>
                </div>
              </div>
            )}
            {card.dia_chi && (
              <div className="pipeline-detail-item">
                <MapPin size={16} />
                <div>
                  <div className="pipeline-detail-label">Địa chỉ</div>
                  <div className="pipeline-detail-value">{card.dia_chi}</div>
                </div>
              </div>
            )}
            {card.loai_con_trung && (
              <div className="pipeline-detail-item">
                <Bug size={16} />
                <div>
                  <div className="pipeline-detail-label">Loại dịch vụ</div>
                  <div className="pipeline-detail-value">{card.loai_con_trung}</div>
                </div>
              </div>
            )}
            {card.dien_tich && (
              <div className="pipeline-detail-item">
                <Ruler size={16} />
                <div>
                  <div className="pipeline-detail-label">Diện tích</div>
                  <div className="pipeline-detail-value">{card.dien_tich}</div>
                </div>
              </div>
            )}
          </div>

          {/* Customer status */}
          <div className="sync-customer-status" style={{ marginTop: 16 }}>
            {existingCustomer ? (
              <div className="sync-existing" style={{ padding: "8px 12px", background: "#F0FDF4", borderRadius: 8 }}>
                <CheckCircle size={14} style={{ color: "#10B981" }} />
                KH: <strong>{existingCustomer.ma_kh}</strong> — {existingCustomer.ten_kh}
                <Link href={`/admin/khach-hang`} style={{ marginLeft: "auto", fontSize: 12, color: "var(--primary-700)" }}>
                  Xem <ExternalLink size={11} />
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "var(--neutral-500)" }}>Chưa có trong danh sách KH</span>
                <button className="admin-btn admin-btn-outline" style={{ fontSize: 12, padding: "4px 10px" }} onClick={handleQuickCreateCustomer}>
                  <UserPlus size={12} /> Tạo KH
                </button>
              </div>
            )}
          </div>

          {card.mo_ta && (
            <div style={{ marginTop: 16 }}>
              <label className="admin-label">Mô tả</label>
              <p style={{ fontSize: 14, color: "var(--neutral-600)" }}>{card.mo_ta}</p>
            </div>
          )}

          <div className="admin-form-row" style={{ marginTop: 16 }}>
            <div className="admin-form-group">
              <label className="admin-label">Giá trị dự kiến (VNĐ)</label>
              <input
                className="admin-input"
                type="number"
                value={giaTriStr}
                onChange={(e) => setGiaTriStr(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-label">Người phụ trách</label>
              <select className="admin-input" value={xuLyBoi} onChange={(e) => setXuLyBoi(e.target.value)}>
                <option value="">— Chọn —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.ho_ten}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: 12 }}>
            <label className="admin-label">Ghi chú nhân viên</label>
            <textarea className="admin-input" rows={3} value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </div>

          <div className="pipeline-detail-meta">
            Ngày tạo: {formatDate(card.created_at)} · Trạng thái: {card.trang_thai}
          </div>
        </div>
        <div className="admin-dialog-footer">
          <button className="admin-btn admin-btn-outline" onClick={onClose}>Đóng</button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() =>
              onSave({
                gia_tri: Number(giaTriStr) || 0,
                xu_ly_boi: xuLyBoi || null,
                ghi_chu_nv: ghiChu || null,
              })
            }
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
