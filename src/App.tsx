import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { BuilderPage } from "./pages/BuilderPage";
import { StagePage } from "./pages/StagePage";
import { VaultPage } from "./pages/VaultPage";
import { ToastHost } from "./components/common/ToastHost";
import { useAuthStore } from "./store/authStore";
import { useUiStore } from "./store/uiStore";

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const commandPalette = useUiStore((state) => state.commandPalette);
  const setCommandPalette = useUiStore((state) => state.setCommandPalette);
  const darkMode = useUiStore((state) => state.darkMode);
  const toggleDarkMode = useUiStore((state) => state.toggleDarkMode);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPalette(!commandPalette);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandPalette, setCommandPalette]);

  useEffect(() => {
    const saved = localStorage.getItem("formflow_theme");
    if (!saved) {
      localStorage.setItem("formflow_theme", "light");
      if (darkMode) toggleDarkMode();
      return;
    }
    const shouldDark = saved === "dark";
    if (shouldDark !== darkMode) toggleDarkMode();
    // initialize from persisted preference only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", darkMode);
    document.body.classList.toggle("theme-light", !darkMode);
    localStorage.setItem("formflow_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/builder/:formId" element={<BuilderPage />} />
        <Route path="/stage/:formId" element={<StagePage />} />
        <Route path="/vault/:formId" element={<VaultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
    </>
  );
}
