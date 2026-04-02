"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  History,
  FlaskConical,
  Package,
  UserCog,
  MessageSquare,
  Globe,
  ChevronDown,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/lib/api/auth.api";

interface SidebarProps {
  user: AppUser | null;
  collapsed: boolean;
}

const crmLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/admin/yeu-cau", icon: MessageSquare, label: "Yêu cầu" },
  { href: "/admin/khach-hang", icon: Users, label: "Khách hàng" },
  { href: "/admin/hop-dong", icon: FileText, label: "Hợp đồng" },
  { href: "/admin/lich-su-dich-vu", icon: History, label: "Lịch sử dịch vụ" },
  { href: "/admin/hoa-chat", icon: FlaskConical, label: "Hóa chất" },
  { href: "/admin/vat-tu", icon: Package, label: "Vật tư" },
];

const cmsLinks = [
  { href: "/admin/cms/hero", label: "Hero Banner" },
  { href: "/admin/cms/services", label: "Dịch vụ" },
  { href: "/admin/cms/pricing", label: "Bảng giá" },
  { href: "/admin/cms/faq", label: "FAQ" },
  { href: "/admin/cms/testimonials", label: "Đánh giá" },
  { href: "/admin/cms/blog", label: "Bài viết" },
  { href: "/admin/cms/company", label: "Thông tin công ty" },
  { href: "/admin/cms/certificates", label: "Chứng nhận" },
  { href: "/admin/cms/media", label: "Media" },
];

export default function Sidebar({ user, collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [cmsOpen, setCmsOpen] = useState(pathname.startsWith("/admin/cms"));

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn("admin-sidebar", collapsed && "collapsed")}>
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Shield size={24} />
        </div>
        {!collapsed && (
          <div>
            <div className="sidebar-brand-name">Lá Chắn Xanh</div>
            <div className="sidebar-brand-sub">GreenShield CRM</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">{!collapsed && "CRM"}</div>
        {crmLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn("sidebar-link", isActive(link.href) && "active")}
            title={collapsed ? link.label : undefined}
          >
            <link.icon size={20} />
            {!collapsed && <span>{link.label}</span>}
          </Link>
        ))}

        {user?.vai_tro === "Admin" && (
          <Link
            href="/admin/nguoi-dung"
            className={cn(
              "sidebar-link",
              isActive("/admin/nguoi-dung") && "active"
            )}
            title={collapsed ? "Người dùng" : undefined}
          >
            <UserCog size={20} />
            {!collapsed && <span>Người dùng</span>}
          </Link>
        )}

        <div className="sidebar-divider" />

        <button
          className="sidebar-link sidebar-cms-toggle"
          onClick={() => setCmsOpen(!cmsOpen)}
        >
          <Globe size={20} />
          {!collapsed && (
            <>
              <span>CMS Website</span>
              <ChevronDown
                size={16}
                className={cn("sidebar-chevron", cmsOpen && "open")}
              />
            </>
          )}
        </button>

        {cmsOpen && !collapsed && (
          <div className="sidebar-cms-links">
            {cmsLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "sidebar-link sub",
                  isActive(link.href) && "active"
                )}
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}
