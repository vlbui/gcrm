"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Đang đăng nhập...");

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const done = () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };

    // Implicit flow: Supabase auto-detects hash tokens
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        done();
        router.push("/admin");
        return;
      }

      // Listen for auth state change
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (cancelled) return;
        if (newSession) {
          done();
          router.push("/admin");
        }
      });
      unsubscribe = () => subscription.unsubscribe();

      // Timeout fallback — only fires if we haven't already resolved.
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        done();
        setStatus("Đăng nhập thất bại...");
        router.push("/login?error=timeout");
      }, 5000);
    });

    return done;
  }, [router]);

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
