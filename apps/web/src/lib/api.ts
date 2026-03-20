import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  WorkoutData,
  CreateWorkoutRequest,
  ExerciseData,
  CreateExerciseRequest,
  AdaptationSuggestion,
  ProfileData,
  UpdateProfileRequest,
  MeasurementData,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";


async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }

  return res.json();
}

export const api = {
  register: (data: RegisterRequest) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: LoginRequest) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getWorkouts: () => request<WorkoutData[]>("/workouts"),
  getWorkout: (id: string) => request<WorkoutData>(`/workouts/${id}`),
  createWorkout: (data: CreateWorkoutRequest) =>
    request<WorkoutData>("/workouts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createExercise: (data: CreateExerciseRequest) =>
    request<ExerciseData>("/exercises", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteWorkout: (id: string) =>
    request<{ message: string }>(`/workouts/${id}`, { method: "DELETE" }),
  getNextWorkout: () =>
    request<{ suggestions: AdaptationSuggestion[] }>("/workouts/next"),
  getProfile: () => request<ProfileData>("/profile"),
  updateProfile: (data: UpdateProfileRequest) =>
    request<ProfileData>("/profile", { method: "PUT", body: JSON.stringify(data) }),
  deleteAccount: () =>
    request<{ message: string }>("/profile", { method: "DELETE" }),
  getMeasurements: () => request<MeasurementData[]>("/profile/measurements"),
  createMeasurement: (data: Omit<MeasurementData, "id" | "date">) =>
    request<MeasurementData>("/profile/measurements", { method: "POST", body: JSON.stringify(data) }),
};
