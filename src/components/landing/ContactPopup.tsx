"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { X, Send, Shield } from "lucide-react";

/* ── Context to open popup from anywhere ── */
const PopupContext = createContext<{ open: () => void }>({ open: () => {} });
export const useContactPopup = () => useContext(PopupContext);

export function ContactPopupProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-contact-popup", handler);
    return () => window.removeEventListener("open-contact-popup", handler);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <PopupContext.Provider value={{ open }}>
      {children}
      {isOpen && <ContactPopupModal onClose={() => setIsOpen(false)} />}
    </PopupContext.Provider>
  );
}

/* ── CTA Button ── */
export function CTAButton({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`btn-cta btn-accent ${className}`}
      onClick={() => window.dispatchEvent(new Event("open-contact-popup"))}
    >
      {children ?? (
        <>
          <Send size={16} />
          Báo giá miễn phí
        </>
      )}
    </button>
  );
}

/* ── Schema ── */
const contactSchema = z.object({
  ten_kh: z.string().min(1, "Vui lòng nhập họ tên"),
  sdt: z.string().min(8, "Vui lòng nhập số điện thoại hợp lệ"),
  email: z.string().email("Email không hợp lệ").or(z.literal("")).optional(),
  loai_hinh: z.string().optional(),
  loai_con_trung: z.string().optional(),
  dien_tich: z.string().optional(),
  mo_ta: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

/* ── Modal ── */
function ContactPopupModal({ onClose }: { onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("service_requests").insert({
        ten_kh: data.ten_kh,
        sdt: data.sdt,
        email: data.email || null,
        loai_hinh: data.loai_hinh || null,
        loai_con_trung: data.loai_con_trung || null,
        dien_tich: data.dien_tich ? Number(data.dien_tich) : null,
        mo_ta: data.mo_ta || null,
      });

      if (error) throw error;
      setSuccess(true);
      toast.success("Gửi yêu cầu thành công!");
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng gọi trực tiếp 085 9955 969.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="popup-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="popup-modal">
        <button className="popup-close" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        <div className="popup-header">
          <div className="popup-header-icon">
            <Shield size={24} />
          </div>
          <h3>Nhận tư vấn &amp; báo giá miễn phí</h3>
          <p>Chuyên gia sẽ liên hệ bạn trong 30 phút</p>
        </div>

        {success ? (
          <div className="popup-success">
            <div className="popup-success-icon">&#10003;</div>
            <h4>Cảm ơn bạn!</h4>
            <p>Chúng tôi sẽ liên hệ trong 30 phút trong giờ hành chính.</p>
            <button className="popup-success-btn" onClick={onClose}>Đóng</button>
          </div>
        ) : (
          <form className="popup-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="popup-form-row">
              <div className="popup-field">
                <label>Họ tên *</label>
                <input type="text" placeholder="Nguyễn Văn A" {...register("ten_kh")} />
                {errors.ten_kh && <span className="popup-error">{errors.ten_kh.message}</span>}
              </div>
              <div className="popup-field">
                <label>Số điện thoại / Zalo *</label>
                <input type="tel" placeholder="085 9955 969" inputMode="tel" {...register("sdt")} />
                {errors.sdt && <span className="popup-error">{errors.sdt.message}</span>}
              </div>
            </div>

            <div className="popup-field">
              <label>Email</label>
              <input type="email" placeholder="email@gmail.com" {...register("email")} />
            </div>

            <div className="popup-form-row">
              <div className="popup-field">
                <label>Loại hình cần bảo vệ</label>
                <select {...register("loai_hinh")}>
                  <option value="">— Chọn loại hình —</option>
                  <option>Hộ gia đình (Căn hộ, Biệt thự)</option>
                  <option>Nhà hàng / Khách sạn</option>
                  <option>Văn phòng / Tòa nhà</option>
                  <option>Nhà máy / Kho bãi</option>
                  <option>Trường học / Bệnh viện</option>
                  <option>Khác</option>
                </select>
              </div>
              <div className="popup-field">
                <label>Vấn đề đang gặp</label>
                <select {...register("loai_con_trung")}>
                  <option value="">— Chọn loại dịch hại —</option>
                  <option>Gián</option>
                  <option>Chuột</option>
                  <option>Muỗi</option>
                  <option>Mối</option>
                  <option>Kiến</option>
                  <option>Ruồi</option>
                  <option>Nhiều loại / Không rõ</option>
                </select>
              </div>
            </div>

            <div className="popup-form-row">
              <div className="popup-field">
                <label>Diện tích (m&#178;)</label>
                <input type="number" placeholder="VD: 80" inputMode="numeric" {...register("dien_tich")} />
              </div>
              <div className="popup-field">
                <label>Ghi chú thêm</label>
                <input type="text" placeholder="Thời gian mong muốn..." {...register("mo_ta")} />
              </div>
            </div>

            <button type="submit" className="popup-submit" disabled={submitting}>
              {submitting ? "ĐANG GỬI..." : "GỬI YÊU CẦU & NHẬN TƯ VẤN NGAY"}
            </button>
            <p className="popup-note">Thông tin của bạn được bảo mật hoàn toàn</p>
          </form>
        )}
      </div>
    </div>
  );
}
