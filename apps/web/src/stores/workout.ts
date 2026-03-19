"use client";

import { create } from "zustand";
import type {
  WorkoutData,
  ExerciseData,
  SetData,
  Difficulty,
  AdaptationSuggestion,
} from "../lib/types";
import { api } from "@/lib/api";

interface WorkoutState {
  workouts: WorkoutData[];
  currentWorkout: { date: string; exercises: ExerciseData[] };
  suggestions: AdaptationSuggestion[];
  loading: boolean;
  fetchWorkouts: () => Promise<void>;
  fetchSuggestions: () => Promise<void>;
  addExercise: (name: string) => void;
  removeExercise: (index: number) => void;
  addSet: (exerciseIndex: number) => void;
  updateSet: (
    exerciseIndex: number,
    setIndex: number,
    data: Partial<SetData>
  ) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  setDifficulty: (exerciseIndex: number, difficulty: Difficulty) => void;
  saveWorkout: () => Promise<void>;
  resetCurrent: () => void;
}

const emptyWorkout = () => ({
  date: new Date().toISOString().split("T")[0],
  exercises: [],
});

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: [],
  currentWorkout: emptyWorkout(),
  suggestions: [],
  loading: false,

  fetchWorkouts: async () => {
    set({ loading: true });
    try {
      const workouts = await api.getWorkouts();
      set({ workouts });
    } finally {
      set({ loading: false });
    }
  },

  fetchSuggestions: async () => {
    try {
      const { suggestions } = await api.getNextWorkout();
      set({ suggestions });
    } catch {
      // No suggestions available
    }
  },

  addExercise: (name) => {
    const { currentWorkout } = get();
    set({
      currentWorkout: {
        ...currentWorkout,
        exercises: [
          ...currentWorkout.exercises,
          { name, difficulty: "medium", sets: [{ reps: 8, weight: 0, order: 0 }] },
        ],
      },
    });
  },

  removeExercise: (index) => {
    const { currentWorkout } = get();
    set({
      currentWorkout: {
        ...currentWorkout,
        exercises: currentWorkout.exercises.filter((_, i) => i !== index),
      },
    });
  },

  addSet: (exerciseIndex) => {
    const { currentWorkout } = get();
    const exercises = [...currentWorkout.exercises];
    const exercise = { ...exercises[exerciseIndex] };
    const lastSet = exercise.sets[exercise.sets.length - 1];
    exercise.sets = [
      ...exercise.sets,
      {
        reps: lastSet?.reps || 8,
        weight: lastSet?.weight || 0,
        order: exercise.sets.length,
      },
    ];
    exercises[exerciseIndex] = exercise;
    set({ currentWorkout: { ...currentWorkout, exercises } });
  },

  updateSet: (exerciseIndex, setIndex, data) => {
    const { currentWorkout } = get();
    const exercises = [...currentWorkout.exercises];
    const exercise = { ...exercises[exerciseIndex] };
    const sets = [...exercise.sets];
    sets[setIndex] = { ...sets[setIndex], ...data };
    exercise.sets = sets;
    exercises[exerciseIndex] = exercise;
    set({ currentWorkout: { ...currentWorkout, exercises } });
  },

  removeSet: (exerciseIndex, setIndex) => {
    const { currentWorkout } = get();
    const exercises = [...currentWorkout.exercises];
    const exercise = { ...exercises[exerciseIndex] };
    exercise.sets = exercise.sets
      .filter((_, i) => i !== setIndex)
      .map((s, i) => ({ ...s, order: i }));
    exercises[exerciseIndex] = exercise;
    set({ currentWorkout: { ...currentWorkout, exercises } });
  },

  setDifficulty: (exerciseIndex, difficulty) => {
    const { currentWorkout } = get();
    const exercises = [...currentWorkout.exercises];
    exercises[exerciseIndex] = { ...exercises[exerciseIndex], difficulty };
    set({ currentWorkout: { ...currentWorkout, exercises } });
  },

  saveWorkout: async () => {
    const { currentWorkout, fetchWorkouts } = get();
    set({ loading: true });
    try {
      await api.createWorkout({
        date: currentWorkout.date,
        exercises: currentWorkout.exercises,
      });
      set({ currentWorkout: emptyWorkout() });
      await fetchWorkouts();
    } finally {
      set({ loading: false });
    }
  },

  resetCurrent: () => set({ currentWorkout: emptyWorkout() }),
}));
