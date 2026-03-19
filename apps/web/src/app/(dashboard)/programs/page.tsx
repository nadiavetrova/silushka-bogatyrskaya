"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkoutStore } from "@/stores/workout";
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

interface Program {
  id: string;
  title: string;
  subtitle: string;
  muscles: string;
  exercises: { name: string; numSets: number; targetReps: number; startWeight: number }[];
}

// --- Default programs ---

const DEFAULT_PROGRAMS: Program[] = [
  {
    id: "chest-shoulders",
    title: "Грудь и Плечи",
    subtitle: "День первый",
    muscles: "Грудные, дельты, трицепс",
    exercises: [
      { name: "Жим лёжа", numSets: 4, targetReps: 12, startWeight: 20 },
      { name: "Жим гантелей наклонный", numSets: 4, targetReps: 12, startWeight: 10 },
      { name: "Разводка гантелей", numSets: 4, targetReps: 15, startWeight: 6 },
      { name: "Жим стоя", numSets: 4, targetReps: 12, startWeight: 15 },
      { name: "Махи гантелей в стороны", numSets: 4, targetReps: 15, startWeight: 5 },
    ],
  },
  {
    id: "back-biceps",
    title: "Спина и Бицепс",
    subtitle: "День второй",
    muscles: "Широчайшие, трапеция, бицепс",
    exercises: [
      { name: "Тяга верхнего блока", numSets: 4, targetReps: 12, startWeight: 30 },
      { name: "Тяга штанги в наклоне", numSets: 4, targetReps: 12, startWeight: 20 },
      { name: "Тяга гантели одной рукой", numSets: 4, targetReps: 12, startWeight: 12 },
      { name: "Сгибания со штангой", numSets: 4, targetReps: 12, startWeight: 15 },
      { name: "Сгибания с гантелями", numSets: 4, targetReps: 15, startWeight: 8 },
    ],
  },
  {
    id: "legs-triceps",
    title: "Ноги и Трицепс",
    subtitle: "День третий",
    muscles: "Квадрицепс, бицепс бедра, трицепс",
    exercises: [
      { name: "Приседания", numSets: 4, targetReps: 12, startWeight: 20 },
      { name: "Жим ногами", numSets: 4, targetReps: 12, startWeight: 40 },
      { name: "Выпады с гантелями", numSets: 4, targetReps: 12, startWeight: 8 },
      { name: "Сгибания ног", numSets: 4, targetReps: 15, startWeight: 20 },
      { name: "Французский жим", numSets: 4, targetReps: 12, startWeight: 10 },
      { name: "Разгибания на блоке", numSets: 4, targetReps: 15, startWeight: 15 },
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

function roundWeight(w: number): number {
  return Math.round(w * 2) / 2;
}

function getSetRecommendation(
  defaultWeight: number,
  targetReps: number,
  history: SetHistory[]
): { weight: number; reps: number; note: string } {
  if (history.length === 0) {
    return { weight: defaultWeight, reps: targetReps, note: "Начальный вес" };
  }

  const last = history[history.length - 1];
  const daysSinceLast = Math.floor(
    (Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceLast > 10) {
    return { weight: last.weight, reps: last.reps, note: `Перерыв ${daysSinceLast} дн.` };
  }

  const last3 = history.slice(-3);
  const allHard = last3.length >= 3 && last3.every((h) => h.difficulty === "hard");
  const allEasy = last3.length >= 3 && last3.every((h) => h.difficulty === "easy");

  if (allHard) {
    return { weight: roundWeight(last.weight * 0.9), reps: last.reps, note: "Разгрузка -10%" };
  }
  if (allEasy) {
    return { weight: roundWeight(last.weight * 1.075), reps: targetReps, note: "Рост +7.5%" };
  }

  switch (last.difficulty) {
    case "easy": {
      const w = roundWeight(last.weight * 1.05);
      return { weight: w, reps: targetReps, note: `+5% → ${w} кг` };
    }
    case "medium":
      return { weight: last.weight, reps: last.reps, note: "Повторяем" };
    case "hard":
      return { weight: last.weight, reps: last.reps, note: "Не повышаем" };
    default:
      return { weight: last.weight, reps: last.reps, note: "" };
  }
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

  // Editable exercises per program (stored in state, initialized from defaults)
  const [programExercises, setProgramExercises] = useState<Record<string, ExerciseEntry[]>>({});

  const { workouts, fetchWorkouts } = useWorkoutStore();

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

  // Initialize exercises for current program
  const initExercises = useCallback(() => {
    if (programExercises[selectedProgram]) return; // already initialized by user
    const entries: ExerciseEntry[] = program.exercises.map((ex) => {
      const sets: SetEntry[] = [];
      for (let i = 0; i < ex.numSets; i++) {
        const key = `${ex.name}|${i}`;
        const hist = setHistories.get(key) || [];
        const rec = getSetRecommendation(ex.startWeight, ex.targetReps, hist);
        sets.push({ weight: rec.weight, reps: rec.reps, difficulty: "" });
      }
      return { name: ex.name, sets };
    });
    setProgramExercises((prev) => ({ ...prev, [selectedProgram]: entries }));
    setSaved(false);
  }, [selectedProgram, program, setHistories, programExercises]);

  useEffect(() => { initExercises(); }, [initExercises]);

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

  // Add exercise
  const addExercise = (name: string) => {
    if (!name.trim()) return;
    setProgramExercises((prev) => {
      const copy = { ...prev };
      const exList = [...(copy[selectedProgram] || [])];
      exList.push({
        name: name.trim(),
        sets: [
          { weight: 10, reps: 12, difficulty: "" },
          { weight: 10, reps: 12, difficulty: "" },
          { weight: 10, reps: 12, difficulty: "" },
          { weight: 10, reps: 12, difficulty: "" },
        ],
      });
      copy[selectedProgram] = exList;
      return copy;
    });
    setNewExName("");
    setShowAddEx(false);
    setSaved(false);
  };

  // Remove exercise
  const removeExercise = (exIdx: number) => {
    setProgramExercises((prev) => {
      const copy = { ...prev };
      const exList = [...(copy[selectedProgram] || [])];
      exList.splice(exIdx, 1);
      copy[selectedProgram] = exList;
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
          <p className="text-[#d4bc8e] text-sm mt-1 drop-shadow">Запиши свой подвиг!</p>
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
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[#e8dcc8] font-medium">{exercise.name}</h4>
                <button
                  onClick={() => removeExercise(exIdx)}
                  className="text-[#8b2525]/60 hover:text-[#c54545] text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-[2rem_1fr_1fr_auto] gap-2 mb-2 px-1">
                <span className="text-[#9b7a4a] text-[10px]">#</span>
                <span className="text-[#9b7a4a] text-[10px]">Вес (кг)</span>
                <span className="text-[#9b7a4a] text-[10px]">Повт.</span>
                <span className="text-[#9b7a4a] text-[10px] text-center">Как?</span>
              </div>

              {/* Sets */}
              {exercise.sets.map((set, setIdx) => {
                const key = `${exercise.name}|${setIdx}`;
                const hist = setHistories.get(key) || [];
                const lastEntry = hist.length > 0 ? hist[hist.length - 1] : null;
                const rec = getSetRecommendation(10, 12, hist);

                return (
                  <div key={setIdx} className="mb-2">
                    <div className="grid grid-cols-[2rem_1fr_1fr_auto] gap-2 items-center">
                      <span className="text-[#9b7a4a] text-sm text-center">{setIdx + 1}</span>
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => updateSet(exIdx, setIdx, "weight", Number(e.target.value))}
                        className="bg-[#1a1918]/95 border border-[#3a3530]/50 rounded-lg px-2 py-1.5 text-[#e8dcc8] text-sm w-full focus:border-[#8b2525]/50 focus:outline-none"
                        step={0.5}
                        min={0}
                      />
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => updateSet(exIdx, setIdx, "reps", Number(e.target.value))}
                        className="bg-[#1a1918]/95 border border-[#3a3530]/50 rounded-lg px-2 py-1.5 text-[#e8dcc8] text-sm w-full focus:border-[#8b2525]/50 focus:outline-none"
                        min={1}
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
                        Было: {lastEntry.weight}кг × {lastEntry.reps} ({
                          lastEntry.difficulty === "easy" ? "легко" : lastEntry.difficulty === "medium" ? "средне" : "тяжело"
                        }) → {rec.note}
                      </p>
                    ) : setIdx === 0 ? (
                      <p className="text-[10px] text-[#9b7a4a]/60 mt-0.5 pl-8 italic">
                        Впишите начальный комфортный вес
                      </p>
                    ) : null}
                  </div>
                );
              })}
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
        <h4 className="font-display text-sm text-[#d4bc8e] mb-2">Законы Прогрессии</h4>
        <div className="space-y-1.5 text-[#d4bc8e] text-xs">
          <p><span className="text-[#f5f0e6]">Легко (Л)</span> — повышаем вес на 5%</p>
          <p><span className="text-[#b89a6a]">Средне (С)</span> — повторяем тот же вес</p>
          <p><span className="text-[#8b2525]">Тяжело (Т)</span> — не повышаем, повторяем</p>
          <p className="text-[#9b7a4a] mt-2">3 раза подряд тяжело → разгрузка -10%</p>
          <p className="text-[#9b7a4a]">3 раза подряд легко → ускоренный рост +7.5%</p>
          <p className="text-[#9b7a4a]">Перерыв больше 10 дней → вес не повышаем</p>
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
