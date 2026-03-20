"use client";

import { useEffect, useState } from "react";
import { useWorkoutStore } from "@/stores/workout";
import { ProgressChart } from "@/components/ProgressChart";

interface ChartData {
  name: string;
  data: { date: string; weight: number }[];
}

export default function ProgressPage() {
  const { workouts, fetchWorkouts } = useWorkoutStore();
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  useEffect(() => {
    const exerciseMap = new Map<string, { date: string; weight: number }[]>();
    const sorted = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const workout of sorted) {
      const dateStr = new Date(workout.date).toLocaleDateString("ru-RU", { month: "short", day: "numeric" });
      for (const exercise of (workout.exercises || [])) {
        if (!exercise || !exercise.name) continue;
        if (!exerciseMap.has(exercise.name)) exerciseMap.set(exercise.name, []);
        const sets = exercise.sets || [];
        const maxWeight = sets.length > 0 ? Math.max(...sets.map((s: { weight: number }) => s.weight || 0), 0) : 0;
        exerciseMap.get(exercise.name)!.push({ date: dateStr, weight: maxWeight });
      }
    }

    const chartData: ChartData[] = [];
    for (const [name, data] of exerciseMap) {
      if (data.length >= 1) chartData.push({ name, data });
    }
    setCharts(chartData);
    if (chartData.length > 0 && !selected) setSelected(chartData[0].name);
  }, [workouts, selected]);

  if (charts.length === 0) {
    return (
      <div className="text-center py-16">
        <img src="/images/bear.png" alt="" className="w-60 h-60 mx-auto object-contain" style={{ marginBottom: '30px' }} />
        <p className="text-[#b89a6a] font-display">
          Соверши подвиги,<br />чтобы увидеть Ведомость Силушки
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Wheat field header */}
      <div className="relative rounded-xl overflow-hidden mb-4 border border-[#7a5c35]/30">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/wheat-field.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1208]/85 via-[#1a1208]/60 to-transparent" />
        <div className="relative p-5">
          <h2 className="font-display text-xl font-bold text-[#d4bc8e] drop-shadow">Ведомость Силушки</h2>
          <p className="text-[#d4bc8e] text-sm mt-1 drop-shadow">Прогресс по каждому упражнению</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {charts.map((chart) => (
          <button
            key={chart.name}
            onClick={() => setSelected(chart.name)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all border ${
              selected === chart.name
                ? "bg-[#5a4428] text-[#a83232] border-[#8b2525]/40"
                : "bg-[#2a1f0f] text-[#b89a6a] border-[#7a5c35]/20 hover:text-[#e8dcc8]"
            }`}
          >
            {chart.name}
          </button>
        ))}
      </div>

      {charts
        .filter((c) => c.name === selected)
        .map((chart) => (
          <ProgressChart key={chart.name} title={chart.name} data={chart.data} />
        ))}
    </div>
  );
}
