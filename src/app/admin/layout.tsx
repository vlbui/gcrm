"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <Sidebar user={user} collapsed={collapsed} />
      <div className="admin-main">
        <Topbar
          user={user}
          onToggleSidebar={() => setCollapsed(!collapsed)}
          collapsed={collapsed}
        />
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
