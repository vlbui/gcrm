"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  ClipboardList,
  CalendarDays,
  CreditCard,
  Truck,
  Wrench,
  Globe,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/lib/api/auth.api";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const moreLinks = [
  { href: "/admin/yeu-cau", icon: MessageSquare, label: "Yêu cầu" },
  { href: "/admin/lich-su-dich-vu", icon: ClipboardList, label: "Lịch sử DV" },
  { href: "/admin/lich-cong-viec", icon: CalendarDays, label: "Lịch công tác" },
  { href: "/admin/thanh-toan", icon: CreditCard, label: "Thanh toán" },
  { href: "/admin/nha-cung-cap", icon: Truck, label: "Nhà cung cấp" },
  { href: "/admin/ky-thuat-vien", icon: Wrench, label: "Kỹ thuật viên" },
  { href: "/admin/cms", icon: Globe, label: "Website" },
];

interface Props {
  user: AppUser | null;
  onClose: () => void;
}

export default function MobileMoreMenu({ user, onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const initials = user?.ho_ten
    ? user.ho_ten
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="mobile-more-overlay" onClick={onClose}>
      <div
        className="mobile-more-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-more-handle" />

        <div className="mobile-more-user">
          <Avatar className="mobile-more-avatar">
            <AvatarImage src={user?.avatar_url ?? undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="mobile-more-user-name">
              {user?.ho_ten ?? "..."}
            </div>
            <div className="mobile-more-user-role">
              {user?.vai_tro ?? "Manager"}
            </div>
          </div>
        </div>

        <div className="mobile-more-grid">
          {moreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "mobile-more-item",
                pathname.startsWith(link.href) && "active"
              )}
              onClick={onClose}
            >
              <div className="mobile-more-icon">
                <link.icon size={22} />
              </div>
              <span>{link.label}</span>
            </Link>
          ))}
          {user?.vai_tro === "Admin" && (
            <Link
              href="/admin/nguoi-dung"
              className={cn(
                "mobile-more-item",
                pathname.startsWith("/admin/nguoi-dung") && "active"
              )}
              onClick={onClose}
            >
              <div className="mobile-more-icon">
                <Settings size={22} />
              </div>
              <span>Cài đặt</span>
            </Link>
          )}
        </div>

        <button className="mobile-more-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
