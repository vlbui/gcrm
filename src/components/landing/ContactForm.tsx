"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate } from "@/lib/utils/date";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { sanitizePhone, sanitizeEmail } from "@/lib/utils/sanitize";

const contactSchema = z.object({
  ten_kh: z.string().min(1, "Vui lòng nhập họ tên"),
  sdt: z.string().min(8, "Vui lòng nhập số điện thoại hợp lệ"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  dia_chi: z.string().optional(),
  loai_hinh: z.string().optional(),
  loai_con_trung: z.string().optional(),
  dien_tich: z.string().optional(),
  mo_ta: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true);
    setDuplicateWarning("");
    try {
      const supabase = createClient();
      const phone = sanitizePhone(data.sdt);
      const emailVal = data.email ? sanitizeEmail(data.email) : null;

      // Check duplicate by phone
      const { data: existing } = await supabase
        .from("service_requests")
        .select("ma_yc, ten_kh, created_at")
        .eq("sdt", phone)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existing && existing.length > 0 && !duplicateWarning) {
        const date = formatDate(existing[0].created_at);
        setDuplicateWarning(
          `SĐT này đã gửi yêu cầu ${existing[0].ma_yc} (${existing[0].ten_kh}) ngày ${date}. Nhấn "Gửi" lần nữa nếu vẫn muốn tạo yêu cầu mới.`
        );
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("service_requests").insert({
        ten_kh: data.ten_kh.trim(),
        sdt: phone,
        email: emailVal || null,
        dia_chi: data.dia_chi?.trim() || null,
        loai_hinh: data.loai_hinh || "Cá nhân / Hộ gia đình",
        loai_con_trung: data.loai_con_trung || null,
        dien_tich: data.dien_tich ? Number(data.dien_tich) : null,
        mo_ta: data.mo_ta?.trim() || null,
      });

      if (error) throw error;

      toast.success("Gửi yêu cầu thành công! Chúng tôi sẽ liên hệ bạn trong 30 phút.");
      setDuplicateWarning("");
      reset();
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại hoặc gọi trực tiếp 085 9955 969.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="contact-form-card" onSubmit={handleSubmit(onSubmit)}>
      <h3>Gửi yêu cầu tư vấn</h3>
      <p className="form-subtitle">Chúng tôi sẽ phản hồi trong 30 phút</p>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Họ tên *</label>
          <input
            type="text"
            className="form-input"
            placeholder="Nguyễn Văn A"
            {...register("ten_kh")}
          />
          {errors.ten_kh && <span className="form-error">{errors.ten_kh.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Số điện thoại / Zalo *</label>
          <input
            type="tel"
            className="form-input"
            placeholder="085 9955 969"
            inputMode="tel"
            {...register("sdt")}
          />
          {errors.sdt && <span className="form-error">{errors.sdt.message}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            placeholder="email@example.com"
            {...register("email")}
          />
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Địa chỉ</label>
          <input
            type="text"
            className="form-input"
            placeholder="Số nhà, đường, phường, quận..."
            {...register("dia_chi")}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Loại hình cần bảo vệ</label>
        <select className="form-select" {...register("loai_hinh")}>
          <option value="">— Chọn loại hình —</option>
          <option>Cá nhân / Hộ gia đình</option>
          <option>Doanh nghiệp / Khu công nghiệp</option>
          <option>Khu chung cư / Văn phòng / Trường học</option>
          <option>Trang trại</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Vấn đề đang gặp</label>
        <select className="form-select" {...register("loai_con_trung")}>
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

      <div className="form-group">
        <label className="form-label">Diện tích ước tính (m²)</label>
        <input
          type="number"
          className="form-input"
          placeholder="VD: 80"
          inputMode="numeric"
          {...register("dien_tich")}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Ghi chú thêm</label>
        <textarea
          className="form-textarea"
          placeholder="Mô tả tình trạng, thời gian mong muốn xử lý..."
          {...register("mo_ta")}
        />
      </div>

      {duplicateWarning && (
        <div className="form-warning" style={{ background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: "#E65100" }}>
          ⚠️ {duplicateWarning}
        </div>
      )}

      <button type="submit" className="form-submit" disabled={submitting}>
        {submitting ? "ĐANG GỬI..." : "GỬI YÊU CẦU & NHẬN TƯ VẤN NGAY"}
      </button>
      <p className="form-note">🔒 Thông tin của bạn được bảo mật hoàn toàn</p>
    </form>
  );
}
