"use client";

import { motion } from "framer-motion";
import type { ExerciseData, SetData, Difficulty } from "@windgym/shared";
import { SetInput } from "./SetInput";
import { DifficultySelector } from "./DifficultySelector";

interface Props {
  exercise: ExerciseData;
  index: number;
  onAddSet: () => void;
  onUpdateSet: (setIndex: number, data: Partial<SetData>) => void;
  onRemoveSet: (setIndex: number) => void;
  onSetDifficulty: (d: Difficulty) => void;
  onRemove: () => void;
}

export function ExerciseCard({
  exercise, index, onAddSet, onUpdateSet, onRemoveSet, onSetDifficulty, onRemove,
}: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card-wood rounded-xl p-4 border border-[#7a5c35]/30"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#a83232] font-display font-semibold">{exercise.name}</h3>
        <button type="button" onClick={onRemove} className="text-[#9b7a4a] hover:text-[#c54545] text-sm">
          Убрать
        </button>
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2 text-xs text-[#9b7a4a]">
          <span className="w-6"></span>
          <span className="flex-1">Вес (кг)</span>
          <span className="w-16">Повт.</span>
          <span className="w-5"></span>
        </div>
        <div className="space-y-2">
          {exercise.sets.map((set, si) => (
            <SetInput
              key={si} set={set} index={si}
              onUpdate={(data) => onUpdateSet(si, data)}
              onRemove={() => onRemoveSet(si)}
              canRemove={exercise.sets.length > 1}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={onAddSet} className="text-[#8b2525] text-sm hover:text-[#a83232]">
          + Подход
        </button>
        <DifficultySelector value={exercise.difficulty} onChange={onSetDifficulty} />
      </div>
    </motion.div>
  );
}
