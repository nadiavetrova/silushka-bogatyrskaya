"use client";

import { useRef, useState } from "react";
import type { WorkoutData } from "../lib/types";

const CHEST_SHOULDERS = ["жим гантелей сидя", "отведение гантелей", "подъем гантелей перед собой", "тяга штанги к подбородку", "жим штанги", "жим гантелей лежа", "сведение рук", "жим штанги на наклонной", "разведение гантелей в стороны в наклоне"];
const BACK_BICEPS = ["тяга вертикального блока", "тяга горизонтального блока", "тяга штанги в наклоне", "пуловер", "подъем гантелей стоя", "сгибание рук"];
const LEGS_TRICEPS = ["приседания", "жим ногами", "выпады", "румынская тяга", "отведение ноги", "разгибание ног", "разгибание рук в верхнем блоке", "французский жим", "обратные отжимания"];

function detectWorkoutType(exercises: { name: string }[]): string {
  const names = exercises.map((e) => e.name.toLowerCase());
  let chestScore = 0, backScore = 0, legsScore = 0;
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
  onClose: () => void;
}

export function ShareCard({ workout, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const date = new Date(workout.date).toLocaleDateString("ru-RU", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const workoutType = detectWorkoutType(workout.exercises);
  const totalSets = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const totalTonnage = workout.exercises.reduce((sum, e) =>
    sum + e.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0
  );

  const handleShare = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Try Web Share API (mobile)
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], "silushka-workout.png", { type: "image/png" });
          const shareData = { files: [file], title: "Силушка Богатырская" };
          if (navigator.canShare(shareData)) {
            try {
              await navigator.share(shareData);
              setGenerating(false);
              return;
            } catch {
              // User cancelled or error, fall through to download
            }
          }
        }

        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "silushka-workout.png";
        a.click();
        URL.revokeObjectURL(url);
        setGenerating(false);
      }, "image/png");
    } catch {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={onClose}>
      <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {/* The card to capture */}
        <div
          ref={cardRef}
          style={{
            width: "360px",
            padding: "24px",
            background: "linear-gradient(135deg, #1a1208 0%, #2a1f0f 50%, #1a1208 100%)",
            borderRadius: "16px",
            border: "2px solid #7a5c35",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <p style={{ color: "#a83232", fontSize: "22px", fontWeight: "bold", letterSpacing: "2px", margin: 0 }}>
              СИЛУШКА БОГАТЫРСКАЯ
            </p>
            <p style={{ color: "#9b7a4a", fontSize: "10px", marginTop: "4px" }}>silushka-bogatyrskaya.com</p>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "linear-gradient(to right, transparent, #7a5c35, transparent)", margin: "12px 0" }} />

          {/* Workout type */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <p style={{ color: "#d4bc8e", fontSize: "18px", fontWeight: "bold", margin: 0 }}>{workoutType}</p>
            <p style={{ color: "#9b7a4a", fontSize: "12px", marginTop: "4px" }}>{date}</p>
          </div>

          {/* Exercises */}
          <div style={{ marginBottom: "16px" }}>
            {workout.exercises.map((e, i) => {
              const maxWeight = Math.max(...e.sets.map((s) => s.weight));
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: i < workout.exercises.length - 1 ? "1px solid rgba(58,53,48,0.3)" : "none",
                  }}
                >
                  <span style={{ color: "#e8dcc8", fontSize: "12px" }}>{e.name}</span>
                  <span style={{ color: "#9b7a4a", fontSize: "11px", whiteSpace: "nowrap", marginLeft: "8px" }}>
                    {e.sets.length} × {maxWeight}кг
                  </span>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "linear-gradient(to right, transparent, #7a5c35, transparent)", margin: "12px 0" }} />

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
            <div>
              <p style={{ color: "#d4bc8e", fontSize: "20px", fontWeight: "bold", margin: 0 }}>
                {workout.exercises.length}
              </p>
              <p style={{ color: "#9b7a4a", fontSize: "9px", margin: 0 }}>упражнений</p>
            </div>
            <div>
              <p style={{ color: "#d4bc8e", fontSize: "20px", fontWeight: "bold", margin: 0 }}>{totalSets}</p>
              <p style={{ color: "#9b7a4a", fontSize: "9px", margin: 0 }}>подходов</p>
            </div>
            <div>
              <p style={{ color: "#d4bc8e", fontSize: "20px", fontWeight: "bold", margin: 0 }}>
                {totalTonnage >= 1000 ? `${(totalTonnage / 1000).toFixed(1)}т` : `${Math.round(totalTonnage)}кг`}
              </p>
              <p style={{ color: "#9b7a4a", fontSize: "9px", margin: 0 }}>тоннаж</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm bg-[#2a1f0f] text-[#d4bc8e] border border-[#3a3530]/50"
          >
            Закрыть
          </button>
          <button
            onClick={handleShare}
            disabled={generating}
            className="flex-1 py-2.5 rounded-xl text-sm bg-[#3a1515] text-[#d4bc8e] border border-[#8b2525]/30 disabled:opacity-50"
          >
            {generating ? "Создаю..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
