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
