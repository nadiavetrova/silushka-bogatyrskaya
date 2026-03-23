"use client";

import React from "react";
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
  {
    href: "/achievements",
    label: "Палата\nСлавы",
    icon: <img src="/images/chernomor.png" alt="Палата Славы" className="w-8 h-8 object-contain" />,
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
            <div className="flex items-center gap-5">
              <Link
                href="/profile"
                className="hover:opacity-80 transition-opacity"
                title="Личная Грамота"
              >
                <img src="/images/kabinet.png" alt="Личный кабинет" className="w-8 h-8 object-contain" />
              </Link>
              <button
                onClick={logout}
                className="hover:opacity-80 transition-opacity"
                title="Выйти"
              >
                <img src="/images/exit.png" alt="Выйти" className="w-14 h-14 object-contain" />
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
            className="flex items-center justify-center gap-2 w-full px-3 py-1.5 border-b border-[#3a3530]/30"
          >
            <div className="text-center">
              <p className="text-[#b89a6a] text-[10px] leading-tight">
                Загляни в Светлицу Берегини – Создательницы &quot;Силушки Богатырской&quot;
              </p>
              <p className="text-[#7a5c35]/50 text-[7px] mt-0.5">*Meta признана экстремистской организацией и запрещена на территории РФ</p>
            </div>
            <svg className="w-2.5 h-2.5 text-[#b89a6a] flex-shrink-0 -mt-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <div className="max-w-lg mx-auto flex justify-around py-2 items-end">
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
