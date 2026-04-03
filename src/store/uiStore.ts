import { create } from "zustand";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: "info" | "error" | "success";
}

interface UiState {
  darkMode: boolean;
  commandPalette: boolean;
  toasts: ToastItem[];
  toggleDarkMode: () => void;
  setCommandPalette: (open: boolean) => void;
  pushToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  darkMode: true,
  commandPalette: false,
  toasts: [],
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setCommandPalette: (open) => set({ commandPalette: open }),
  pushToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((entry) => entry.id !== id) }));
    }, 3000);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((entry) => entry.id !== id) })),
}));
