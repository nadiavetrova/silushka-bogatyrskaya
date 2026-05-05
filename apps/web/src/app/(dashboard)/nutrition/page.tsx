"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import type { MealPlan } from "@/lib/types";

interface Message {
  role: "user" | "ai";
  text: string;
  id: string;
}

// Извлекаем КБЖУ из текста ответа ИИ
function extractNutrition(text: string) {
  const match = text.match(/📊\s*ИТОГО:\s*([\d.]+)\s*ккал\s*\|\s*Б:([\d.]+)г\s*\|\s*У:([\d.]+)г\s*\|\s*Ж:([\d.]+)г/);
  if (!match) return null;
  return {
    totalKcal: parseFloat(match[1]),
    protein: parseFloat(match[2]),
    carbs: parseFloat(match[3]),
    fat: parseFloat(match[4]),
  };
}

function todayStr() {
  const d = new Date();
  return `${d.getDate()} ${["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"][d.getMonth()]} ${d.getFullYear()}`;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const WELCOME = `Здрава будь, богатырша! 🌿

Я — Берегиня, твой помощник по питанию. Я вижу твои данные из профиля и рассчитаю твою норму КБЖУ сама.

С чего начнём?
• Напиши какие продукты есть дома — составлю меню на день с граммовками
• Или спроси что-нибудь о питании

Также можешь нажать одну из кнопок быстрого ответа ниже 👇`;

const QUICK_CHIPS = [
  "Составь меню на сегодня",
  "Что у меня за норма КБЖУ?",
  "Есть яйца, курица, гречка, творог",
  "Добавила перекус — кусочек сыра 30г",
  "Пересчитай план",
];

export default function NutritionPage() {
  const [tab, setTab] = useState<"chat" | "plans">("chat");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: WELCOME, id: "welcome" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [savedMsgIds, setSavedMsgIds] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const clearChat = () => {
    setMessages([{ role: "ai", text: WELCOME, id: "welcome" }]);
    setSavedMsgIds(new Set());
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const data = await api.getMealPlans();
      setPlans(data);
    } catch { /* silent */ } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "plans") loadPlans();
  }, [tab, loadPlans]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim(), id: Date.now().toString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const { reply } = await api.nutritionChat(
        newMessages.map((m) => ({ role: m.role, text: m.text }))
      );
      const aiMsg: Message = { role: "ai", text: reply, id: Date.now().toString() + "_ai" };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errText = err instanceof Error ? err.message : "Неизвестная ошибка";
      const errMsg: Message = {
        role: "ai",
        text: `Прости, что-то пошло не так 🙏\n\n⚠️ ${errText}`,
        id: Date.now().toString() + "_err",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (msg: Message) => {
    const nutrition = extractNutrition(msg.text);
    try {
      await api.saveMealPlan({
        title: `Меню на ${todayStr()}`,
        date: todayIso(),
        content: { text: msg.text },
        totalKcal: nutrition?.totalKcal ?? 0,
        protein: nutrition?.protein,
        carbs: nutrition?.carbs,
        fat: nutrition?.fat,
      });
      setSavedMsgIds((prev) => new Set([...prev, msg.id]));
    } catch {
      alert("Не удалось сохранить план");
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      await api.deleteMealPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      if (selectedPlan?.id === id) setSelectedPlan(null);
    } catch { /* silent */ }
  };

  const hasPlanData = (text: string) =>
    text.includes("📊 ИТОГО:") || (text.includes("ккал") && text.includes("Б:") && text.includes("завтрак") || text.includes("Завтрак") || text.includes("обед") || text.includes("Обед"));

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 140px)" }}>
      {/* Header */}
      <div className="relative rounded-xl overflow-hidden mb-4 border border-[#7a5c35]/30">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/fortress.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1208]/90 via-[#1a1208]/70 to-transparent" />
        <div className="relative p-4">
          <p className="text-[#a83232] font-display text-lg drop-shadow">Богатырская Трапеза</p>
          <p className="text-[#d4bc8e] text-xs mt-0.5 drop-shadow">🌿 Берегиня считает калории с помощью ИИ</p>
        </div>
      </div>

      {/* Tabs — sticky при скролле */}
      <div className="flex gap-1 mb-4 bg-[#1a1208]/90 rounded-xl p-1 border border-[#3a3530]/40 sticky top-14 z-10 backdrop-blur-sm">
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "chat" ? "bg-[#3b0a0a] text-[#e8dcc8]" : "text-[#9b7a4a] hover:text-[#d4bc8e]"}`}
        >
          <img src="/images/chat.png" alt="" className="w-7 h-7 object-contain" />
          Чат с Берегиней
        </button>
        <button
          onClick={() => setTab("plans")}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "plans" ? "bg-[#3b0a0a] text-[#e8dcc8]" : "text-[#9b7a4a] hover:text-[#d4bc8e]"}`}
        >
          <img src="/images/menu.png" alt="" className="w-7 h-7 object-contain" />
          Мои планы {plans.length > 0 && `(${plans.length})`}
        </button>
      </div>

      {/* ===== CHAT TAB ===== */}
      {tab === "chat" && (
        <div className="flex flex-col flex-1">
          {/* Clear chat button */}
          {messages.length > 1 && (
            <button
              onClick={clearChat}
              className="self-end mb-3 px-3 py-1.5 text-[10px] text-[#9b7a4a] border border-[#3a3530]/40 rounded-lg hover:text-[#a83232] hover:border-[#a83232]/30 transition-all"
            >
              🗑 Очистить историю
            </button>
          )}
          {/* Messages */}
          <div className="flex flex-col gap-4 mb-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 flex-shrink-0">
                  {msg.role === "ai"
                    ? <img src="/images/druzhina.png" alt="Берегиня" className="w-8 h-8 object-contain" />
                    : <img src="/images/wolf.png" alt="Я" className="w-8 h-8 object-contain" />
                  }
                </div>
                <div className={`flex-1 min-w-0 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "ai"
                        ? "card-wood border border-[#7a5c35]/30 rounded-tl-sm text-[#e8dcc8]"
                        : "bg-[#0d2010] border border-[#2a5a2a]/40 rounded-tr-sm text-[#d4e8d0] max-w-[85%]"
                    }`}
                  >
                    {msg.text}

                    {/* Кнопка сохранить — только для AI сообщений с планом */}
                    {msg.role === "ai" && hasPlanData(msg.text) && msg.id !== "welcome" && (
                      <button
                        onClick={() => handleSavePlan(msg)}
                        disabled={savedMsgIds.has(msg.id)}
                        className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold font-display transition-all border ${
                          savedMsgIds.has(msg.id)
                            ? "bg-[#1a4a1a]/60 border-[#5ea352]/40 text-[#5ea352]"
                            : "bg-gradient-to-r from-[#8b2525] to-[#a83232] border-[#8b2525]/50 text-[#e8dcc8] hover:opacity-90"
                        }`}
                      >
                        {savedMsgIds.has(msg.id) ? "✓ План сохранён в «Мои планы»" : "📋 Сохранить этот план"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {loading && (
              <div className="flex gap-2">
                <img src="/images/chat.png" alt="Берегиня" className="w-8 h-8 object-contain flex-shrink-0" />
                <div className="card-wood border border-[#7a5c35]/30 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 bg-[#9b7a4a] rounded-full"
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                    <span className="text-[#9b7a4a] text-xs ml-2">Берегиня думает...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Напиши Берегине..."
              rows={1}
              disabled={loading}
              className="flex-1 bg-[#151412] border-2 border-[#7a5c35]/40 rounded-2xl px-4 py-2.5 text-[#e8dcc8] text-sm placeholder-[#9b7a4a]/50 focus:outline-none focus:border-[#8b2525]/60 resize-none disabled:opacity-50"
              style={{ minHeight: "42px", maxHeight: "120px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-gradient-to-br from-[#8b2525] to-[#a83232] rounded-full flex items-center justify-center text-[#e8dcc8] text-lg flex-shrink-0 disabled:opacity-40 transition-all hover:scale-105"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* ===== PLANS TAB ===== */}
      {tab === "plans" && (
        <div>
          {selectedPlan ? (
            /* Plan detail view */
            <div>
              <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-1 text-[#9b7a4a] text-xs mb-4 hover:text-[#d4bc8e]">
                ‹ Назад к планам
              </button>

              <div className="card-wood rounded-xl p-4 border border-[#7a5c35]/30 mb-4">
                <p className="text-[#a83232] font-display text-base mb-1">{selectedPlan.title}</p>
                <p className="text-[#9b7a4a] text-xs mb-3">{new Date(selectedPlan.createdAt).toLocaleDateString("ru-RU")}</p>

                {selectedPlan.totalKcal > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { val: Math.round(selectedPlan.totalKcal), lbl: "ккал", color: "#d4bc8e" },
                      { val: selectedPlan.protein ? Math.round(selectedPlan.protein) + "г" : "—", lbl: "белки", color: "#5ea352" },
                      { val: selectedPlan.carbs ? Math.round(selectedPlan.carbs) + "г" : "—", lbl: "углев.", color: "#d4bc8e" },
                      { val: selectedPlan.fat ? Math.round(selectedPlan.fat) + "г" : "—", lbl: "жиры", color: "#b89a6a" },
                    ].map((s) => (
                      <div key={s.lbl} className="bg-[#1a1208]/60 rounded-xl p-2 text-center border border-[#3a3530]/40">
                        <p className="font-bold text-sm" style={{ color: s.color }}>{s.val}</p>
                        <p className="text-[9px] text-[#9b7a4a] mt-0.5">{s.lbl}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-sm text-[#d4bc8e] leading-relaxed whitespace-pre-wrap border-t border-[#3a3530]/40 pt-3">
                  {selectedPlan.content.text}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedPlan(null); setTab("chat"); setInput(`Хочу внести изменения в план "${selectedPlan.title}". Вот он:\n\n${selectedPlan.content.text}`); }}
                  className="flex-1 py-3 bg-gradient-to-r from-[#8b2525] to-[#a83232] rounded-xl text-[#e8dcc8] text-sm font-display font-bold border border-[#8b2525]/50"
                >
                  ✏️ Редактировать с ИИ
                </button>
                <button
                  onClick={() => handleDeletePlan(selectedPlan.id)}
                  className="px-4 py-3 bg-[#2a1208]/60 border border-[#3a3530]/40 rounded-xl text-[#9b7a4a] text-sm hover:border-[#a83232]/40 hover:text-[#a83232]"
                >
                  🗑
                </button>
              </div>
            </div>
          ) : (
            /* Plans list */
            <div>
              <button
                onClick={() => setTab("chat")}
                className="w-full py-3 mb-4 bg-gradient-to-r from-[#8b2525] to-[#a83232] rounded-xl text-[#e8dcc8] text-sm font-display font-bold border border-[#8b2525]/50"
              >
                ✦ Новый план с Берегиней
              </button>

              {plansLoading && (
                <div className="text-center py-8 text-[#9b7a4a] text-sm">Загрузка...</div>
              )}

              {!plansLoading && plans.length === 0 && (
                <div className="card-wood rounded-xl p-6 border border-[#3a3530]/40 text-center">
                  <p className="text-4xl mb-3">🍽️</p>
                  <p className="text-[#d4bc8e] font-display mb-1">Планов пока нет</p>
                  <p className="text-[#9b7a4a] text-xs">Попроси Берегиню составить меню в чате и сохрани его</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {plans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="card-wood rounded-xl border border-[#7a5c35]/30 overflow-hidden cursor-pointer hover:border-[#8b2525]/40 transition-all"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="p-4 flex items-start gap-3">
                        <div className="bg-[#8b2525]/20 border border-[#8b2525]/30 rounded-xl px-3 py-2 text-center flex-shrink-0">
                          <p className="text-[#d4bc8e] font-bold text-lg leading-none">
                            {new Date(plan.createdAt).getDate()}
                          </p>
                          <p className="text-[#9b7a4a] text-[9px] mt-0.5">
                            {["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"][new Date(plan.createdAt).getMonth()]}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#e8dcc8] font-semibold text-sm leading-tight">{plan.title}</p>
                          {plan.totalKcal > 0 && (
                            <p className="text-[#9b7a4a] text-xs mt-1">
                              {Math.round(plan.totalKcal)} ккал
                              {plan.protein ? ` · Б: ${Math.round(plan.protein)}г` : ""}
                              {plan.carbs ? ` · У: ${Math.round(plan.carbs)}г` : ""}
                              {plan.fat ? ` · Ж: ${Math.round(plan.fat)}г` : ""}
                            </p>
                          )}
                        </div>
                        <span className="text-[#9b7a4a] text-lg">›</span>
                      </div>
                      <div className="flex border-t border-[#3a3530]/40">
                        <button
                          className="flex-1 py-2 text-[11px] text-[#9b7a4a] hover:text-[#d4bc8e] hover:bg-[#2a1f0f]/50 transition-all"
                          onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan); }}
                        >
                          👁 Просмотр
                        </button>
                        <div className="w-px bg-[#3a3530]/40" />
                        <button
                          className="flex-1 py-2 text-[11px] text-[#a83232] hover:bg-[#2a1f0f]/50 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTab("chat");
                            setInput(`Хочу внести изменения в план "${plan.title}". Вот он:\n\n${plan.content.text}`);
                          }}
                        >
                          ✏️ Изменить с ИИ
                        </button>
                        <div className="w-px bg-[#3a3530]/40" />
                        <button
                          className="px-4 py-2 text-[11px] text-[#9b7a4a] hover:text-[#a83232] hover:bg-[#2a1f0f]/50 transition-all"
                          onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
                        >
                          🗑
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
