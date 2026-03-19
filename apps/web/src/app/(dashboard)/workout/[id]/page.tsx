"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { WorkoutData } from "../../../../lib/types";
import { api } from "@/lib/api";

const difficultyLabels: Record<string, string> = {
  easy: "легко", medium: "средне", hard: "тяжко",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-[#3a6b32]/30 text-[#5ea352]",
  medium: "bg-[#8b2525]/20 text-[#d4bc8e]",
  hard: "bg-[#8b2525]/30 text-[#c54545]",
};

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkout(id).then(setWorkout).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center text-[#9b7a4a] py-12">Загрузка...</div>;
  if (!workout) return <div className="text-center text-[#9b7a4a] py-12">Подвиг не найден</div>;

  const date = new Date(workout.date).toLocaleDateString("ru-RU", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div>
      <Link href="/dashboard" className="text-[#b89a6a] hover:text-[#d4bc8e] text-sm mb-4 inline-block">
        &#x2190; Назад к Богатырю
      </Link>

      <h2 className="font-display text-xl font-bold text-[#d4bc8e] mb-1">Подвиг</h2>
      <p className="text-[#b89a6a] text-sm mb-6">{date}</p>

      <div className="space-y-4">
        {workout.exercises.map((exercise, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-wood rounded-xl p-4 border border-[#7a5c35]/30"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#a83232] font-display font-semibold">{exercise.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[exercise.difficulty] || ""}`}>
                {difficultyLabels[exercise.difficulty] || exercise.difficulty}
              </span>
            </div>
            <div className="space-y-1">
              {exercise.sets.map((set, si) => (
                <div key={si} className="flex items-center gap-3 text-sm text-[#d4bc8e]">
                  <span className="text-[#9b7a4a] w-6">{si + 1}</span>
                  <span>{set.weight} кг</span>
                  <span className="text-[#9b7a4a]">x</span>
                  <span>{set.reps} повт.</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
