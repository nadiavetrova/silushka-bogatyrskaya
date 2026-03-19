"use client";

import { create } from "zustand";
import type { UserData } from "../lib/types";
import { api } from "@/lib/api";

interface AuthState {
  user: UserData | null;
  token: string | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,

  login: async (email, password) => {
    const { token, user } = await api.login({ email, password });
    localStorage.setItem("token", token);
    set({ token, user });
  },

  register: async (email, password) => {
    const { token, user } = await api.register({ email, password });
    localStorage.setItem("token", token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },

  hydrate: () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        set({ token, user: { id: payload.userId, email: "" }, hydrated: true });
      } catch {
        localStorage.removeItem("token");
        set({ hydrated: true });
      }
    } else {
      set({ hydrated: true });
    }
  },
}));
