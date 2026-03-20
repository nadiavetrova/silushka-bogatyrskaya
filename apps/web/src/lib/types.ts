export type Difficulty = "easy" | "medium" | "hard";

export interface SetData {
  id?: string;
  reps: number;
  weight: number;
  order: number;
}

export interface ExerciseData {
  id?: string;
  name: string;
  difficulty: Difficulty;
  sets: SetData[];
}

export interface WorkoutData {
  id?: string;
  date: string;
  exercises: ExerciseData[];
  createdAt?: string;
}

export interface UserData {
  id: string;
  email: string;
  name?: string;
}

// Auth
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserData;
}

// Workouts
export interface CreateWorkoutRequest {
  date: string;
  exercises: ExerciseData[];
}

export interface CreateExerciseRequest {
  workoutId: string;
  name: string;
  difficulty: Difficulty;
  sets: SetData[];
}

// Adaptation
export interface AdaptationSuggestion {
  exerciseName: string;
  suggestedWeight: number;
  suggestedReps: number;
  reason: string;
}
