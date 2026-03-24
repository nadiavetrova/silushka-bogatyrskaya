"use client";

import type { SetData } from "../lib/types";

interface Props {
  set: SetData;
  index: number;
  onUpdate: (data: Partial<SetData>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SetInput({ set, index, onUpdate, onRemove, canRemove }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#9b7a4a] w-6">{index + 1}</span>
      <div className="flex-1 flex gap-2">
        <div className="flex-1">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={set.weight || ""}
            onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || 0 })}
            placeholder="кг"
            className="w-full px-3 py-2 bg-[#151412] border border-[#7a5c35]/40 rounded-lg text-[#e8dcc8] text-sm focus:outline-none focus:border-[#8b2525]/60"
          />
        </div>
        <div className="w-16">
          <input
            type="number"
            value={set.reps || ""}
            onChange={(e) => onUpdate({ reps: parseInt(e.target.value) || 0 })}
            placeholder="повт"
            className="w-full px-3 py-2 bg-[#151412] border border-[#7a5c35]/40 rounded-lg text-[#e8dcc8] text-sm focus:outline-none focus:border-[#8b2525]/60"
          />
        </div>
      </div>
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-[#9b7a4a] hover:text-[#c54545] text-sm">
          &#x2715;
        </button>
      )}
    </div>
  );
}
