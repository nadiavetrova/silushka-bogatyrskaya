"use client";

import { motion } from "framer-motion";
import type { Difficulty } from "../lib/types";

const options: { value: Difficulty; label: string; color: string; bg: string }[] = [
  { value: "easy", label: "Легко", color: "text-[#5ea352]", bg: "bg-[#3a6b32]" },
  { value: "medium", label: "Средне", color: "text-[#d4bc8e]", bg: "bg-[#8b2525]" },
  { value: "hard", label: "Тяжко", color: "text-[#c54545]", bg: "bg-[#8b2525]" },
];

interface Props {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}

export function DifficultySelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="relative px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
        >
          {value === opt.value && (
            <motion.div
              layoutId="difficulty"
              className={`absolute inset-0 rounded-full ${opt.bg} opacity-20`}
              transition={{ type: "spring", duration: 0.3 }}
            />
          )}
          <span className={value === opt.value ? opt.color : "text-[#9b7a4a]"}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}
