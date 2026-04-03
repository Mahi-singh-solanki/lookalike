import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";

export const AuthPage = () => {
  const navigate = useNavigate();
  const { login, signup, loading, error, token } = useAuthStore();
  const pushToast = useUiStore((state) => state.pushToast);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (token) {
      navigate("/builder");
    }
  }, [navigate, token]);

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass w-[min(460px,94vw)] rounded-[2rem] p-7">
        <h1 className="font-display text-2xl font-bold">FormFlow Canvas</h1>
        <p className="mt-1 text-sm text-slate-300">Design forms like a creative system.</p>

        <div className="mt-4 flex gap-2">
          <button className={`rounded-xl px-4 py-2 text-sm ${mode === "login" ? "bg-cyan-300/20" : "bg-white/10"}`} onClick={() => setMode("login")}>
            Login
          </button>
          <button className={`rounded-xl px-4 py-2 text-sm ${mode === "signup" ? "bg-cyan-300/20" : "bg-white/10"}`} onClick={() => setMode("signup")}>
            Signup
          </button>
        </div>

        <form
          className="mt-5 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const ok =
              mode === "login"
                ? await login(email, password)
                : await signup(name, email, password).then(async (success) => (success ? login(email, password) : false));

            if (!ok) {
              pushToast({ title: "Authentication failed", description: error ?? "Try again" });
              return;
            }

            pushToast({ title: "Welcome", description: "Collaboration session ready" });
            navigate("/builder");
          }}
        >
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              autoComplete="name"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2"
              required
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2"
            required
          />
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-cyan-300/30 px-4 py-2 text-sm font-semibold">
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
