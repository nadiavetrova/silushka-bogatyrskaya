"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Forest background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/forest-dawn.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#1a1208]/80 to-[#1a1208]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-6">
          <img src="/images/bulava.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain drop-shadow-lg" />
          <h1 className="font-display text-4xl font-bold text-[#d4bc8e] tracking-wide drop-shadow-lg">
            Силушка
          </h1>
          <p className="font-display text-[#d4bc8e] mt-1 text-2xl font-bold tracking-widest drop-shadow">
            Богатырская
          </p>
        </div>

        <div className="card-wood rounded-xl p-6 border-2 border-[#7a5c35]/50">
          <h2 className="font-display text-xl font-bold text-center text-[#e8dcc8] mb-4 tracking-wide">
            Кузня Тела
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#6b1a1a]/30 border border-[#a83232]/40 rounded-lg p-3 text-[#a83232] text-sm">
                {error}
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Грамота (эл. почта)"
              required
              className="w-full px-4 py-3 bg-[#151412] border-2 border-[#7a5c35]/50 rounded-xl text-[#e8dcc8] placeholder-[#9b7a4a] focus:outline-none focus:border-[#8b2525]/70 transition-colors"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Тайное слово"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-[#151412] border-2 border-[#7a5c35]/50 rounded-xl text-[#e8dcc8] placeholder-[#9b7a4a] focus:outline-none focus:border-[#8b2525]/70 transition-colors"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#d4bc8e] hover:bg-[#c4a87a] disabled:opacity-50 rounded-xl text-[#4a1010] font-display font-bold text-lg border-2 border-[#b89a6a] transition-all"
            >
              {loading ? "Ожидание..." : "Войти"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#7a5c35]/40" />
            <span className="text-[#8b2525] text-xs">&#x2726;</span>
            <div className="flex-1 h-px bg-[#7a5c35]/40" />
          </div>

          <p className="text-center text-[#9b7a4a] text-sm">
            Нет грамоты?{" "}
            <Link href="/register" className="text-[#d4bc8e] hover:text-[#a83232]">
              Скрепить Клятву
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
