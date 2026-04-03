import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Search } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { formsApi, responsesApi } from "../lib/api";
import type { FormResponse } from "../types/form";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";

export const VaultPage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const token = useAuthStore((state) => state.token);

  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FormResponse | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const numericFormId = Number(formId);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    if (!numericFormId) return;

    const load = async () => {
      try {
        const myForms = await formsApi.listMyForms();
        const allowed = myForms.some((form) => form.id === numericFormId);
        setHasAccess(allowed);
        if (!allowed) {
          pushToast({ title: "Access denied", description: "You do not have vault access for this form.", tone: "error" });
          return;
        }
        const data = await responsesApi.get(numericFormId);
        setResponses(data);
      } catch {
        pushToast({ title: "Failed to fetch responses" });
      }
    };

    void load();
  }, [numericFormId, pushToast, token, navigate]);

  const filtered = useMemo(
    () => responses.filter((entry) => JSON.stringify(entry.answers).toLowerCase().includes(query.toLowerCase())),
    [query, responses],
  );

  if (hasAccess === false) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="rounded-3xl border border-rose-300/20 bg-rose-300/10 p-6">
          <h2 className="text-xl font-bold text-rose-100">Vault access denied</h2>
          <p className="mt-2 text-sm text-rose-50/80">Only form owners/admins can view responses.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-page-bg min-h-screen p-5 md:p-8">
      <div className="mx-auto w-[min(1180px,96vw)] rounded-[24px] border border-slate-300/65 bg-white/70 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/65">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-700 dark:text-slate-100">Responses</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search, inspect, and export submissions.</p>
          </div>
          <a
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-100/90 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            href={responsesApi.exportCsvUrl(numericFormId)}
            target="_blank"
            rel="noreferrer"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </header>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-300 bg-white/90 p-4 text-center dark:border-slate-700 dark:bg-slate-800/80">
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-100">{responses.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Responses</div>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white/90 p-4 text-center dark:border-slate-700 dark:bg-slate-800/80">
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-100">{Math.round(responses.length / Math.max(1, 7))}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Avg / Day</div>
          </div>
          <div className="rounded-2xl border border-slate-300 bg-white/90 p-4 text-center dark:border-slate-700 dark:bg-slate-800/80">
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-100">{Math.max(0, 100 - responses.length)}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Trend Index</div>
          </div>
        </div>

        <label className="mb-5 flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100/90 px-5 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300">
          <Search className="h-4 w-4" />
          <input
            placeholder="Search responses"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-500 dark:text-slate-100"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((entry) => (
            <motion.button
              key={entry.id}
              layout
              whileHover={{ y: -2, scale: 1.01 }}
              onClick={() => setSelected(entry)}
              className="rounded-2xl border border-slate-300 bg-white/90 p-4 text-left shadow-sm dark:border-slate-700 dark:bg-slate-800/80"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">Response #{entry.id}</div>
              <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-100">{new Date(entry.submitted_at).toLocaleString()}</div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{Object.keys(entry.answers).length} answers captured</div>
            </motion.button>
          ))}
        </div>
      </div>

      {selected && (
        <motion.div
          className="fixed right-0 top-0 z-40 h-screen w-[400px] border-l border-slate-300 bg-white/96 p-5 shadow-xl dark:border-slate-700 dark:bg-slate-950/95"
          initial={{ x: 380 }}
          animate={{ x: 0 }}
        >
          <button className="mb-4 rounded-lg bg-slate-200 px-3 py-1 text-xs dark:bg-slate-800" onClick={() => setSelected(null)}>
            Close
          </button>
          <h2 className="mb-3 text-lg font-semibold text-slate-700 dark:text-slate-100">Response #{selected.id}</h2>
          <pre className="soft-scroll max-h-[80vh] overflow-auto rounded-xl bg-slate-100 p-3 text-xs text-slate-700 dark:bg-black/35 dark:text-slate-200">
            {JSON.stringify(selected.answers, null, 2)}
          </pre>
        </motion.div>
      )}
    </div>
  );
};
