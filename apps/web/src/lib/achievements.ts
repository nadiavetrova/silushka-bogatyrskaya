import type { WorkoutData } from "./types";

// ==================== УРОВНИ ====================

export interface BogatyrLevel {
  name: string;
  minWorkouts: number;
  maxWorkouts: number;
  icon: string;
}

export const LEVELS: BogatyrLevel[] = [
  { name: "Новичок", minWorkouts: 0, maxWorkouts: 4, icon: "IMG:treeIcon" },
  { name: "Ученик", minWorkouts: 5, maxWorkouts: 14, icon: "IMG:mech" },
  { name: "Воин", minWorkouts: 15, maxWorkouts: 29, icon: "IMG:sjit" },
  { name: "Витязь", minWorkouts: 30, maxWorkouts: 59, icon: "IMG:luk" },
  { name: "Богатырь", minWorkouts: 60, maxWorkouts: 99, icon: "IMG:kulak" },
  { name: "Легендарный Богатырь", minWorkouts: 100, maxWorkouts: Infinity, icon: "IMG:wolf" },
];

export function computeLevel(workoutCount: number) {
  const level = LEVELS.find((l) => workoutCount >= l.minWorkouts && workoutCount <= l.maxWorkouts) || LEVELS[0];
  const levelIndex = LEVELS.indexOf(level);
  const nextLevel = levelIndex < LEVELS.length - 1 ? LEVELS[levelIndex + 1] : null;

  const progressInLevel = workoutCount - level.minWorkouts;
  const levelRange = (nextLevel ? nextLevel.minWorkouts : level.minWorkouts + 1) - level.minWorkouts;
  const progress = Math.min(progressInLevel / levelRange, 1);

  return { level, nextLevel, progress, workoutCount };
}

// ==================== ДОСТИЖЕНИЯ ====================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  progress?: { current: number; target: number };
}

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  check: (workouts: WorkoutData[], stats: WorkoutStats) => { earned: boolean; earnedDate?: string; progress?: { current: number; target: number } };
}

interface WorkoutStats {
  totalWorkouts: number;
  totalTonnage: number;
  maxStreak: number;
  uniqueExercises: number;
  maxInWeek: number;
}

function computeStats(workouts: WorkoutData[]): WorkoutStats {
  const totalWorkouts = workouts.length;
  const totalTonnage = computeTotalTonnage(workouts);
  const maxStreak = computeMaxStreak(workouts);
  const uniqueExercises = new Set(workouts.flatMap((w) => w.exercises.map((e) => e.name.toLowerCase()))).size;
  const maxInWeek = computeMaxInWeek(workouts);
  return { totalWorkouts, totalTonnage, maxStreak, uniqueExercises, maxInWeek };
}

export function computeTotalTonnage(workouts: WorkoutData[]): number {
  let total = 0;
  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const set of ex.sets) {
        total += set.weight * set.reps;
      }
    }
  }
  return Math.round(total);
}

export function computeMaxStreak(workouts: WorkoutData[]): number {
  if (workouts.length === 0) return 0;
  const dates = [...new Set(workouts.map((w) => new Date(w.date).toISOString().split("T")[0]))].sort();
  let maxStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 3) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  return maxStreak;
}

