"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Warehouse,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/lib/api/auth.api";
import MobileMoreMenu from "./MobileMoreMenu";

const tabs = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Dashboard",
    exact: true,
  },
  {
    href: "/admin/khach-hang",
    icon: Users,
    label: "Khách hàng",
    exact: false,
  },
  {
    href: "/admin/hop-dong",
    icon: FileText,
    label: "Hợp đồng",
    exact: false,
  },
  {
    href: "/admin/kho",
    icon: Warehouse,
    label: "Kho",
    exact: false,
  },
];

interface Props {
  user: AppUser | null;
}

export default function MobileBottomNav({ user }: Props) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="mobile-bottom-nav">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "mobile-tab",
              isActive(tab.href, tab.exact) && "active"
            )}
          >
            <tab.icon size={22} />
            <span>{tab.label}</span>
          </Link>
        ))}
        <button
          className={cn("mobile-tab", moreOpen && "active")}
          onClick={() => setMoreOpen(true)}
        >
          <MoreHorizontal size={22} />
          <span>Thêm</span>
        </button>
      </nav>

      {moreOpen && (
        <MobileMoreMenu user={user} onClose={() => setMoreOpen(false)} />
      )}
    </>
  );
}
