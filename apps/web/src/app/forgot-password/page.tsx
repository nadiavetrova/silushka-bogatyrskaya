"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

type Step = "email" | "code" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  // Cooldown timer
  useState(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.forgotPassword({ email });
      setStep("code");
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Тайные слова не совпадают");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({ email, code, newPassword });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неверный код");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await api.forgotPassword({ email });
      setCooldown(60);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/forest-dawn.png')" }} />
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

          {step === "email" && (
            <>
              <h2 className="font-display text-lg font-semibold text-center text-[#a83232] mb-2">
                Восстановление доступа
              </h2>
              <p className="text-[#9b7a4a] text-sm text-center mb-6">
                Укажи свою грамоту (эл. почту), и мы отправим тебе код
              </p>

              <form onSubmit={handleSendCode} className="space-y-4">
                {error && (
                  <div className="bg-[#6b1a1a]/30 border border-[#a83232]/40 rounded-lg p-3 text-[#a83232] text-sm">{error}</div>
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Грамота (эл. почта)"
                  required
                  className="w-full px-4 py-3 bg-[#151412] border-2 border-[#7a5c35]/50 rounded-xl text-[#e8dcc8] placeholder-[#9b7a4a] focus:outline-none focus:border-[#8b2525]/70 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#d4bc8e] hover:bg-[#c4a87a] disabled:opacity-50 rounded-xl text-[#4a1010] font-display font-bold text-lg border-2 border-[#b89a6a] transition-all"
                >
                  {loading ? "Отправляю..." : "Отправить код"}
                </button>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <h2 className="font-display text-lg font-semibold text-center text-[#a83232] mb-2">
                Новое тайное слово
              </h2>
              <p className="text-[#9b7a4a] text-sm text-center mb-6">
                Введи код с почты и новое тайное слово
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                {error && (
                  <div className="bg-[#6b1a1a]/30 border border-[#a83232]/40 rounded-lg p-3 text-[#a83232] text-sm">{error}</div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-4 bg-[#151412] border-2 border-[#7a5c35]/50 rounded-xl text-[#d4bc8e] text-center text-3xl font-bold tracking-[0.5em] placeholder-[#7a5c35]/30 focus:outline-none focus:border-[#8b2525]/70 transition-colors"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Новое тайное слово"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-[#151412] border-2 border-[#7a5c35]/50 rounded-xl text-[#e8dcc8] placeholder-[#9b7a4a] focus:outline-none focus:border-[#8b2525]/70 transition-colors"
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Повтори тайное слово"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-[#151412] border-2 border-[#7a5c35]/50 rounded-xl text-[#e8dcc8] placeholder-[#9b7a4a] focus:outline-none focus:border-[#8b2525]/70 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 bg-[#d4bc8e] hover:bg-[#c4a87a] disabled:opacity-50 rounded-xl text-[#4a1010] font-display font-bold text-lg border-2 border-[#b89a6a] transition-all"
                >
                  {loading ? "Сохраняю..." : "Сохранить"}
                </button>
              </form>

              <p className="text-center mt-3">
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="text-[#d4bc8e] hover:text-[#a83232] text-sm disabled:text-[#7a5c35]/50 disabled:cursor-not-allowed transition-colors"
                >
                  {cooldown > 0 ? `Отправить заново (${cooldown}с)` : "Отправить код заново"}
                </button>
              </p>
            </>
          )}

          {step === "done" && (
            <>
              <div className="text-center py-4">
                <p className="text-[#5ea352] text-4xl mb-3">✓</p>
                <h2 className="font-display text-lg font-semibold text-[#d4bc8e] mb-2">
                  Тайное слово обновлено!
                </h2>
                <p className="text-[#9b7a4a] text-sm mb-6">
                  Теперь можешь войти с новым тайным словом
                </p>
                <button
                  onClick={() => router.replace("/login")}
                  className="w-full py-3 bg-[#d4bc8e] hover:bg-[#c4a87a] rounded-xl text-[#4a1010] font-display font-bold text-lg border-2 border-[#b89a6a] transition-all"
                >
                  Войти
                </button>
              </div>
            </>
          )}

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#7a5c35]/40" />
            <span className="text-[#8b2525] text-xs">&#x2726;</span>
            <div className="flex-1 h-px bg-[#7a5c35]/40" />
          </div>

          <p className="text-center text-[#9b7a4a] text-sm">
            <Link href="/login" className="text-[#d4bc8e] hover:text-[#a83232]">
              Вернуться ко входу
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
