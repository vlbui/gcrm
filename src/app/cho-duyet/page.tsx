"use client";

import { createClient } from "@/lib/supabase/client";
import { Clock, LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PendingApprovalPage() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleRetry = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: dbUser } = await supabase
      .from("users")
      .select("id, trang_thai")
      .eq("email", user.email)
      .single();

    if (dbUser?.trang_thai === "Hoạt động") {
      router.push("/admin");
    } else {
      alert("Tài khoản chưa được duyệt. Vui lòng liên hệ Admin.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo pending">
            <Clock size={32} />
          </div>
          <h1>Chờ cấp quyền</h1>
          <p>GreenShield CRM</p>
        </div>

        <div className="login-divider" />

        <div className="pending-message">
          <Shield size={20} />
          <p>
            Tài khoản của bạn đã được ghi nhận. Vui lòng chờ Admin cấp quyền
            truy cập hệ thống.
          </p>
        </div>

        <div className="pending-actions">
          <button onClick={handleRetry} className="login-google-btn">
            Kiểm tra lại
          </button>
          <button onClick={handleLogout} className="pending-logout-btn">
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
