"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, type AppUser } from "@/lib/api/auth.api";

export function useCurrentUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
