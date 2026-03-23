"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useWorkoutStore } from "@/stores/workout";
import {
  computeAchievements,
  computeLevel,
  computeTotalTonnage,
  computeMaxStreak,
  getWorkoutDatesSet,
  getCalendarDays,
  markAllAsSeen,
  isAchievementNew,
  isLevelNew,
  LEVELS,
} from "@/lib/achievements";

function LevelIcon({ icon, className = "" }: { icon: string; className?: string }) {
  if (icon.startsWith("IMG:")) {
    return <img src={`/images/${icon.replace("IMG:", "")}.png`} alt="" className={`inline-block w-6 h-6 object-contain ${className}`} />;
  }
  return <span className={className}>{icon}</span>;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export default function AchievementsPage() {
  const { workouts, fetchWorkouts, loading } = useWorkoutStore();
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  if (loading && workouts.length === 0) {
    return <div className="text-center py-16 text-[#b89a6a]">Загрузка...</div>;
  }

  const levelData = computeLevel(workouts.length);
  const achievements = computeAchievements(workouts);
  const totalTonnage = computeTotalTonnage(workouts);
  const maxStreak = computeMaxStreak(workouts);
  const earnedCount = achievements.filter((a) => a.earned).length;
  const levelIsNew = isLevelNew(levelData.level.name);

  // Запоминаем какие достижения были новыми ДО markAllAsSeen (только один раз)
  const seenRef = useRef(false);
  const newAchievementIds = useMemo(() => {
    if (seenRef.current || loading) return new Set<string>();
    seenRef.current = true;
    return new Set(achievements.filter((a) => a.earned && isAchievementNew(a.id)).map((a) => a.id));
  }, [achievements, loading]);

  // Отмечаем все как просмотренные после рендера
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => markAllAsSeen(workouts), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, workouts]);

  // Calendar
  const workoutDates = getWorkoutDatesSet(workouts);
  const calDays = getCalendarDays(calYear, calMonth);
  const today = new Date().toISOString().split("T")[0];

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  return (
    <div>
      {/* Header */}
      <div className="relative rounded-xl overflow-hidden mb-6 border border-[#3a3530]/50">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/fortress.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1208]/90 via-[#1a1208]/70 to-transparent" />
        <div className="relative p-5">
          <p className="text-[#a83232] font-display text-lg drop-shadow">Палата Славы</p>
          <p className="text-[#d4bc8e] text-sm mt-1 drop-shadow flex items-center gap-1">
            <LevelIcon icon={levelData.level.icon} /> {levelData.level.name} • {earnedCount}/{achievements.length} достижений
          </p>
        </div>
      </div>

      {/* Level card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-wood rounded-xl p-5 border border-[#7a5c35]/30 mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[#9b7a4a] text-[10px]">Уровень Богатыря</p>
            <div className="flex items-center gap-2">
              <p className="text-[#d4bc8e] font-display text-xl flex items-center gap-1">
                <LevelIcon icon={levelData.level.icon} /> {levelData.level.name}
              </p>
              {levelIsNew && (
                <span className="text-[8px] font-bold bg-[#c54545] text-white px-2 py-0.5 rounded-full animate-pulse">
                  НОВЫЙ УРОВЕНЬ!
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#d4bc8e] text-2xl font-bold">{workouts.length}</p>
            <p className="text-[#9b7a4a] text-[10px]">тренировок</p>
          </div>
        </div>

        {/* Progress bar */}
        {levelData.nextLevel && (
          <div>
            <div className="flex justify-between text-[9px] text-[#9b7a4a] mb-1">
              <span>{levelData.level.name}</span>
              <span>{levelData.nextLevel.name}</span>
            </div>
            <div className="h-3 bg-[#1a1918]/80 rounded-full overflow-hidden border border-[#3a3530]/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelData.progress * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#8b2525] to-[#a83232] rounded-full"
              />
            </div>
            <p className="text-[#9b7a4a] text-[9px] mt-1 text-center">
              {levelData.nextLevel.minWorkouts - workouts.length} тренировок до уровня «{levelData.nextLevel.name}»
            </p>
          </div>
        )}

        {/* All levels preview */}
        <div className="flex justify-between mt-4 pt-3 border-t border-[#3a3530]/30">
          {LEVELS.map((l) => {
            const isCurrent = l.name === levelData.level.name;
            const isPast = workouts.length > l.maxWorkouts;
            return (
              <div
                key={l.name}
                className={`flex flex-col items-center gap-0.5 ${isCurrent ? "scale-110" : isPast ? "opacity-60" : "opacity-30"}`}
              >
                <LevelIcon icon={l.icon} className={`text-lg ${isCurrent ? "" : "grayscale"}`} />
                <span className={`text-[7px] ${isCurrent ? "text-[#d4bc8e] font-bold" : "text-[#9b7a4a]"}`}>
                  {l.name.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card-wood rounded-xl p-3 border border-[#3a3530]/50 text-center">
          <p className="text-[#d4bc8e] text-lg font-bold">{workouts.length}</p>
          <p className="text-[#9b7a4a] text-[9px]">Тренировок</p>
          <p className="text-[#7a5c35]/60 text-[7px] mt-1">Всего записанных тренировок</p>
        </div>
        <div className="card-wood rounded-xl p-3 border border-[#3a3530]/50 text-center">
          <p className="text-[#d4bc8e] text-lg font-bold">
            {totalTonnage >= 1000 ? `${(totalTonnage / 1000).toFixed(1)}т` : `${totalTonnage}кг`}
          </p>
          <p className="text-[#9b7a4a] text-[9px]">Тоннаж</p>
          <p className="text-[#7a5c35]/60 text-[7px] mt-1">Сумма всех поднятых килограммов (вес × повторения)</p>
        </div>
        <div className="card-wood rounded-xl p-3 border border-[#3a3530]/50 text-center">
          <p className="text-[#d4bc8e] text-lg font-bold">{maxStreak}</p>
          <p className="text-[#9b7a4a] text-[9px]">Макс. серия</p>
          <p className="text-[#7a5c35]/60 text-[7px] mt-1">Тренировок подряд без перерыва больше 3 дней</p>
        </div>
      </div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-wood rounded-xl p-4 border border-[#3a3530]/50 mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="text-[#9b7a4a] hover:text-[#d4bc8e] px-2 py-1 text-lg">‹</button>
          <p className="text-[#d4bc8e] font-display text-sm">{MONTH_NAMES[calMonth]} {calYear}</p>
          <button onClick={nextMonth} className="text-[#9b7a4a] hover:text-[#d4bc8e] px-2 py-1 text-lg">›</button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[#9b7a4a] text-[9px] font-medium">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calDays.map((d, i) => {
            const hasWorkout = workoutDates.has(d.date);
            const isToday = d.date === today;
            return (
              <div
                key={i}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs relative ${
                  !d.inMonth ? "opacity-20" : ""
                } ${
                  hasWorkout
                    ? "bg-[#3a6b32]/40 text-[#5ea352] font-bold border border-[#5ea352]/30"
                    : "text-[#9b7a4a]"
                } ${
                  isToday ? "ring-1 ring-[#a83232]" : ""
                }`}
              >
                {d.day}
                {hasWorkout && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#5ea352] rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-[#3a3530]/30">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#3a6b32]/40 border border-[#5ea352]/30" />
            <span className="text-[#9b7a4a] text-[9px]">Тренировка</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded ring-1 ring-[#a83232]" />
            <span className="text-[#9b7a4a] text-[9px]">Сегодня</span>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <h3 className="text-[#a83232] font-display text-sm mb-3">Достижения ({earnedCount}/{achievements.length})</h3>
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`card-wood rounded-xl p-3 border transition-all ${
              a.earned
                ? "border-[#b89a6a]/50 shadow-[0_0_12px_rgba(184,154,106,0.15)]"
                : "border-[#3a3530]/30 opacity-50"
            }`}
          >
            <div className="flex items-start gap-2">
              {a.icon.startsWith("IMG:") ? (
                <img src={`/images/${a.icon.replace("IMG:", "")}.png`} alt={a.name} className={`w-8 h-8 object-contain ${a.earned ? "" : "grayscale opacity-50"}`} />
              ) : (
                <span className={`text-2xl ${a.earned ? "" : "grayscale opacity-50"}`}>{a.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-bold ${a.earned ? "text-[#d4bc8e]" : "text-[#9b7a4a]"}`}>
                    {a.name}
                  </p>
                  {a.earned && newAchievementIds.has(a.id) && (
                    <span className="text-[7px] font-bold bg-[#c54545] text-white px-1.5 py-0.5 rounded-full animate-pulse">
                      НОВОЕ
                    </span>
                  )}
                </div>
                <p className="text-[#9b7a4a] text-[9px] mt-0.5">{a.description}</p>
              </div>
            </div>

            {/* Progress bar */}
            {a.progress && !a.earned && (
              <div className="mt-2">
                <div className="h-1.5 bg-[#1a1918]/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#9b7a4a]/50 rounded-full"
                    style={{ width: `${(a.progress.current / a.progress.target) * 100}%` }}
                  />
                </div>
                <p className="text-[#9b7a4a] text-[8px] mt-0.5 text-right">
                  {a.progress.current}/{a.progress.target}
                </p>
              </div>
            )}

            {a.earned && (
              <p className="text-[#5ea352] text-[8px] mt-1.5 font-medium">✓ Получено!</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
