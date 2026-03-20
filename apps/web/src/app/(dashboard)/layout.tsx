"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/stores/auth";

const navItems = [
  {
    href: "/programs",
    label: "Мудрость\nБерегини",
    icon: <img src="/images/druzhina.png" alt="Мудрость Берегини" className="w-8 h-8 object-contain" />,
  },
  {
    href: "/history",
    label: "Летопись\nСвершений",
    icon: <img src="/images/zabava.png" alt="Летопись Свершений" className="w-8 h-8 object-contain" />,
  },
  {
    href: "/progress",
    label: "Ведомость\nСилушки",
    icon: <img src="/images/sver.png" alt="Ведомость Силушки" className="w-8 h-8 object-contain" />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  return (
    <AuthGuard>
      <div className="min-h-screen pb-32" style={{ backgroundImage: "linear-gradient(rgba(17,18,16,0.75), rgba(17,18,16,0.75)), url('/images/fortress.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" }}>
        {/* Header — wooden beam style */}
        <header className="sticky top-0 z-10 border-b-2 border-[#8b2525]/30 pt-[env(safe-area-inset-top)]" style={{ backgroundImage: "linear-gradient(rgba(17,18,16,0.8), rgba(17,18,16,0.8)), url('/images/tree.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/images/bulava.png" alt="" className="w-12 h-12 object-contain rotate-90" />
              <h1 className="font-display text-lg font-bold text-[#d4bc8e] tracking-wide">
                Силушка Богатырская
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="text-[#b89a6a] hover:text-[#d4bc8e] transition-colors"
                title="Поддержать создателя"
                onClick={() => alert("Ссылка скоро появится!")}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>
              <button
                onClick={logout}
                className="text-[#b89a6a] hover:text-[#d4bc8e] transition-colors"
                title="Выйти"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 py-4">{children}</main>

        {/* Bottom nav — wooden plank style */}
        <nav className="fixed bottom-0 left-0 right-0 z-10 border-t-2 border-[#8b2525]/30" style={{ backgroundImage: "linear-gradient(rgba(17,18,16,0.85), rgba(17,18,16,0.85)), url('/images/tree.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
          {/* Instagram banner */}
          <a
            href="https://www.instagram.com/vetrovanadia_/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full px-4 py-2 text-center border-b border-[#3a3530]/30"
          >
            <p className="text-[#b89a6a] text-[10px] leading-tight">
              Загляни в Светлицу Берегини – Создательницы &quot;Силушки Богатырской&quot;
            </p>
          </a>
          <div className="max-w-lg mx-auto flex justify-around py-2">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                    active
                      ? "text-[#a83232]"
                      : "text-[#9b7a4a] hover:text-[#d4bc8e]"
                  }`}
                >
                  {item.icon}
                  <span className="text-[9px] font-medium text-center leading-tight whitespace-pre-line">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </AuthGuard>
  );
}
