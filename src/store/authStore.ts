import { create } from "zustand";
import { api } from "@/lib/api";
import { isUnauthorized } from "@/lib/errors";
import { notifyError, notifySuccess } from "@/lib/notify";
import {
  authResponseSchema,
  logoutResponseSchema,
  type User,
} from "@/types/api";
import type { LoginFormValues, RegisterFormValues } from "@/types/forms";

export type AuthStatus = "idle" | "loading" | "authenticated";

type AuthState = {
  user: User | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  login: (payload: LoginFormValues) => Promise<boolean>;
  register: (payload: RegisterFormValues) => Promise<boolean>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  refresh: async () => {
    set({ status: "loading" });
    try {
      const data = await api.get("/auth/me", authResponseSchema);
      set({ user: data.user, status: "authenticated" });
    } catch (error) {
      if (isUnauthorized(error)) {
        set({ user: null, status: "idle" });
        return;
      }
      set({ status: "idle" });
      notifyError(error, "Unable to refresh session.");
    }
  },
  login: async (payload) => {
    set({ status: "loading" });
    try {
      const data = await api.post("/auth/login", payload, authResponseSchema);
      set({ user: data.user, status: "authenticated" });
      notifySuccess("Welcome back", "You are signed in and ready to compete.");
      return true;
    } catch (error) {
      set({ status: "idle" });
      notifyError(error, "Unable to sign in.");
      return false;
    }
  },
  register: async (payload) => {
    set({ status: "loading" });
    try {
      const data = await api.post("/auth/register", payload, authResponseSchema);
      set({ user: data.user, status: "authenticated" });
      notifySuccess("Account created", "Your arena profile is ready.");
      return true;
    } catch (error) {
      set({ status: "idle" });
      notifyError(error, "Unable to create account.");
      return false;
    }
  },
  logout: async () => {
    set({ status: "loading" });
    try {
      await api.post("/auth/logout", undefined, logoutResponseSchema);
      set({ user: null, status: "idle" });
      notifySuccess("Signed out", "We saved your last progress.");
    } catch (error) {
      set({ status: "idle" });
      notifyError(error, "Unable to sign out.");
    }
  },
}));

