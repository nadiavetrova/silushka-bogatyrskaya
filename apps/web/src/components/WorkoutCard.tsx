"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { WorkoutData } from "../lib/types";
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

// Определение типа тренировки по упражнениям
const CHEST_SHOULDERS = ["жим гантелей сидя", "отведение гантелей", "подъем гантелей перед собой", "тяга штанги к подбородку", "жим штанги", "жим гантелей лежа", "сведение рук", "жим штанги на наклонной", "разведение гантелей в стороны в наклоне"];
const BACK_BICEPS = ["тяга вертикального блока", "тяга горизонтального блока", "тяга штанги в наклоне", "пуловер", "подъем гантелей стоя", "сгибание рук"];
const LEGS_TRICEPS = ["приседания", "жим ногами", "выпады", "румынская тяга", "отведение ноги", "разгибание ног", "разгибание рук в верхнем блоке", "французский жим", "обратные отжимания"];

function detectWorkoutType(exercises: { name: string }[]): string {
  const names = exercises.map((e) => e.name.toLowerCase());

  let chestScore = 0;
  let backScore = 0;
  let legsScore = 0;

  for (const name of names) {
    if (CHEST_SHOULDERS.some((k) => name.includes(k))) chestScore++;
    if (BACK_BICEPS.some((k) => name.includes(k))) backScore++;
    if (LEGS_TRICEPS.some((k) => name.includes(k))) legsScore++;
  }

  if (legsScore >= chestScore && legsScore >= backScore && legsScore > 0) return "Ноги и Трицепс";
  if (chestScore >= backScore && chestScore > 0) return "Грудь и Плечи";
  if (backScore > 0) return "Спина и Бицепс";
  return "Тренировка";
}

interface Props {
  workout: WorkoutData;
  onDelete?: () => void;
}

export function WorkoutCard({ workout, onDelete }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const date = new Date(workout.date).toLocaleDateString("ru-RU", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const workoutType = detectWorkoutType(workout.exercises);

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

  const toggleExpand = () => {
    if (!showActions) setExpanded(!expanded);
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="card-wood rounded-xl p-4 border border-[#7a5c35]/30 hover:border-[#8b2525]/30 transition-all cursor-pointer"
    >
      {/* Header — always visible, clickable to expand */}
      <div className="flex items-center justify-between" onClick={toggleExpand}>
        <div className="flex items-center gap-2 flex-1">
          <svg className="w-3 h-3 text-[#9b7a4a] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><path d="M8 5v14l11-7z"/></svg>
          <div>
            <span className="text-[#b89a6a] text-sm">{date}</span>
            <span className="text-[#a83232] text-xs ml-2 font-medium">{workoutType}</span>
          </div>
        </div>
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

      {/* Actions */}
      {showActions && (
        <div className="flex gap-2 mt-3 mb-1">
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

      {/* Exercises — only when expanded */}
      {expanded && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#3a3530]/30">
          {workout.exercises.map((e, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-[#e8dcc8] text-sm">{e.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${difficultyColors[e.difficulty] || ""}`}>
                {difficultyLabels[e.difficulty] || e.difficulty}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
