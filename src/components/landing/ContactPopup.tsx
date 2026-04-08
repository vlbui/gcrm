"use client";

import { formatDate } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { X, Shield, ArrowLeft, Building2, Home, Check } from "lucide-react";
import { sanitizePhone, sanitizeEmail } from "@/lib/utils/sanitize";

/* ── Context ── */
const PopupContext = createContext<{ open: (loaiHinh?: string) => void }>({ open: () => {} });
export const useContactPopup = () => useContext(PopupContext);

export function ContactPopupProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialLoaiHinh, setInitialLoaiHinh] = useState("");
  const open = useCallback((loaiHinh?: string) => {
    setInitialLoaiHinh(loaiHinh ?? "");
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setInitialLoaiHinh(detail?.loai_hinh ?? "");
      setIsOpen(true);
    };
    window.addEventListener("open-contact-popup", handler);
    return () => window.removeEventListener("open-contact-popup", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <PopupContext.Provider value={{ open }}>
      {children}
      {isOpen && <SmartFormPopup onClose={() => setIsOpen(false)} initialLoaiHinh={initialLoaiHinh} />}
    </PopupContext.Provider>
  );
}

export function CTAButton({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={`btn-cta btn-accent ${className}`} onClick={() => window.dispatchEvent(new Event("open-contact-popup"))}>
      {children ?? "Báo giá miễn phí"}
    </button>
  );
}

/* ── Bug options ── */
const BUG_OPTIONS = ["Gián", "Chuột", "Mối", "Muỗi", "Kiến", "Ruồi", "Khác"];

