"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkoutStore } from "@/stores/workout";
import { ExerciseCard } from "@/components/ExerciseCard";

export default function NewWorkoutPage() {
  const router = useRouter();
  const {
    currentWorkout, suggestions, loading,
    fetchSuggestions, addExercise, removeExercise,
    addSet, updateSet, removeSet, setDifficulty,
    saveWorkout, resetCurrent,
  } = useWorkoutStore();

  const [exerciseName, setExerciseName] = useState("");

  useEffect(() => {
    resetCurrent();
    fetchSuggestions();
  }, [fetchSuggestions, resetCurrent]);

  const handleAddExercise = () => {
    if (!exerciseName.trim()) return;
    addExercise(exerciseName.trim());
    setExerciseName("");
  };

  const handleAddFromSuggestion = (name: string) => {
    const suggestion = suggestions.find((s) => s.exerciseName === name);
    addExercise(name);
    if (suggestion) {
      setTimeout(() => {
        const store = useWorkoutStore.getState();
        const exIdx = store.currentWorkout.exercises.length - 1;
        if (exIdx >= 0) {
          store.updateSet(exIdx, 0, {
            weight: suggestion.suggestedWeight,
            reps: suggestion.suggestedReps,
          });
        }
      }, 0);
    }
  };

  const handleSave = async () => {
    if (currentWorkout.exercises.length === 0) return;
    await saveWorkout();
    router.push("/dashboard");
  };

  return (
    <div>
      {/* Fortress header */}
      <div className="relative rounded-xl overflow-hidden mb-4 border border-[#7a5c35]/30">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/river-mist.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1208]/85 via-[#1a1208]/60 to-transparent" />
        <div className="relative p-5">
          <h2 className="font-display text-xl font-bold text-[#d4bc8e] drop-shadow">Новый Подвиг</h2>
          <p className="text-[#d4bc8e] text-sm mt-1 drop-shadow">Запиши свой подвиг</p>
        </div>
      </div>

      <input
        type="date"
        value={currentWorkout.date}
        onChange={(e) =>
          useWorkoutStore.setState({
            currentWorkout: { ...currentWorkout, date: e.target.value },
          })
        }
        className="w-full px-4 py-3 bg-[#2a1f0f] border-2 border-[#7a5c35]/40 rounded-xl text-[#e8dcc8] mb-4 focus:outline-none focus:border-[#8b2525]/60"
      />

      {/* Wisdom of ancestors - suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-display text-[#b89a6a] mb-2">
            &#x2726; Мудрость Предков
          </h3>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <motion.button
                key={s.exerciseName}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAddFromSuggestion(s.exerciseName)}
                className="w-full text-left card-wood rounded-xl p-3 border border-[#8b2525]/20 hover:border-[#8b2525]/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[#e8dcc8] font-medium">{s.exerciseName}</span>
                  <span className="text-[#d4bc8e] text-sm">{s.suggestedWeight}кг x {s.suggestedReps}</span>
                </div>
                <p className="text-[#9b7a4a] text-xs mt-1">{s.reason}</p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Add exercise */}
      <div className="flex gap-2 mb-4">
        <input
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddExercise()}
          placeholder="Название упражнения"
          className="flex-1 px-4 py-3 bg-[#2a1f0f] border-2 border-[#7a5c35]/40 rounded-xl text-[#e8dcc8] placeholder-[#9b7a4a] focus:outline-none focus:border-[#8b2525]/60"
        />
        <button
          onClick={handleAddExercise}
          className="px-4 py-3 bg-[#3d2e18] hover:bg-[#5a4428] rounded-xl text-[#d4bc8e] border border-[#7a5c35]/30 transition-colors"
        >
          Добавить
        </button>
      </div>

      <AnimatePresence>
        <div className="space-y-4 mb-6">
          {currentWorkout.exercises.map((exercise, i) => (
            <ExerciseCard
              key={i} exercise={exercise} index={i}
              onAddSet={() => addSet(i)}
              onUpdateSet={(si, data) => updateSet(i, si, data)}
              onRemoveSet={(si) => removeSet(i, si)}
              onSetDifficulty={(d) => setDifficulty(i, d)}
              onRemove={() => removeExercise(i)}
            />
          ))}
        </div>
      </AnimatePresence>

      {currentWorkout.exercises.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-[#5a4428] to-[#7a5c35] hover:from-[#7a5c35] hover:to-[#9b7a4a] disabled:opacity-50 rounded-xl text-[#a83232] font-display font-bold text-lg border-2 border-[#8b2525]/40 transition-all"
        >
          {loading ? "Записываю в летопись..." : "Запечатлеть Подвиг"}
        </motion.button>
      )}
    </div>
  );
}
