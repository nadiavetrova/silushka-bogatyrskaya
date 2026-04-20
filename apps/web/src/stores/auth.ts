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
  hydrate: () => Promise<void>;
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
    const verified = user.emailVerified === true;
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

  hydrate: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ hydrated: true });
      return;
    }

    // Проверяем срок действия токена локально (быстро, без запроса)
    let payload: { userId: string; exp?: number };
    try {
      payload = JSON.parse(atob(token.split(".")[1]));
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("emailVerified");
      set({ hydrated: true });
      return;
    }

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      // Токен истёк — выходим
      localStorage.removeItem("token");
      localStorage.removeItem("emailVerified");
      set({ hydrated: true });
      return;
    }

    // Проверяем токен на сервере и получаем свежие данные (включая emailVerified из базы)
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        // Токен недействителен на сервере — выходим
        localStorage.removeItem("token");
        localStorage.removeItem("emailVerified");
        set({ hydrated: true });
        return;
      }

      if (res.ok) {
        const user = await res.json();
        // Обновляем localStorage свежими данными из базы
        localStorage.setItem("emailVerified", String(user.emailVerified));
        if (user.name) localStorage.setItem("userName", user.name);
        set({
          token,
          user: { id: user.id, email: user.email, name: user.name },
          emailVerified: user.emailVerified,
          hydrated: true,
        });
        return;
      }
    } catch {
      // Нет интернета или сервер не отвечает — используем данные из localStorage
    }

    // Fallback: доверяем localStorage (offline-режим)
    const name = localStorage.getItem("userName") || "";
    const verified = localStorage.getItem("emailVerified") === "true";
    set({
      token,
      user: { id: payload.userId, email: "", name },
      emailVerified: verified,
      hydrated: true,
    });
  },
}));
