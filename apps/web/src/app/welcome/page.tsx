"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth";

const slides = [
  {
    id: 1,
    title: "Здрав будь, Богатырь",
    useNameInTitle: true,
    image: "/images/bear.png",
    text: `Приветствую тебя, богатырь, ступивший на Тропу Силы и Закалки! Пред тобою — "Силушка Богатырская", дивное приложенье, что станет верным соратником в пути твоем к могучей стати и богатырскому духу.

Создано оно Берегиней, дабы всяк, кто ищет силы, нашел её без блужданий.

Как же пользоваться сим дивным подспорьем? Внимай, и запомни!`,
    buttonText: "Далее",
  },
  {
    id: 2,
    title: "Мудрость Берегини",
    useNameInTitle: false,
    image: "/images/druzhina.png",
    text: `Здесь сокрыты наказы и уроки, что помогут тебе тело своё крепить. Коль не ведаешь, с чего начать, или нужен тебе верный путь — следуй деяниям Берегини.

Собраны здесь упражнения на три дня, дабы каждый мускул твой обрёл силу.

Определи Меру Силы Своей: в первый раз надобно тебе самому выбрать вес для каждого упражнения. Пусть будет он лёгок и посилен, дабы не повредить телу своему. Отметь, легко ли далось, средне ли было или тяжко.

Приложенье же, мудростью наделённое, само подскажет тебе, каков груз взять на следующую Сечу!`,
    buttonText: "Далее",
  },
  {
    id: 3,
    title: "Летопись Свершений",
    useNameInTitle: false,
    image: "/images/zabava.png",
    text: `Сия вкладка хранит все твои подвиги. Каждая Сеча, каждое преодоление будут записаны здесь, дабы ты мог узреть путь свой и гордиться трудами своими.

Можно открыть любую тренировку, посмотреть подробности и при необходимости подредактировать.`,
    buttonText: "Далее",
  },
  {
    id: 4,
    title: "Ведомость Силушки",
    useNameInTitle: false,
    image: "/images/sver.png",
    text: `Здесь, на дивном графике, сможешь ты зрить, как растёт мощь твоя, как крепнут мышцы и как легчает груз, что некогда казался неподъёмным.

Каждый столбик — то шаг твой к великой силе!`,
    buttonText: "Далее",
  },
  {
    id: 5,
    title: "В Добрый Час!",
    useNameInTitle: true,
    image: "/images/bear.png",
    text: `Коль захочешь познать Создательницу, или задать вопрос — жми на иконку Инстаграма в шапке. Там найдёшь её и сможешь слово своё молвить.

Помни! С "Силушкой Богатырской" ты не один на пути к своей могучей цели. Пусть каждый день приносит новую силу, а каждый шаг укрепляет дух!`,
    buttonText: "Начать Путь!",
  },
];

export default function WelcomePage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userName =
    user?.name ||
    (typeof window !== "undefined" ? localStorage.getItem("userName") : null) ||
    "Богатырь";

  const currentSlide = slides[step];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      router.replace("/programs");
    }
  };

  const title = currentSlide.useNameInTitle
    ? `${currentSlide.title}, ${userName}!`
    : currentSlide.title;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/forest-dawn.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#1a1208]/70 to-[#1a1208]" />

      <div className="w-full max-w-sm relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <motion.img
              src={currentSlide.image}
              alt=""
              className="w-28 h-28 mx-auto mb-4 object-contain drop-shadow-lg"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            />

            <h1 className="font-display text-2xl font-bold text-[#d4bc8e] mb-4 drop-shadow-lg">
              {title}
            </h1>

            <div className="card-wood rounded-xl p-5 border-2 border-[#7a5c35]/50 text-left mb-6 max-h-[50vh] overflow-y-auto">
              {currentSlide.text.split("\n\n").map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[#b89a6a] text-sm leading-relaxed mb-3 last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-4">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === step
                      ? "bg-[#a83232] w-4"
                      : i < step
                      ? "bg-[#7a5c35]"
                      : "bg-[#7a5c35]/30"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 bg-[#6b1a1a] hover:bg-[#7a2020] rounded-xl text-[#d4bc8e] font-display font-bold text-lg border-2 border-[#a83232]/40 transition-all"
            >
              {currentSlide.buttonText}
            </button>

            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="w-full mt-2 py-2 text-[#9b7a4a] text-sm hover:text-[#d4bc8e] transition-colors"
              >
                Назад
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
