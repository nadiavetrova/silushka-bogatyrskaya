"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [hydrate]);

  return <>{children}</>;
}
