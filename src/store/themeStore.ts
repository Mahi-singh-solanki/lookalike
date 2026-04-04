import { create } from "zustand";

export type AppTheme = "light" | "dark" | "aurora";

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const order: AppTheme[] = ["light", "dark", "aurora"];

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  setTheme: (theme) => set({ theme }),
  cycleTheme: () => {
    const current = get().theme;
    const index = order.indexOf(current);
    const next = order[(index + 1) % order.length] ?? "light";
    set({ theme: next });
  },
}));
