"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Đang đăng nhập...");

  useEffect(() => {
    const supabase = createClient();

    // Implicit flow: Supabase auto-detects hash tokens
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/admin");
        return;
      }

      // Listen for auth state change
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          subscription.unsubscribe();
          router.push("/admin");
        }
      });

      // Timeout fallback
      setTimeout(() => {
        setStatus("Đăng nhập thất bại...");
        router.push("/login?error=timeout");
      }, 5000);
    });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid #e0e0e0",
          borderTopColor: "#2E7D32",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
