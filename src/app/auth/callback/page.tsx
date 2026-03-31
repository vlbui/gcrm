"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Đang đăng nhập...");

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient();

      // Check URL hash for implicit flow tokens
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        const { data, error } = await supabase.auth.getSession();
        if (data.session) {
          router.push("/admin");
          return;
        }
        // Wait for Supabase to process hash
        await new Promise((r) => setTimeout(r, 1000));
        const { data: retry } = await supabase.auth.getSession();
        if (retry.session) {
          router.push("/admin");
          return;
        }
      }

      // Check URL params for PKCE code
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.push("/admin");
          return;
        }
        console.error("Exchange error:", error);
      }

      // Final check - maybe session already exists
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/admin");
        return;
      }

      setStatus("Đăng nhập thất bại. Đang chuyển hướng...");
      setTimeout(() => router.push("/login?error=auth_failed"), 2000);
    };

    handleAuth();
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: "16px" }}>
      <div style={{ width: "40px", height: "40px", border: "3px solid #e0e0e0", borderTopColor: "#2E7D32", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}