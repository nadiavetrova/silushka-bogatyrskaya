"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkoutStore } from "@/stores/workout";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

// --- Types ---

interface SetEntry {
  weight: number;
  reps: number;
  difficulty: "easy" | "medium" | "hard" | "";
}

interface ExerciseEntry {
  name: string;
  sets: SetEntry[];
}

interface ProgramExercise {
  name: string;
  muscles: string;
  numSets: number;
  minReps: number;
  maxReps: number;
  startWeight: number;
  weightStep: number; // шаг груза в кг
  equipment: "dumbbell" | "barbell" | "machine" | "bodyweight";
}

interface Program {
  id: string;
  title: string;
  subtitle: string;
  muscles: string;
  exercises: ProgramExercise[];
}

// --- Default programs ---

const DEFAULT_PROGRAMS: Program[] = [
  {
    id: "chest-shoulders",
    title: "Грудь и Плечи",
    subtitle: "Крепость Щита и Размаха Топора",
    muscles: "Грудные, дельты, трицепс",
    exercises: [
      { name: "Жим гантелей сидя", muscles: "Плечи (дельты), трицепсы", numSets: 4, minReps: 8, maxReps: 12, startWeight: 10, weightStep: 2, equipment: "dumbbell" },
      { name: "Отведение гантелей в стороны", muscles: "Средний пучок плеча (дельты)", numSets: 4, minReps: 10, maxReps: 15, startWeight: 5, weightStep: 2, equipment: "dumbbell" },
      { name: "Подъём гантелей перед собой поочерёдно", muscles: "Передний пучок плеча (дельты)", numSets: 4, minReps: 10, maxReps: 15, startWeight: 5, weightStep: 2, equipment: "dumbbell" },
      { name: "Разведение гантелей в стороны в наклоне", muscles: "Задний пучок плеча, спина", numSets: 4, minReps: 10, maxReps: 15, startWeight: 5, weightStep: 2, equipment: "dumbbell" },
      { name: "Тяга штанги к подбородку", muscles: "Плечи (дельты), трапеции", numSets: 4, minReps: 8, maxReps: 12, startWeight: 15, weightStep: 2.5, equipment: "barbell" },
      { name: "Жим штанги (гантелей) лёжа", muscles: "Грудные мышцы, трицепсы", numSets: 4, minReps: 8, maxReps: 12, startWeight: 20, weightStep: 2.5, equipment: "barbell" },
      { name: "Жим штанги (гантелей) на наклонной скамье", muscles: "Верх грудных, трицепсы", numSets: 4, minReps: 8, maxReps: 12, startWeight: 15, weightStep: 2.5, equipment: "barbell" },
      { name: "Сведение рук с гантелями лёжа", muscles: "Грудные мышцы", numSets: 4, minReps: 10, maxReps: 15, startWeight: 6, weightStep: 2, equipment: "dumbbell" },
    ],
  },
  {
    id: "back-biceps",
    title: "Спина и Бицепс",
    subtitle: "Мощь Хребта и Рук Булатного Меча",
    muscles: "Широчайшие, ромбовидные, бицепс",
    exercises: [
      { name: "Тяга вертикального блока широкий хват", muscles: "Широчайшие спины, бицепсы", numSets: 4, minReps: 8, maxReps: 12, startWeight: 30, weightStep: 5, equipment: "machine" },
      { name: "Тяга вертикального блока узкий хват", muscles: "Широчайшие спины, бицепсы", numSets: 4, minReps: 8, maxReps: 12, startWeight: 25, weightStep: 5, equipment: "machine" },
      { name: "Тяга горизонтального блока", muscles: "Середина спины (широчайшие, ромбовидные)", numSets: 4, minReps: 8, maxReps: 12, startWeight: 25, weightStep: 5, equipment: "machine" },
      { name: "Тяга штанги в наклоне", muscles: "Широчайшие спины, бицепсы", numSets: 4, minReps: 8, maxReps: 12, startWeight: 20, weightStep: 2.5, equipment: "barbell" },
      { name: "Пуловер в кроссовере", muscles: "Широчайшие спины, грудные", numSets: 4, minReps: 10, maxReps: 15, startWeight: 15, weightStep: 5, equipment: "machine" },
      { name: "Подъём гантелей стоя", muscles: "Бицепсы", numSets: 4, minReps: 8, maxReps: 12, startWeight: 8, weightStep: 2, equipment: "dumbbell" },
      { name: "Сгибание рук в нижнем блоке на бицепс", muscles: "Бицепсы", numSets: 4, minReps: 10, maxReps: 15, startWeight: 10, weightStep: 5, equipment: "machine" },
    ],
  },
  {
    id: "legs-triceps",
    title: "Ноги и Трицепс",
    subtitle: "Крепость Корней и Удара Копья",
    muscles: "Квадрицепс, ягодичные, бицепс бедра, трицепс",
    exercises: [
      { name: "Приседания со штангой/гантелью", muscles: "Квадрицепсы, ягодичные, спина", numSets: 4, minReps: 8, maxReps: 12, startWeight: 20, weightStep: 2.5, equipment: "barbell" },
      { name: "Жим ногами в тренажёре", muscles: "Квадрицепсы, ягодичные, бицепс бедра", numSets: 4, minReps: 10, maxReps: 15, startWeight: 40, weightStep: 10, equipment: "machine" },
      { name: "Разгибание ног в тренажёре", muscles: "Квадрицепсы бедра", numSets: 4, minReps: 10, maxReps: 15, startWeight: 20, weightStep: 5, equipment: "machine" },
      { name: "Выпады со штангой или гантелями", muscles: "Квадрицепсы, ягодичные, стабилизаторы", numSets: 4, minReps: 8, maxReps: 12, startWeight: 10, weightStep: 2, equipment: "dumbbell" },
      { name: "Румынская тяга с упором одной ноги на стену", muscles: "Задняя поверхность бедра, ягодичные", numSets: 4, minReps: 10, maxReps: 15, startWeight: 10, weightStep: 2, equipment: "dumbbell" },
      { name: "Отведение ноги назад в кроссовере", muscles: "Ягодичные мышцы", numSets: 4, minReps: 12, maxReps: 18, startWeight: 10, weightStep: 2.5, equipment: "machine" },
      { name: "Отведение ноги в сторону в кроссовере", muscles: "Средние ягодичные мышцы", numSets: 4, minReps: 12, maxReps: 18, startWeight: 10, weightStep: 2.5, equipment: "machine" },
      { name: "Разгибание рук в верхнем блоке", muscles: "Трицепсы", numSets: 4, minReps: 10, maxReps: 15, startWeight: 15, weightStep: 5, equipment: "machine" },
      { name: "Французский жим с гантелью стоя", muscles: "Трицепсы", numSets: 4, minReps: 8, maxReps: 12, startWeight: 8, weightStep: 2, equipment: "dumbbell" },
      { name: "Обратные отжимания от скамьи", muscles: "Трицепсы", numSets: 4, minReps: 8, maxReps: 15, startWeight: 0, weightStep: 0, equipment: "bodyweight" },
    ],
  },
];

