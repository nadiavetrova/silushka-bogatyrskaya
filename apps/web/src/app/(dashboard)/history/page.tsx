"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkoutStore } from "@/stores/workout";
import { WorkoutCard } from "@/components/WorkoutCard";

export default function HistoryPage() {
  const { workouts, loading, fetchWorkouts } = useWorkoutStore();

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  // Group workouts by month
  const grouped = workouts.reduce<Record<string, typeof workouts>>((acc, w) => {
    const d = new Date(w.date);
    const key = d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden mb-6 border border-[#7a5c35]/30">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/fortress.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1208]/90 via-[#1a1208]/70 to-transparent" />
        <div className="relative p-5">
          <p className="text-[#a83232] font-display text-lg drop-shadow">
            Летопись Свершений
          </p>
          <p className="text-[#d4bc8e] text-sm mt-1 drop-shadow">
            Все подвиги записаны здесь
          </p>
        </div>
      </div>

      {loading && workouts.length === 0 && (
        <div className="text-center text-[#9b7a4a] py-12">Загрузка...</div>
      )}

      {!loading && workouts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center" style={{ paddingTop: '10px', paddingBottom: '10px' }}
        >
          <img src="/images/svitok.png" alt="" className="w-40 h-40 mx-auto mb-4 object-contain" />
          <p className="text-[#b89a6a] font-display">Летопись пуста</p>
          <p className="text-[#9b7a4a] text-sm mt-2">
            Соверши свой первый подвиг!
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month} className="mb-6">
            <h3 className="font-display text-[#8b2525] text-sm uppercase tracking-wider mb-3 px-1">
              {month}
            </h3>
            <div className="space-y-3">
              {items.map((workout) => (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <WorkoutCard workout={workout} onDelete={fetchWorkouts} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
