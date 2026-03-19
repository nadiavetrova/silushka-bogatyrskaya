import { prisma } from "../lib/prisma";
import type { AdaptationSuggestion } from "../types/shared";

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

export async function getNextWorkout(
  userId: string
): Promise<AdaptationSuggestion[]> {
  const workouts = await prisma.workout.findMany({
    where: { userId },
    include: {
      exercises: {
        include: { sets: { orderBy: { order: "asc" } } },
      },
    },
    orderBy: { date: "desc" },
    take: 3,
  });

  if (workouts.length === 0) return [];

  // Group exercises by name across last 3 workouts
  const exerciseHistory = new Map<
    string,
    { difficulty: string; maxWeight: number; avgReps: number }[]
  >();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (!exerciseHistory.has(exercise.name)) {
        exerciseHistory.set(exercise.name, []);
      }

      const maxWeight = Math.max(...exercise.sets.map((s) => s.weight), 0);
      const avgReps =
        exercise.sets.length > 0
          ? exercise.sets.reduce((sum, s) => sum + s.reps, 0) /
            exercise.sets.length
          : 0;

      exerciseHistory.get(exercise.name)!.push({
        difficulty: exercise.difficulty,
        maxWeight,
        avgReps: Math.round(avgReps),
      });
    }
  }

  const suggestions: AdaptationSuggestion[] = [];

  for (const [name, history] of exerciseHistory) {
    const latest = history[0];
    if (!latest) continue;

    let suggestedWeight = latest.maxWeight;
    let suggestedReps = latest.avgReps;
    let reason = "";

    // Check 3x hard deload
    const allHard =
      history.length >= 3 && history.every((h) => h.difficulty === "hard");

    if (allHard) {
      suggestedWeight = roundToHalf(latest.maxWeight * 0.9);
      reason = `Разгрузка: 3 тяжёлых подряд → -10% (${latest.maxWeight}кг → ${suggestedWeight}кг)`;
    } else {
      switch (latest.difficulty) {
        case "easy":
          suggestedWeight = roundToHalf(latest.maxWeight * 1.05);
          reason = `Легко → +5% вес (${latest.maxWeight}кг → ${suggestedWeight}кг)`;
          break;
        case "medium":
          suggestedWeight = roundToHalf(latest.maxWeight * 1.02);
          reason = `Средне → +2% вес (${latest.maxWeight}кг → ${suggestedWeight}кг)`;
          break;
        case "hard":
          if (latest.maxWeight > 10) {
            suggestedWeight = roundToHalf(latest.maxWeight * 0.95);
            reason = `Тяжело → -5% вес (${latest.maxWeight}кг → ${suggestedWeight}кг)`;
          } else {
            suggestedReps = Math.max(1, latest.avgReps - 1);
            reason = `Тяжело → -1 повт. (${latest.avgReps} → ${suggestedReps})`;
          }
          break;
      }
    }

    suggestions.push({
      exerciseName: name,
      suggestedWeight,
      suggestedReps,
      reason,
    });
  }

  return suggestions;
}
