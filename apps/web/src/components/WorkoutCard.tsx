"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { WorkoutData } from "@windgym/shared";
import { api } from "@/lib/api";

const difficultyLabels: Record<string, string> = {
  easy: "легко",
  medium: "средне",
  hard: "тяжко",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-[#3a6b32]/30 text-[#5ea352]",
  medium: "bg-[#8b2525]/20 text-[#d4bc8e]",
  hard: "bg-[#8b2525]/30 text-[#c54545]",
};

interface Props {
  workout: WorkoutData;
  onDelete?: () => void;
}

export function WorkoutCard({ workout, onDelete }: Props) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const date = new Date(workout.date).toLocaleDateString("ru-RU", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!workout.id) return;
    setDeleting(true);
    try {
      await api.deleteWorkout(workout.id);
      onDelete?.();
    } catch {
      setDeleting(false);
    }
  };

  const toggleActions = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const handleCardClick = () => {
    if (!showActions) {
      router.push(`/workout/${workout.id}`);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      className="card-wood rounded-xl p-4 border border-[#7a5c35]/30 hover:border-[#8b2525]/30 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#b89a6a] text-sm">{date}</span>
        <div className="flex items-center gap-2">
          <span className="text-[#9b7a4a] text-xs">
            {workout.exercises.length} упр. &#x2022; {totalSets} подх.
          </span>
          <button
            onClick={toggleActions}
            className="text-[#9b7a4a] hover:text-[#d4bc8e] text-lg leading-none px-1"
          >
            &#x22EE;
          </button>
        </div>
      </div>

      {showActions && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => router.push(`/workout/${workout.id}`)}
            className="flex-1 py-1.5 text-xs bg-[#3a6b32]/20 text-[#5ea352] rounded-lg border border-[#3a6b32]/30 hover:bg-[#3a6b32]/30"
          >
            Открыть
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-1.5 text-xs bg-[#8b2525]/20 text-[#c54545] rounded-lg border border-[#8b2525]/30 hover:bg-[#8b2525]/30 disabled:opacity-50"
          >
            {deleting ? "..." : "Удалить"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {workout.exercises.map((e, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[#e8dcc8] text-sm">{e.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${difficultyColors[e.difficulty] || ""}`}>
              {difficultyLabels[e.difficulty] || e.difficulty}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
