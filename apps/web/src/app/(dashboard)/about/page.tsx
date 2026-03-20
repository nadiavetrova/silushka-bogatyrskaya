"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Tab = "about" | "agreement" | "privacy";

export default function AboutPage() {
  const [tab, setTab] = useState<Tab>("about");

  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: "О приложении" },
    { id: "agreement", label: "Соглашение" },
    { id: "privacy", label: "Конфиденциальность" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="relative rounded-xl overflow-hidden mb-6 border border-[#3a3530]/50">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/forest-dawn.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1208]/90 via-[#1a1208]/70 to-transparent" />
        <div className="relative p-5">
          <p className="text-[#a83232] font-display text-lg drop-shadow">Берестяная Грамота</p>
          <p className="text-[#d4bc8e] text-sm mt-1 drop-shadow">Правовые сведения</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all border ${
              tab === t.id
                ? "bg-[#3a1515] text-[#d4bc8e] border-[#8b2525]/40"
                : "bg-[#2a1f0f] text-[#b89a6a] border-[#3a3530]/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-wood rounded-xl p-4 border border-[#3a3530]/50 text-[#d4bc8e] text-xs leading-relaxed space-y-3"
      >
        {tab === "about" && <AboutContent />}
        {tab === "agreement" && <AgreementContent />}
        {tab === "privacy" && <PrivacyContent />}
      </motion.div>
    </div>
  );
}

function AboutContent() {
  return (
    <>
      <h3 className="text-[#a83232] font-display text-sm">О Приложении</h3>
      <p>Приложение &laquo;Силушка Богатырская&raquo; создано Ветровой Надеждой Валерьевной (Берегиней) в 2026 году, чтобы стать верным спутником на пути к физической силе и здоровью.</p>
      <p>Здесь ты найдёшь программу тренировок, инструменты для отслеживания прогресса и мудрые подсказки, что помогут шаг за шагом крепить тело и дух.</p>
      <p className="text-[#9b7a4a]">Возрастное ограничение: 16+</p>

      <h4 className="text-[#a83232] font-display text-xs mt-4">Связь с Берегиней</h4>
      <div className="space-y-1">
        <p>Эл. почта: <span className="text-[#b89a6a]">weterok18@mail.ru</span></p>
        <p>ВКонтакте: <a href="https://vk.com/wind.frontend" target="_blank" rel="noopener noreferrer" className="text-[#b89a6a] underline">vk.com/wind.frontend</a></p>
        <p>Telegram: <a href="https://t.me/nadiaWetrova" target="_blank" rel="noopener noreferrer" className="text-[#b89a6a] underline">@nadiaWetrova</a></p>
      </div>

      <p className="text-[#7a5c35]/60 text-[8px] mt-4">&copy; 2026 Ветрова Надежда Валерьевна (Берегиня). Все права защищены.</p>
    </>
  );
}

function AgreementContent() {
  return (
    <>
      <h3 className="text-[#a83232] font-display text-xs">Пользовательское соглашение</h3>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">1. Общие положения</h4>
      <p>1.1. Приложение предназначено для индивидуального использования в целях отслеживания тренировочного процесса и получения рекомендаций по физической активности.</p>
      <p>1.2. Начало использования Приложения означает полное принятие условий настоящего Соглашения.</p>
      <p>1.3. Приложение имеет возрастное ограничение 16+.</p>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">2. Функции Приложения</h4>
      <p>Доступ к программе тренировок, отслеживание прогресса, автоматические рекомендации по весу и повторениям, хранение истории тренировок, визуализация прогрессии.</p>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">3. Обязанности Пользователя</h4>
      <p>Использовать Приложение в личных целях. Соблюдать правила безопасности в зале. Обязательно проконсультироваться с врачом перед началом тренировок. Приложение не является заменой медицинской консультации.</p>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">4. Ограничение ответственности</h4>
      <p>Лицензиар не несёт ответственности за травмы, вред здоровью, полученный в результате использования Приложения, неправильного выполнения упражнений или отсутствия консультации с врачом.</p>
      <p>Приложение не является медицинской консультацией. Вся информация носит информационно-образовательный характер.</p>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">5. Разрешение споров</h4>
      <p>Споры разрешаются путём переговоров. В случае невозможности &mdash; в соответствии с законодательством РФ.</p>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">6. Контакты</h4>
      <p>Ветрова Надежда Валерьевна (Берегиня)</p>
      <p>weterok18@mail.ru</p>

      <p className="text-[#7a5c35]/60 text-[8px] mt-4">Дата последнего обновления: 21 марта 2026 г.</p>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <h3 className="text-[#a83232] font-display text-xs">Политика конфиденциальности</h3>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">1. Собираемые данные</h4>
      <p>Имя, адрес электронной почты, возраст, вес, рост, замеры частей тела, данные о тренировках (упражнения, рабочий вес, повторения, оценка сложности, дата).</p>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">2. Цели сбора</h4>
      <p>Отслеживание прогресса тренировок, предоставление рекомендаций, улучшение работы Приложения, связь с Пользователем.</p>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">3. Хранение и защита</h4>
      <p>Данные хранятся на защищённых серверах с применением мер шифрования. При удалении аккаунта все данные автоматически удаляются.</p>
      <p>Персональные данные не передаются третьим лицам, за исключением случаев, предусмотренных законодательством РФ.</p>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">4. Права Пользователя</h4>
      <p>Доступ к своим данным, внесение изменений, удаление аккаунта и всех данных, отзыв согласия на обработку.</p>

      <h4 className="text-[#b89a6a] font-display text-[10px] mt-2">5. Контакты</h4>
      <p>Ветрова Надежда Валерьевна (Берегиня)</p>
      <p>weterok18@mail.ru</p>

      <p className="text-[#7a5c35]/60 text-[8px] mt-4">Дата последнего обновления: 21 марта 2026 г.</p>
    </>
  );
}