// --- Per-set progression ---

interface SetHistory {
  date: string;
  weight: number;
  reps: number;
  difficulty: string;
}

function getSetRecommendation(
  progEx: ProgramExercise,
  history: SetHistory[]
): { weight: number; reps: number; note: string } {
  const { startWeight, minReps, maxReps, weightStep, equipment } = progEx;

  if (history.length === 0) {
    return { weight: startWeight, reps: minReps, note: "" };
  }

  const last = history[history.length - 1];
  const daysSinceLast = Math.floor(
    (Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Перерыв > 10 дней — не повышаем
  if (daysSinceLast > 10) {
    return { weight: last.weight, reps: last.reps, note: `Перерыв ${daysSinceLast} дн. — без повышения` };
  }

  // Проверка серий
  const last3 = history.slice(-3);
  const allHard = last3.length >= 3 && last3.every((h) => h.difficulty === "hard");
  const mediumStreak = last3.length >= 3 && last3.every((h) => h.difficulty === "medium");

  if (allHard) {
    // 3 раза тяжело — разгрузка на шаг вниз
    const newWeight = Math.max(0, last.weight - weightStep);
    return { weight: newWeight, reps: last.reps, note: `Разгрузка: -${weightStep} кг` };
  }

  switch (last.difficulty) {
    case "easy": {
      if (equipment === "bodyweight") {
        // Собственный вес — только повторения
        if (last.reps < maxReps) {
          return { weight: 0, reps: Math.min(last.reps + 2, maxReps), note: `+2 повт.` };
        }
        return { weight: 0, reps: maxReps, note: "Макс повт. — усложняй!" };
      }
      if (last.reps < maxReps) {
        // Ещё не макс повторений — повышаем повторения
        const newReps = Math.min(last.reps + 2, maxReps);
        return { weight: last.weight, reps: newReps, note: `+${newReps - last.reps} повт.` };
      }
      // Достигнут макс повторений — повышаем вес, сбрасываем повторения
      const newWeight = last.weight + weightStep;
      return { weight: newWeight, reps: minReps, note: `+${weightStep} кг → ${newWeight} кг, сброс до ${minReps} повт.` };
    }

    case "medium": {
      if (mediumStreak) {
        // 3+ раз посильно — пробуем повысить повторения
        if (last.reps < maxReps) {
          return { weight: last.weight, reps: last.reps + 1, note: "3× посильно → +1 повт." };
        }
      }
      return { weight: last.weight, reps: last.reps, note: "Повторяем" };
    }

    case "hard": {
      if (equipment === "bodyweight") {
        if (last.reps > minReps) {
          return { weight: 0, reps: last.reps - 1, note: "-1 повт." };
        }
        return { weight: 0, reps: last.reps, note: "Упрости технику" };
      }
      // Снижаем вес на шаг
      const newWeight = Math.max(0, last.weight - weightStep);
      if (newWeight <= 0 && last.reps > minReps) {
        return { weight: last.weight, reps: last.reps - 1, note: "-1 повт." };
      }
      return { weight: newWeight, reps: last.reps, note: `-${weightStep} кг → ${newWeight} кг` };
    }

    default:
      return { weight: last.weight, reps: last.reps, note: "" };
  }
}

// --- LocalStorage for custom exercise lists per program ---
const CUSTOM_EX_KEY = "silushka_custom_exercises";

function loadCustomExercises(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CUSTOM_EX_KEY) || "{}"); }
  catch { return {}; }
}

