"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { user, emailVerified, verifyEmail, resendCode, hydrated, token } = useAuthStore();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/register");
    }
  }, [hydrated, token, router]);

  useEffect(() => {
    if (hydrated && emailVerified) {
      router.replace("/welcome");
    }
  }, [hydrated, emailVerified, router]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Введи 6-значный код");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyEmail(code);
      router.replace("/welcome");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неверный код");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendCode();
      setCooldown(60);
      setResent(true);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    }
  };

  if (!hydrated || !token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/river-mist.png')" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#1a1208]/80 to-[#1a1208]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-6">
          <img src="/images/bulava.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain drop-shadow-lg" />
          <h1 className="font-display text-4xl font-bold text-[#d4bc8e] tracking-wide drop-shadow-lg">Силушка</h1>
          <p className="text-[#d4bc8e] mt-1 text-base italic drop-shadow">Богатырская</p>
        </div>

        <div className="card-wood rounded-xl p-6 border-2 border-[#7a5c35]/50">
          <h2 className="font-display text-lg font-semibold text-center text-[#a83232] mb-2">
            Подтверди Грамоту
          </h2>
          <p className="text-[#9b7a4a] text-sm text-center mb-6">
            Мы отправили тайный код на твою почту.{" "}
            {user?.email && <span className="text-[#d4bc8e]">{user.email}</span>}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#6b1a1a]/30 border border-[#a83232]/40 rounded-lg p-3 text-[#a83232] text-sm">
                {error}
              </div>
            )}

            {resent && !error && (
              <div className="bg-[#1a3a1a]/30 border border-[#5ea352]/40 rounded-lg p-3 text-[#5ea352] text-sm">
                Новый код отправлен!
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
              }}
              placeholder="000000"
              className="w-full px-4 py-4 bg-[#151412] border-2 border-[#7a5c35]/50 rounded-xl text-[#d4bc8e] text-center text-3xl font-bold tracking-[0.5em] placeholder-[#7a5c35]/30 focus:outline-none focus:border-[#8b2525]/70 transition-colors"
            />

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-[#d4bc8e] hover:bg-[#c4a87a] disabled:opacity-50 rounded-xl text-[#4a1010] font-display font-bold text-lg border-2 border-[#b89a6a] transition-all"
            >
              {loading ? "Проверяю..." : "Подтвердить"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#7a5c35]/40" />
            <span className="text-[#8b2525] text-xs">&#x2726;</span>
            <div className="flex-1 h-px bg-[#7a5c35]/40" />
          </div>

          <p className="text-center">
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className="text-[#d4bc8e] hover:text-[#a83232] text-sm disabled:text-[#7a5c35]/50 disabled:cursor-not-allowed transition-colors"
            >
              {cooldown > 0
                ? `Отправить заново (${cooldown}с)`
                : "Отправить код заново"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
