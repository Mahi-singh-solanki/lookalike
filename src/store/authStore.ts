import { create } from "zustand";
import { authApi } from "../lib/api";
import type { UserProfile } from "../types/form";

const parseAuthError = (error: any, fallback: string) => {
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.code === "ERR_NETWORK") return "Backend is unreachable. Start FastAPI and verify VITE_API_BASE_URL.";
  return fallback;
};

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  hydrate: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("formflow_token"),
  user: null,
  loading: false,
  error: null,
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { access_token } = await authApi.login({ email, password });
      localStorage.setItem("formflow_token", access_token);
      const user = await authApi.me();
      set({ token: access_token, user, loading: false });
      return true;
    } catch (error: any) {
      set({ loading: false, error: parseAuthError(error, "Login failed") });
      return false;
    }
  },
  signup: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      await authApi.signup({ name, email, password });
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({ loading: false, error: parseAuthError(error, "Signup failed") });
      return false;
    }
  },
  hydrate: async () => {
    const token = localStorage.getItem("formflow_token");
    if (!token) {
      return;
    }

    set({ token, loading: true });
    try {
      const user = await authApi.me();
      set({ user, loading: false });
    } catch {
      localStorage.removeItem("formflow_token");
      set({ token: null, user: null, loading: false });
    }
  },
  logout: () => {
    localStorage.removeItem("formflow_token");
    set({ token: null, user: null, error: null });
  },
}));