function saveCustomExercises(data: Record<string, string[]>) {
  localStorage.setItem(CUSTOM_EX_KEY, JSON.stringify(data));
}

// --- LocalStorage for per-set history (supplement to DB) ---
const STORAGE_KEY = "silushka_set_history";

interface SavedSetRecord {
  date: string;
  exerciseName: string;
  setIndex: number;
  weight: number;
  reps: number;
  difficulty: string;
}

function loadSetHistory(): SavedSetRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveSetHistory(records: SavedSetRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// --- Component ---

export default function ProgramsPage() {
  const [selectedProgram, setSelectedProgram] = useState<string>(DEFAULT_PROGRAMS[0].id);
  const [setHistory, setSetHistory] = useState<SavedSetRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [showAddEx, setShowAddEx] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [collapsedExercises, setCollapsedExercises] = useState<Record<string, boolean>>({});

  const toggleCollapse = (exIdx: number) => {
    const key = `${selectedProgram}-${exIdx}`;
    setCollapsedExercises((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isCollapsed = (exIdx: number) => {
    const key = `${selectedProgram}-${exIdx}`;
    return collapsedExercises[key] !== false; // свёрнуто по умолчанию
  };

  // Editable exercises per program — persisted in sessionStorage so switching tabs doesn't lose data
  const SESSION_KEY = "silushka_session_exercises";
  const [programExercises, setProgramExercisesRaw] = useState<Record<string, ExerciseEntry[]>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}"); }
    catch { return {}; }
  });
  const setProgramExercises = (updater: React.SetStateAction<Record<string, ExerciseEntry[]>>) => {
    setProgramExercisesRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const { workouts, fetchWorkouts } = useWorkoutStore();
  const userName = useAuthStore((s) => s.user?.name) || "";

  useEffect(() => {
    fetchWorkouts();
    setSetHistory(loadSetHistory());
  }, [fetchWorkouts]);

  const program = DEFAULT_PROGRAMS.find((p) => p.id === selectedProgram)!;

  // Build per-set history map
  const setHistories = useMemo(() => {
    const map = new Map<string, SetHistory[]>();
    for (const rec of setHistory) {
      const key = `${rec.exerciseName}|${rec.setIndex}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ date: rec.date, weight: rec.weight, reps: rec.reps, difficulty: rec.difficulty });
    }
    return map;
  }, [setHistory]);

  // Initialize exercises for current program (from localStorage or defaults)
  useEffect(() => {
    // Skip if already initialized in this session
    if (programExercises[selectedProgram]) return;

    // Check localStorage for custom exercise list
    const customLists = loadCustomExercises();
    const savedNames = customLists[selectedProgram];

    // Use saved list or default
    const exerciseNames = savedNames || program.exercises.map((ex) => ex.name);

    const entries: ExerciseEntry[] = exerciseNames.map((name) => {
      const progEx = program.exercises.find((pe) => pe.name === name);
      const numSets = progEx?.numSets || 4;
      const sets: SetEntry[] = [];
      for (let i = 0; i < numSets; i++) {
        const key = `${name}|${i}`;
        const hist = setHistories.get(key) || [];
        const fallback: ProgramExercise = { name, muscles: "", numSets: 4, minReps: 8, maxReps: 12, startWeight: 10, weightStep: 2, equipment: "dumbbell" };
        const rec = getSetRecommendation(progEx || fallback, hist);
        sets.push({ weight: rec.weight, reps: rec.reps, difficulty: "" });
      }
      return { name, sets };
    });
    setProgramExercises((prev) => ({ ...prev, [selectedProgram]: entries }));
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgram, setHistory]);

  const exercises = programExercises[selectedProgram] || [];

  // Update a set value
  const updateSet = (exIdx: number, setIdx: number, field: keyof SetEntry, value: number | string) => {
    setProgramExercises((prev) => {
      const copy = { ...prev };
      const exList = [...(copy[selectedProgram] || [])];
      const ex = { ...exList[exIdx], sets: [...exList[exIdx].sets] };
      ex.sets[setIdx] = { ...ex.sets[setIdx], [field]: value };
      exList[exIdx] = ex;
      copy[selectedProgram] = exList;
      return copy;
    });
    setSaved(false);
  };

  // Persist exercise names to localStorage
  const persistExerciseNames = (exList: ExerciseEntry[]) => {
    const customLists = loadCustomExercises();
    customLists[selectedProgram] = exList.map((e) => e.name);
    saveCustomExercises(customLists);
  };

  // Add exercise
  const addExercise = (name: string) => {
    if (!name.trim()) return;
    setProgramExercises((prev) => {
      const copy = { ...prev };
      const exList = [...(copy[selectedProgram] || [])];
      exList.push({
        name: name.trim(),
        sets: [
          { weight: 0, reps: 12, difficulty: "" },
          { weight: 0, reps: 12, difficulty: "" },
          { weight: 0, reps: 12, difficulty: "" },
          { weight: 0, reps: 12, difficulty: "" },
        ],
      });
      copy[selectedProgram] = exList;
      persistExerciseNames(exList);
      return copy;
    });
    setNewExName("");
    setShowAddEx(false);
    setSaved(false);
  };

  // Remove exercise (permanent — saved to localStorage)
  const removeExercise = (exIdx: number) => {
    setProgramExercises((prev) => {
      const copy = { ...prev };
      const exList = [...(copy[selectedProgram] || [])];
      exList.splice(exIdx, 1);
      copy[selectedProgram] = exList;
      persistExerciseNames(exList);
      return copy;
    });
    setSaved(false);
  };

  // Save workout to DB via API + save set history to localStorage
  const handleSave = async () => {
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      // Build exercises for API (each exercise with overall difficulty = most common difficulty)
      const apiExercises = exercises
        .filter((ex) => ex.sets.some((s) => s.difficulty !== ""))
        .map((ex) => {
          const diffs = ex.sets.filter((s) => s.difficulty !== "").map((s) => s.difficulty);
          const hardCount = diffs.filter((d) => d === "hard").length;
          const easyCount = diffs.filter((d) => d === "easy").length;
          let overall: "easy" | "medium" | "hard" = "medium";
          if (hardCount > easyCount) overall = "hard";
          else if (easyCount > hardCount) overall = "easy";

          return {
            name: ex.name,
            difficulty: overall,
            sets: ex.sets
              .filter((s) => s.difficulty !== "")
              .map((s, i) => ({ weight: s.weight, reps: s.reps, order: i })),
          };
        });

      if (apiExercises.length > 0) {
        // Save to DB
        await api.createWorkout({ date: today, exercises: apiExercises });
        await fetchWorkouts();
      }

      // Save per-set history to localStorage
      const newRecords: SavedSetRecord[] = [];
      for (const ex of exercises) {
        ex.sets.forEach((s, i) => {
          if (s.difficulty) {
            newRecords.push({
              date: today,
              exerciseName: ex.name,
              setIndex: i,
              weight: s.weight,
              reps: s.reps,
              difficulty: s.difficulty,
            });
          }
        });
      }
      const updated = [...setHistory, ...newRecords];
      saveSetHistory(updated);
      setSetHistory(updated);

      setSaved(true);
      setShowSuccessModal(true);
      // Reset so next time exercises are re-initialized with updated recommendations
      setProgramExercises((prev) => {
        const copy = { ...prev };
        delete copy[selectedProgram];
        return copy;
      });
    } catch {
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const diffColors: Record<string, string> = {
    easy: "btn-neo-pressed btn-neo-sm text-[#5ea352]",
    medium: "btn-neo-pressed btn-neo-sm text-[#d4bc8e]",
    hard: "btn-neo-pressed btn-neo-sm text-[#c54545]",
    "": "btn-neo-sm text-[#9b7a4a]",
  };

  return (
    <div>
      {/* Header */}
      <div className="relative rounded-xl overflow-hidden mb-6 border border-[#3a3530]/50">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/chernomor.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1208]/90 via-[#1a1208]/70 to-transparent" />
        <div className="relative p-5">
          <p className="text-[#a83232] font-display text-lg drop-shadow">Мудрость Берегини</p>
          <p className="text-[#d4bc8e] text-sm mt-1 drop-shadow">{userName ? `${userName}, запиши свой подвиг!` : "Запиши свой подвиг!"}</p>
        </div>
      </div>

      {/* Program selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {DEFAULT_PROGRAMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProgram(p.id)}
            className={`px-3 py-2 rounded-xl text-sm whitespace-nowrap ${
              selectedProgram === p.id
                ? "btn-neo-pressed btn-neo text-[#e8dcc8]"
                : "btn-neo text-[#9b7a4a] hover:text-[#e8dcc8]"
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Program info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg text-[#d4bc8e]">{program.title}</h3>
          <p className="text-[#9b7a4a] text-xs mt-0.5">{program.subtitle} — {program.muscles}</p>
        </div>
      </div>

      {/* Exercises */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedProgram}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          {exercises.map((exercise, exIdx) => (
            <motion.div
              key={`${exercise.name}-${exIdx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: exIdx * 0.03 }}
              className="card-wood rounded-xl p-4 border border-[#3a3530]/50"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleCollapse(exIdx)}
              >
                <div className="flex items-center gap-2 flex-1">
                  <svg className="w-3 h-3 text-[#9b7a4a] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ transform: isCollapsed(exIdx) ? "rotate(0deg)" : "rotate(90deg)", transition: "transform 0.2s" }}><path d="M8 5v14l11-7z"/></svg>
                  <h4 className="text-[#e8dcc8] font-medium">{exercise.name}</h4>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeExercise(exIdx); }}
                  className="text-[#8b2525]/60 hover:text-[#c54545] text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>
              {!isCollapsed(exIdx) && (() => {
                const progEx = program.exercises.find((pe) => pe.name === exercise.name);
                return progEx?.muscles ? (
                  <p className="text-[#9b7a4a] text-[10px] mb-3 pl-0.5 italic mt-1">{progEx.muscles}</p>
                ) : null;
              })()}

              {/* Column headers & Sets */}
              {!isCollapsed(exIdx) && (() => {
                const curProgEx = program.exercises.find((pe) => pe.name === exercise.name);
                const isBW = curProgEx?.equipment === "bodyweight";
                return (
                  <>
                    <div className={`grid ${isBW ? "grid-cols-[2rem_1fr_auto]" : "grid-cols-[2rem_1fr_1fr_auto]"} gap-2 mb-2 px-1`}>
                      <span className="text-[#9b7a4a] text-[10px]">#</span>
                      {!isBW && <span className="text-[#9b7a4a] text-[10px]">Вес (кг)</span>}
                      <span className="text-[#9b7a4a] text-[10px]">Повт.</span>
                      <span className="text-[#9b7a4a] text-[10px] text-center">Как?</span>
                    </div>
                    {exercise.sets.map((set, setIdx) => {
                      const key = `${exercise.name}|${setIdx}`;
                      const hist = setHistories.get(key) || [];
                      const lastEntry = hist.length > 0 ? hist[hist.length - 1] : null;
                      const fallbackEx: ProgramExercise = { name: exercise.name, muscles: "", numSets: 4, minReps: 8, maxReps: 12, startWeight: 10, weightStep: 2, equipment: "dumbbell" };
                      const rec = getSetRecommendation(curProgEx || fallbackEx, hist);

                      return (
                        <div key={setIdx} className="mb-2">
                          <div className={`grid ${isBW ? "grid-cols-[2rem_1fr_auto]" : "grid-cols-[2rem_1fr_1fr_auto]"} gap-2 items-center`}>
                            <span className="text-[#9b7a4a] text-sm text-center">{setIdx + 1}</span>
                            {!isBW && (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={set.weight === 0 ? "" : set.weight}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === "" || v === "0") { updateSet(exIdx, setIdx, "weight", 0); return; }
                                  const n = parseFloat(v);
                                  if (!isNaN(n)) updateSet(exIdx, setIdx, "weight", n);
                                }}
                                placeholder="0"
                                className="bg-[#1a1918]/95 border border-[#3a3530]/50 rounded-lg px-2 py-1.5 text-[#e8dcc8] text-sm w-full focus:border-[#8b2525]/50 focus:outline-none"
                              />
                            )}
                            <input
                              type="text"
                              inputMode="numeric"
                              value={set.reps === 0 ? "" : set.reps}
                              onChange={(e) => {
                                const v = e.target.value;
                                if (v === "" || v === "0") { updateSet(exIdx, setIdx, "reps", 0); return; }
                                const n = parseInt(v, 10);
                                if (!isNaN(n)) updateSet(exIdx, setIdx, "reps", n);
                              }}
                              placeholder="0"
                              className="bg-[#1a1918]/95 border border-[#3a3530]/50 rounded-lg px-2 py-1.5 text-[#e8dcc8] text-sm w-full focus:border-[#8b2525]/50 focus:outline-none"
                            />
                            <div className="flex gap-1">
                              {(["easy", "medium", "hard"] as const).map((d) => (
                                <button
                                  key={d}
                                  onClick={() => updateSet(exIdx, setIdx, "difficulty", set.difficulty === d ? "" : d)}
                                  className={`px-1.5 py-1 rounded text-[10px] border transition-all ${
                                    set.difficulty === d ? diffColors[d] : diffColors[""]
                                  }`}
                                >
                                  {d === "easy" ? "Л" : d === "medium" ? "С" : "Т"}
                                </button>
                              ))}
                            </div>
                          </div>
                    {lastEntry ? (
                      <p className="text-[10px] text-[#9b7a4a] mt-0.5 pl-8">
                        Было: {!isBW && `${lastEntry.weight}кг × `}{lastEntry.reps} повт. ({
                          lastEntry.difficulty === "easy" ? "легко" : lastEntry.difficulty === "medium" ? "средне" : "тяжело"
                        }) → {rec.note}
                      </p>
                    ) : !lastEntry ? (
                      <p className="text-[10px] text-[#9b7a4a]/60 mt-0.5 pl-8 italic">
                        Выбери Подъём Посильный!
                      </p>
                    ) : null}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Add exercise */}
      <div className="mt-4">
        {showAddEx ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newExName}
              onChange={(e) => setNewExName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addExercise(newExName)}
              placeholder="Название упражнения..."
              className="flex-1 bg-[#1a1918]/95 border border-[#3a3530]/50 rounded-xl px-3 py-2 text-[#e8dcc8] text-sm focus:border-[#8b2525]/50 focus:outline-none placeholder-[#7a5c35]"
              autoFocus
            />
            <button
              onClick={() => addExercise(newExName)}
              className="px-4 py-2 bg-[#5a4428] text-[#a83232] rounded-xl text-sm border border-[#8b2525]/30"
            >
              +
            </button>
            <button
              onClick={() => { setShowAddEx(false); setNewExName(""); }}
              className="px-3 py-2 text-[#9b7a4a] text-sm"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddEx(true)}
            className="w-full py-2.5 rounded-xl text-sm text-[#b89a6a] btn-neo hover:text-[#d4bc8e]"
          >
            + Добавить упражнение
          </button>
        )}
      </div>

      {/* Save button */}
      <div className="mt-6 mb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-xl font-display text-sm font-semibold ${
            saved
              ? "btn-neo-pressed btn-neo text-[#5ea352]"
              : "btn-neo-accent text-[#e8dcc8]"
          }`}
        >
          {saving ? "Сохраняю..." : saved ? "✔ Тренировка записана!" : "Записать тренировку"}
        </button>
      </div>

      {/* Progression rules */}
      <div className="card-wood rounded-xl p-4 border border-[#3a3530]/50 mb-8">
        <h4 className="font-display text-sm text-[#d4bc8e] mb-3">Ратный Долг: Наказы для Роста Силушки</h4>
        <div className="space-y-2 text-[#d4bc8e] text-xs">
          <div>
            <p className="text-[#f5f0e6] font-semibold mb-0.5">Легко (Л):</p>
            <p className="text-[#b89a6a]">Повт. &lt; макс. → +1-2 повторения</p>
            <p className="text-[#b89a6a]">Повт. = макс. → +вес (шаг груза), сброс повт. до мин.</p>
          </div>
          <div>
            <p className="text-[#d4bc8e] font-semibold mb-0.5">Посильно (С):</p>
            <p className="text-[#b89a6a]">Повторяем тот же вес и повторения</p>
            <p className="text-[#b89a6a]">3-4× посильно подряд → пробуем +1 повт.</p>
          </div>
          <div>
            <p className="text-[#8b2525] font-semibold mb-0.5">Тяжко (Т):</p>
            <p className="text-[#b89a6a]">Снижаем вес на шаг груза</p>
            <p className="text-[#b89a6a]">3× тяжко подряд → разгрузка (ещё -шаг)</p>
          </div>
          <div className="border-t border-[#3a3530]/40 pt-2 mt-2">
            <p className="text-[#9b7a4a]">Шаг груза: гантели +2кг, штанга +2.5-5кг, тренажёр +5кг</p>
            <p className="text-[#9b7a4a]">Перерыв &gt; 10 дней → вес не повышаем</p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            onClick={() => setShowSuccessModal(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative card-wood rounded-2xl p-6 max-w-sm w-full text-center border border-[#3a3530]"
              onClick={(e) => e.stopPropagation()}
            >
              <img src="/images/bear.png" alt="" className="w-32 h-32 mx-auto mb-4 object-contain" />
              <h3 className="font-display text-xl text-[#d4bc8e] mb-2">Славный подвиг, Богатырь!</h3>
              <p className="text-[#b89a6a] text-sm mb-1">Тренировка записана</p>
              <p className="text-[#9b7a4a] text-xs mb-5">и добавлена в Летопись Свершений</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="btn-neo-accent px-6 py-2.5 rounded-xl text-[#e8dcc8] text-sm font-display"
              >
                Благодарю!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