function computeMaxInWeek(workouts: WorkoutData[]): number {
  if (workouts.length === 0) return 0;
  const dates = workouts.map((w) => new Date(w.date).getTime()).sort((a, b) => a - b);
  let max = 0;
  for (let i = 0; i < dates.length; i++) {
    const weekEnd = dates[i] + 7 * 24 * 60 * 60 * 1000;
    let count = 0;
    for (let j = i; j < dates.length && dates[j] <= weekEnd; j++) {
      count++;
    }
    max = Math.max(max, count);
  }
  return max;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: "first-workout",
    name: "Первый подвиг",
    description: "Завершить первую тренировку",
    icon: "IMG:star",
    check: (w, s) => ({
      earned: s.totalWorkouts >= 1,
      earnedDate: w.length > 0 ? w[w.length - 1].date : undefined,
      progress: { current: Math.min(s.totalWorkouts, 1), target: 1 },
    }),
  },
  {
    id: "week-training",
    name: "Неделя закалки",
    description: "Провести 7 тренировок",
    icon: "IMG:fire",
    check: (w, s) => ({
      earned: s.totalWorkouts >= 7,
      progress: { current: Math.min(s.totalWorkouts, 7), target: 7 },
    }),
  },
  {
    id: "month-strength",
    name: "Месяц силы",
    description: "Провести 30 тренировок",
    icon: "IMG:almaz",
    check: (_, s) => ({
      earned: s.totalWorkouts >= 30,
      progress: { current: Math.min(s.totalWorkouts, 30), target: 30 },
    }),
  },
  {
    id: "bogatyr-streak",
    name: "Богатырская серия",
    description: "5 тренировок подряд без перерыва",
    icon: "IMG:cep",
    check: (_, s) => ({
      earned: s.maxStreak >= 5,
      progress: { current: Math.min(s.maxStreak, 5), target: 5 },
    }),
  },
  {
    id: "tonnage-1000",
    name: "Тонна силы",
    description: "Поднять суммарно 1 000 кг",
    icon: "IMG:girya",
    check: (_, s) => ({
      earned: s.totalTonnage >= 1000,
      progress: { current: Math.min(s.totalTonnage, 1000), target: 1000 },
    }),
  },
  {
    id: "tonnage-10000",
    name: "Стальной богатырь",
    description: "Поднять суммарно 10 000 кг",
    icon: "IMG:mechIcon",
    check: (_, s) => ({
      earned: s.totalTonnage >= 10000,
      progress: { current: Math.min(s.totalTonnage, 10000), target: 10000 },
    }),
  },
  {
    id: "variety-master",
    name: "Мастер ратных дел",
    description: "Освоить 10 разных упражнений",
    icon: "IMG:strela",
    check: (_, s) => ({
      earned: s.uniqueExercises >= 10,
      progress: { current: Math.min(s.uniqueExercises, 10), target: 10 },
    }),
  },
  {
    id: "centurion",
    name: "Сотня подвигов",
    description: "Провести 100 тренировок",
    icon: "IMG:lion",
    check: (_, s) => ({
      earned: s.totalWorkouts >= 100,
      progress: { current: Math.min(s.totalWorkouts, 100), target: 100 },
    }),
  },
  {
    id: "iron-week",
    name: "Железная неделя",
    description: "5 тренировок за 7 дней",
    icon: "IMG:molniya",
    check: (_, s) => ({
      earned: s.maxInWeek >= 5,
      progress: { current: Math.min(s.maxInWeek, 5), target: 5 },
    }),
  },
];

export function computeAchievements(workouts: WorkoutData[]): Achievement[] {
  const stats = computeStats(workouts);
  return ACHIEVEMENT_DEFS.map((def) => {
    const result = def.check(workouts, stats);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      earned: result.earned,
      earnedDate: result.earnedDate,
      progress: result.progress,
    };
  });
}

// ==================== УВЕДОМЛЕНИЯ ====================

const SEEN_ACHIEVEMENTS_KEY = "silushka_seen_achievements";
const SEEN_LEVEL_KEY = "silushka_seen_level";

function getSeenAchievements(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_ACHIEVEMENTS_KEY) || "[]"));
  } catch { return new Set(); }
}

function getSeenLevel(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(SEEN_LEVEL_KEY) || "";
}

export function getNewAchievementsCount(workouts: WorkoutData[]): number {
  const achievements = computeAchievements(workouts);
  const seen = getSeenAchievements();
  const earnedIds = achievements.filter((a) => a.earned).map((a) => a.id);
  const newAchievements = earnedIds.filter((id) => !seen.has(id)).length;

  const levelData = computeLevel(workouts.length);
  const seenLevel = getSeenLevel();
  const newLevel = levelData.level.name !== seenLevel && seenLevel !== "" ? 1 : 0;

  return newAchievements + newLevel;
}

export function markAllAsSeen(workouts: WorkoutData[]): void {
  const achievements = computeAchievements(workouts);
  const earnedIds = achievements.filter((a) => a.earned).map((a) => a.id);
  localStorage.setItem(SEEN_ACHIEVEMENTS_KEY, JSON.stringify(earnedIds));

  const levelData = computeLevel(workouts.length);
  localStorage.setItem(SEEN_LEVEL_KEY, levelData.level.name);
}

export function isAchievementNew(id: string): boolean {
  const seen = getSeenAchievements();
  return !seen.has(id);
}

export function isLevelNew(levelName: string): boolean {
  const seenLevel = getSeenLevel();
  return seenLevel !== "" && seenLevel !== levelName;
}

// ==================== КАЛЕНДАРЬ ====================

export function getWorkoutDatesSet(workouts: WorkoutData[]): Set<string> {
  return new Set(workouts.map((w) => new Date(w.date).toISOString().split("T")[0]));
}

export function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Monday = 0
  const days: { date: string; day: number; inMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d.toISOString().split("T")[0], day: d.getDate(), inMonth: false });
  }
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push({ date: date.toISOString().split("T")[0], day: d, inMonth: true });
  }
  // Next month padding
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push({ date: date.toISOString().split("T")[0], day: d, inMonth: false });
    }
  }

  return days;
}