/* ── Multi-step popup ── */
function SmartFormPopup({ onClose, initialLoaiHinh = "" }: { onClose: () => void; initialLoaiHinh?: string }) {
  const [step, setStep] = useState(1);
  const [customerType, setCustomerType] = useState<"personal" | "org" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateWarning, setDuplicateWarning] = useState("");

  // Personal fields
  const [tenKh, setTenKh] = useState("");
  const [sdt, setSdt] = useState("");
  const [email, setEmail] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [bugs, setBugs] = useState<string[]>([]);
  const [dienTich, setDienTich] = useState("");
  const [moTa, setMoTa] = useState("");

  // Org fields
  const [tenCty, setTenCty] = useState("");
  const [nguoiLienHe, setNguoiLienHe] = useState("");
  const [emailCty, setEmailCty] = useState("");
  const [diaChiCty, setDiaChiCty] = useState("");
  const [loaiHinh, setLoaiHinh] = useState(initialLoaiHinh);
  const [bugsOrg, setBugsOrg] = useState<string[]>([]);
  const [dienTichOrg, setDienTichOrg] = useState("");
  const [soChiNhanh, setSoChiNhanh] = useState("");
  const [nhuCau, setNhuCau] = useState("");
  const [moTaOrg, setMoTaOrg] = useState("");
  const [sdtOrg, setSdtOrg] = useState("");

  const toggleBug = (list: string[], setList: (v: string[]) => void, bug: string) => {
    setList(list.includes(bug) ? list.filter((b) => b !== bug) : [...list, bug]);
  };

  const selectType = (type: "personal" | "org") => {
    setCustomerType(type);
    setStep(2);
    setErrors({});
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (customerType === "personal") {
      if (!tenKh.trim()) e.tenKh = "Vui lòng nhập họ tên";
      if (!sdt.trim() || sdt.trim().length < 8) e.sdt = "Vui lòng nhập SĐT hợp lệ";
      if (!diaChi.trim()) e.diaChi = "Vui lòng nhập địa chỉ";
    } else {
      if (!tenCty.trim()) e.tenCty = "Vui lòng nhập tên công ty";
      if (!nguoiLienHe.trim()) e.nguoiLienHe = "Vui lòng nhập người liên hệ";
      if (!sdtOrg.trim() || sdtOrg.trim().length < 8) e.sdtOrg = "Vui lòng nhập SĐT hợp lệ";
      if (!diaChiCty.trim()) e.diaChiCty = "Vui lòng nhập địa chỉ";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goToStep3 = () => {
    if (validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const now = new Date();

      const isPersonal = customerType === "personal";
      const rawPhone = isPersonal ? sdt : sdtOrg;
      const phone = sanitizePhone(rawPhone);
      const rawEmail = isPersonal ? email : emailCty;
      const emailVal = rawEmail ? sanitizeEmail(rawEmail) : null;

      // Check duplicate by phone on deals table
      const { data: existing } = await supabase
        .from("deals")
        .select("ma_deal, ten_kh, created_at")
        .eq("sdt", phone)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existing && existing.length > 0 && !duplicateWarning) {
        const date = formatDate(existing[0].created_at);
        setDuplicateWarning(
          `SĐT này đã gửi yêu cầu ${existing[0].ma_deal} (${existing[0].ten_kh}) ngày ${date}. Nhấn "Gửi" lần nữa nếu vẫn muốn tạo yêu cầu mới.`
        );
        setSubmitting(false);
        return;
      }

      const orgParts = [
        tenCty && `Công ty: ${tenCty}`,
        soChiNhanh && `Chi nhánh: ${soChiNhanh}`,
        nhuCau && `Nhu cầu: ${nhuCau}`,
        moTaOrg && moTaOrg,
      ].filter(Boolean).join(". ");

      const bugsList = isPersonal ? bugs : bugsOrg;
      const ma_deal = `D-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

      const payload = {
        ma_deal,
        giai_doan: "Khách hỏi" as const,
        loai_kh: isPersonal ? "Cá nhân" as const : "Tổ chức" as const,
        ten_kh: (isPersonal ? tenKh : nguoiLienHe).trim(),
        sdt: phone,
        email: emailVal || null,
        dia_chi: (isPersonal ? diaChi : diaChiCty)?.trim() || null,
        ten_cong_ty: isPersonal ? null : (tenCty?.trim() || null),
        nguoi_lien_he: isPersonal ? null : (nguoiLienHe?.trim() || null),
        loai_hinh: loaiHinh || (isPersonal ? "Cá nhân / Hộ gia đình" : "Doanh nghiệp / Khu công nghiệp"),
        loai_con_trung: bugsList.length > 0 ? bugsList : [],
        dien_tich: Number(isPersonal ? dienTich : dienTichOrg) || null,
        ghi_chu: isPersonal ? (moTa?.trim() || null) : (orgParts || null),
      };

      const { error } = await supabase.from("deals").insert(payload);
      if (error) throw error;
      setSuccess(true);
      setDuplicateWarning("");
      toast.success("Gửi yêu cầu thành công!");
      setTimeout(() => onClose(), 3000);
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng gọi trực tiếp 085 9955 969.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitle = step === 1 ? "Bạn là..." : step === 2 ? (customerType === "personal" ? "Thông tin cá nhân" : "Thông tin doanh nghiệp") : "Xác nhận thông tin";

  return (
    <div className="popup-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="popup-modal">
        <button className="popup-close" onClick={onClose} aria-label="Đóng"><X size={20} /></button>

        {/* Header */}
        <div className="popup-header">
          <div className="popup-header-icon"><Shield size={24} /></div>
          <h3>Nhận tư vấn &amp; báo giá miễn phí</h3>
          {/* Step indicator */}
          <div className="popup-steps">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`popup-step-dot ${step >= s ? "active" : ""} ${step === s ? "current" : ""}`}>
                {step > s ? <Check size={12} /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="popup-body">
          {success ? (
            <div className="popup-success">
              <div className="popup-success-icon">&#10003;</div>
              <h4>Cảm ơn bạn!</h4>
              <p>Chúng tôi sẽ liên hệ trong 30 phút trong giờ hành chính.</p>
              <button className="popup-success-btn" onClick={onClose}>Đóng</button>
            </div>
          ) : step === 1 ? (
            /* ── Step 1: Choose type ── */
            <div className="popup-step-content">
              <p className="popup-step-label">{stepTitle}</p>
              <div className="popup-type-cards">
                <button className="popup-type-card" onClick={() => selectType("personal")}>
                  <Home size={32} />
                  <span className="popup-type-title">Cá nhân / Hộ gia đình</span>
                  <span className="popup-type-desc">Căn hộ, nhà phố, biệt thự</span>
                </button>
                <button className="popup-type-card" onClick={() => selectType("org")}>
                  <Building2 size={32} />
                  <span className="popup-type-title">Doanh nghiệp / Tổ chức</span>
                  <span className="popup-type-desc">Doanh nghiệp, chung cư, văn phòng, trang trại</span>
                </button>
              </div>
            </div>
          ) : step === 2 && customerType === "personal" ? (
            /* ── Step 2A: Personal ── */
            <div className="popup-step-content">
              <button className="popup-back" onClick={() => setStep(1)}><ArrowLeft size={16} /> Quay lại</button>
              <div className="popup-form-row">
                <Field label="Họ tên *" error={errors.tenKh}>
                  <input value={tenKh} onChange={(e) => setTenKh(e.target.value)} placeholder="Nguyễn Văn A" />
                </Field>
                <Field label="SĐT / Zalo *" error={errors.sdt}>
                  <input value={sdt} onChange={(e) => setSdt(e.target.value)} placeholder="085 9955 969" inputMode="tel" />
                </Field>
              </div>
              <div className="popup-form-row">
                <Field label="Email">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@gmail.com" type="email" />
                </Field>
                <Field label="Địa chỉ *" error={errors.diaChi}>
                  <input value={diaChi} onChange={(e) => setDiaChi(e.target.value)} placeholder="Số nhà, phường, quận..." />
                </Field>
              </div>
              <MultiSelect label="Loại côn trùng" selected={bugs} toggle={(b) => toggleBug(bugs, setBugs, b)} />
              <div className="popup-form-row">
                <Field label="Diện tích (m²)">
                  <input value={dienTich} onChange={(e) => setDienTich(e.target.value)} placeholder="VD: 80" type="number" inputMode="numeric" />
                </Field>
                <Field label="Ghi chú">
                  <input value={moTa} onChange={(e) => setMoTa(e.target.value)} placeholder="Thời gian mong muốn..." />
                </Field>
              </div>
              <button className="popup-submit" onClick={goToStep3}>Tiếp tục</button>
            </div>
          ) : step === 2 && customerType === "org" ? (
            /* ── Step 2B: Organization ── */
            <div className="popup-step-content">
              <button className="popup-back" onClick={() => setStep(1)}><ArrowLeft size={16} /> Quay lại</button>
              <div className="popup-form-row">
                <Field label="Tên công ty *" error={errors.tenCty}>
                  <input value={tenCty} onChange={(e) => setTenCty(e.target.value)} placeholder="Công ty ABC" />
                </Field>
                <Field label="Người liên hệ *" error={errors.nguoiLienHe}>
                  <input value={nguoiLienHe} onChange={(e) => setNguoiLienHe(e.target.value)} placeholder="Nguyễn Văn A" />
                </Field>
              </div>
              <div className="popup-form-row">
                <Field label="SĐT / Zalo *" error={errors.sdtOrg}>
                  <input value={sdtOrg} onChange={(e) => setSdtOrg(e.target.value)} placeholder="085 9955 969" inputMode="tel" />
                </Field>
                <Field label="Email công ty">
                  <input value={emailCty} onChange={(e) => setEmailCty(e.target.value)} placeholder="info@company.com" type="email" />
                </Field>
              </div>
              <div className="popup-form-row">
                <Field label="Địa chỉ *" error={errors.diaChiCty}>
                  <input value={diaChiCty} onChange={(e) => setDiaChiCty(e.target.value)} placeholder="Số nhà, phường, quận..." />
                </Field>
                <Field label="Loại hình">
                  <select value={loaiHinh} onChange={(e) => setLoaiHinh(e.target.value)}>
                    <option value="">— Chọn —</option>
                    <option>Doanh nghiệp / Khu công nghiệp</option>
                    <option>Khu chung cư / Văn phòng / Trường học</option>
                    <option>Trang trại</option>
                  </select>
                </Field>
              </div>
              <MultiSelect label="Loại côn trùng" selected={bugsOrg} toggle={(b) => toggleBug(bugsOrg, setBugsOrg, b)} />
              <div className="popup-form-row">
                <Field label="Diện tích (m²)">
                  <input value={dienTichOrg} onChange={(e) => setDienTichOrg(e.target.value)} placeholder="VD: 500" type="number" inputMode="numeric" />
                </Field>
                <Field label="Số chi nhánh">
                  <input value={soChiNhanh} onChange={(e) => setSoChiNhanh(e.target.value)} placeholder="1" type="number" inputMode="numeric" />
                </Field>
              </div>
              <div className="popup-form-row">
                <Field label="Nhu cầu">
                  <select value={nhuCau} onChange={(e) => setNhuCau(e.target.value)}>
                    <option value="">— Chọn —</option>
                    <option>Xử lý 1 lần</option>
                    <option>Định kỳ hàng tháng</option>
                    <option>Định kỳ hàng quý</option>
                  </select>
                </Field>
                <Field label="Ghi chú">
                  <input value={moTaOrg} onChange={(e) => setMoTaOrg(e.target.value)} placeholder="Yêu cầu đặc biệt..." />
                </Field>
              </div>
              <button className="popup-submit" onClick={goToStep3}>Tiếp tục</button>
            </div>
          ) : (
            /* ── Step 3: Confirm ── */
            <div className="popup-step-content">
              <button className="popup-back" onClick={() => setStep(2)}><ArrowLeft size={16} /> Quay lại chỉnh sửa</button>
              <div className="popup-summary">
                <h4>Tóm tắt yêu cầu</h4>
                {customerType === "personal" ? (
                  <div className="popup-summary-grid">
                    <SummaryRow label="Loại khách" value="Cá nhân / Hộ gia đình" />
                    <SummaryRow label="Họ tên" value={tenKh} />
                    <SummaryRow label="SĐT / Zalo" value={sdt} />
                    {email && <SummaryRow label="Email" value={email} />}
                    <SummaryRow label="Địa chỉ" value={diaChi} />
                    {bugs.length > 0 && <SummaryRow label="Côn trùng" value={bugs.join(", ")} />}
                    {dienTich && <SummaryRow label="Diện tích" value={`${dienTich} m²`} />}
                    {moTa && <SummaryRow label="Ghi chú" value={moTa} />}
                  </div>
                ) : (
                  <div className="popup-summary-grid">
                    <SummaryRow label="Loại khách" value="Doanh nghiệp / Tổ chức" />
                    <SummaryRow label="Công ty" value={tenCty} />
                    <SummaryRow label="Người liên hệ" value={nguoiLienHe} />
                    <SummaryRow label="SĐT / Zalo" value={sdtOrg} />
                    {emailCty && <SummaryRow label="Email" value={emailCty} />}
                    <SummaryRow label="Địa chỉ" value={diaChiCty} />
                    {loaiHinh && <SummaryRow label="Loại hình" value={loaiHinh} />}
                    {bugsOrg.length > 0 && <SummaryRow label="Côn trùng" value={bugsOrg.join(", ")} />}
                    {dienTichOrg && <SummaryRow label="Diện tích" value={`${dienTichOrg} m²`} />}
                    {soChiNhanh && <SummaryRow label="Chi nhánh" value={soChiNhanh} />}
                    {nhuCau && <SummaryRow label="Nhu cầu" value={nhuCau} />}
                    {moTaOrg && <SummaryRow label="Ghi chú" value={moTaOrg} />}
                  </div>
                )}
              </div>
              {duplicateWarning && (
                <div style={{ background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: "#E65100" }}>
                  ⚠️ {duplicateWarning}
                </div>
              )}
              <button className="popup-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "ĐANG GỬI..." : duplicateWarning ? "VẪN GỬI YÊU CẦU MỚI" : "GỬI YÊU CẦU BÁO GIÁ"}
              </button>
              <p className="popup-note">Chuyên gia sẽ liên hệ bạn trong 30 phút</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="popup-field">
      <label>{label}</label>
      {children}
      {error && <span className="popup-error">{error}</span>}
    </div>
  );
}

function MultiSelect({ label, selected, toggle }: { label: string; selected: string[]; toggle: (b: string) => void }) {
  return (
    <div className="popup-field">
      <label>{label}</label>
      <div className="popup-bug-chips">
        {BUG_OPTIONS.map((bug) => (
          <button key={bug} type="button" className={`popup-chip ${selected.includes(bug) ? "active" : ""}`} onClick={() => toggle(bug)}>
            {selected.includes(bug) && <Check size={14} />}
            {bug}
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="popup-summary-row">
      <span className="popup-summary-label">{label}</span>
      <span className="popup-summary-value">{value}</span>
    </div>
  );
}
