"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const emailVerified = useAuthStore((s) => s.emailVerified);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    } else if (hydrated && token && !emailVerified) {
      router.replace("/verify");
    }
  }, [hydrated, token, emailVerified, router]);

  if (!hydrated || !token || !emailVerified) return null;

  return <>{children}</>;
}
