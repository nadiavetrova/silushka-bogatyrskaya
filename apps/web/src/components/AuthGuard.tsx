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

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#111210" }}>
        <div className="flex flex-col items-center gap-3">
          <img src="/images/bulava.png" alt="" className="w-16 h-16 object-contain animate-pulse" />
          <p className="text-[#9b7a4a] text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!token || !emailVerified) return null;

  return <>{children}</>;
}
