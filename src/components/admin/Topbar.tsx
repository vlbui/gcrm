"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu, PanelLeftClose } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppUser } from "@/lib/api/auth.api";

interface TopbarProps {
  user: AppUser | null;
  onToggleSidebar: () => void;
  collapsed: boolean;
}

export default function Topbar({ user, onToggleSidebar, collapsed }: TopbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = user?.ho_ten
    ? user.ho_ten
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const roleLabel = user?.vai_tro ?? "Xem";

  return (
    <header className="admin-topbar">
      <button className="topbar-toggle" onClick={onToggleSidebar}>
        {collapsed ? <Menu size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <div className="topbar-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="topbar-user">
              <Avatar className="topbar-avatar">
                <AvatarImage src={user?.avatar_url ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user?.ho_ten ?? "..."}</span>
                <span className="topbar-user-role">{roleLabel}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
