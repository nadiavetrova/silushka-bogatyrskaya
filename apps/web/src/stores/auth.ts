"use client";

import { create } from "zustand";
import type { UserData } from "../lib/types";
import { api } from "@/lib/api";

interface AuthState {
  user: UserData | null;
  token: string | null;
  hydrated: boolean;
  emailVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendCode: () => Promise<void>;
  isNewUser: boolean;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  isNewUser: false,
  emailVerified: false,

  login: async (email, password) => {
    const { token, user } = await api.login({ email, password });
    localStorage.setItem("token", token);
    if (user.name) localStorage.setItem("userName", user.name);
    const verified = (user as Record<string, unknown>).emailVerified === true;
    localStorage.setItem("emailVerified", String(verified));
    set({ token, user, isNewUser: false, emailVerified: verified });
  },

  register: async (email, password, name) => {
    const { token, user } = await api.register({ email, password, name });
    localStorage.setItem("token", token);
    if (user.name) localStorage.setItem("userName", user.name);
    localStorage.setItem("emailVerified", "false");
    set({ token, user, isNewUser: true, emailVerified: false });
  },

  verifyEmail: async (code: string) => {
    await api.verifyEmail({ code });
    localStorage.setItem("emailVerified", "true");
    set({ emailVerified: true });
  },

  resendCode: async () => {
    await api.resendCode();
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("emailVerified");
    set({ token: null, user: null, emailVerified: false });
  },

  hydrate: () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const name = localStorage.getItem("userName") || "";
        const verified = localStorage.getItem("emailVerified") === "true";
        set({ token, user: { id: payload.userId, email: "", name }, hydrated: true, emailVerified: verified });
      } catch {
        localStorage.removeItem("token");
        set({ hydrated: true });
      }
    } else {
      set({ hydrated: true });
    }
  },
}));
