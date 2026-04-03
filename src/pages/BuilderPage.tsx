import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Compass, FileText, Plus, Search, Sparkles } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { formsApi } from "../lib/api";
import { useBuilderStore } from "../store/builderStore";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";
import { BuilderCanvas } from "../components/builder/BuilderCanvas";
import { TopToolbar } from "../components/builder/TopToolbar";
import { SettingsPanel } from "../components/builder/SettingsPanel";
import { LogicMapPanel } from "../components/builder/LogicMapPanel";
import { LivePreview } from "../components/builder/LivePreview";
import { AccessPanel } from "../components/builder/AccessPanel";
import { CommandPalette } from "../components/builder/CommandPalette";

const templateMock = [
  {
    id: "tmp-feedback",
    title: "Product Feedback",
    subtitle: "Collect voice-of-customer insights in one flow",
    badge: "Template",
  },
  {
    id: "tmp-onboarding",
    title: "Client Onboarding",
    subtitle: "Capture project context and team details fast",
    badge: "Template",
  },
  {
    id: "tmp-event",
    title: "Event Registration",
    subtitle: "Run RSVPs, preferences, and follow-ups",
    badge: "Template",
  },
];

const statsMock = [
  { label: "Total Forms", value: "14" },
  { label: "Total Responses", value: "50" },
  { label: "Active Forms", value: "5" },
  { label: "Monthly Growth", value: "+37%" },
];

type SaveState = "idle" | "saving" | "saved";

export const BuilderPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const pushToast = useUiStore((state) => state.pushToast);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setCommandPalette = useUiStore((state) => state.setCommandPalette);

  const {
    formId,
    schema,
    history,
    isPublished,
    setFormId,
    loadForm,
    createForm,
    connectRealtime,
    disconnectRealtime,
    togglePublish,
    updateSchemaLocal,
    autoArrange,
  } = useBuilderStore();

  const [myForms, setMyForms] = useState<Array<{ id: number; title: string; created_at: string }>>([]);
  const [query, setQuery] = useState("");
  const [loadingForms, setLoadingForms] = useState(false);
  const [logicOpen, setLogicOpen] = useState(false);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const currentUserName = useMemo(() => user?.name ?? user?.email ?? "Designer", [user]);
  const formIdFromUrl = Number(params.formId);
  const isEditorMode = Number.isFinite(formIdFromUrl) && formIdFromUrl > 0;

  useEffect(() => {
    if (!token) navigate("/");
  }, [navigate, token]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoadingForms(true);
      try {
        const forms = await formsApi.listMyForms();
        setMyForms(forms);
      } catch {
        pushToast({ title: "Could not load forms" });
      } finally {
        setLoadingForms(false);
      }
    };
    void load();
  }, [pushToast, token]);

  useEffect(() => {
    if (!isEditorMode) return;
    void loadForm(formIdFromUrl).then(() => setFormId(formIdFromUrl));
  }, [formIdFromUrl, isEditorMode, loadForm, setFormId]);

  useEffect(() => {
    if (!isEditorMode || !user || !formIdFromUrl) return;
    connectRealtime(currentUserName, String(user.id));
    return () => disconnectRealtime();
  }, [connectRealtime, currentUserName, disconnectRealtime, formIdFromUrl, isEditorMode, user]);

  useEffect(() => {
    if (!isEditorMode) return;
    setSaveState("saving");
    const timer = setTimeout(() => setSaveState("saved"), 700);
    return () => clearTimeout(timer);
  }, [isEditorMode, schema]);

  const filteredForms = useMemo(() => {
    if (!query.trim()) return myForms;
    const lowered = query.toLowerCase();
    return myForms.filter((item) => item.title.toLowerCase().includes(lowered));
  }, [myForms, query]);

  const recentCards = useMemo(() => {
    if (filteredForms.length > 0) {
      return filteredForms.slice(0, 6).map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: `Created ${new Date(item.created_at).toLocaleDateString()}`,
      }));
    }
    return [
      { id: -1, title: "Hiring Intake Form", subtitle: "Updated 2 hours ago" },
      { id: -2, title: "Bug Triage Survey", subtitle: "Updated yesterday" },
      { id: -3, title: "Workshop RSVP", subtitle: "Updated 3 days ago" },
    ];
  }, [filteredForms]);

  if (!isEditorMode) {
    return (
      <div className="builder-dashboard-bg min-h-screen p-5 md:p-8">
        <div className="mx-auto max-w-[1260px]">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-100 md:text-5xl">
                Start building your next form
              </h1>
              <p className="mt-2 text-sm text-slate-300">A design-first workspace for dynamic form experiences.</p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300/25 px-4 py-2 text-sm font-semibold text-cyan-50"
              onClick={async () => {
                try {
                  const id = await createForm("Untitled FormFlow");
                  if (id) navigate(`/builder/${id}`);
                } catch {
                  pushToast({ title: "Failed to create form", tone: "error" });
                }
              }}
            >
              <Plus className="h-4 w-4" />
              New Form
            </button>
          </header>

          <div className="mb-7">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/45 px-4 py-3 text-sm text-slate-300">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search forms, templates, and drafts"
                className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
              />
            </label>
          </div>

          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statsMock.map((item) => (
              <motion.article
                key={item.label}
                whileHover={{ y: -3 }}
                className="rounded-3xl border border-white/10 bg-slate-900/45 p-4 shadow-soft"
              >
                <div className="text-xs uppercase tracking-wide text-slate-400">{item.label}</div>
                <div className="mt-2 text-3xl font-bold text-slate-100">{item.value}</div>
              </motion.article>
            ))}
          </section>

          <section className="mb-9">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Popular Templates</h2>
              <button className="text-xs text-slate-300">Browse all</button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {templateMock.map((template) => (
                <motion.article
                  key={template.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="rounded-3xl border border-cyan-200/20 bg-gradient-to-br from-slate-900/70 to-slate-950/70 p-5 shadow-soft"
                >
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2 py-1 text-[11px] text-slate-200">
                    <Sparkles className="h-3 w-3" />
                    {template.badge}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-100">{template.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{template.subtitle}</p>
                  <button
                    className="mt-4 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100"
                    onClick={() => pushToast({ title: `${template.title} template selected` })}
                  >
                    Use Template
                  </button>
                </motion.article>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Recent Forms</h2>
              {loadingForms && <span className="text-xs text-slate-400">Loading...</span>}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recentCards.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ y: -3 }}
                  className="rounded-3xl border border-white/10 bg-slate-900/45 p-5 text-left shadow-soft"
                  onClick={() => {
                    if (item.id > 0) {
                      navigate(`/builder/${item.id}`);
                      return;
                    }
                    pushToast({ title: "Create your first live form to open editor" });
                  }}
                >
                  <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] text-slate-300">
                    <FileText className="h-3 w-3" />
                    Form
                  </div>
                  <div className="text-base font-semibold text-slate-100">{item.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{item.subtitle}</div>
                </motion.button>
              ))}
            </div>
          </section>
        </div>
        <CommandPalette />
      </div>
    );
  }

  return (
    <div className="builder-editor-bg relative min-h-screen overflow-hidden">
      <TopToolbar
        onOpenAccess={() => setAccessOpen(true)}
        logicOpen={logicOpen}
        onToggleLogic={() => setLogicOpen((prev) => !prev)}
        onAutoArrange={() => autoArrange()}
        formTitle={schema.title}
        onFormTitleChange={(title) => updateSchemaLocal({ ...schema, title })}
        isPublished={isPublished}
        onTogglePublish={() => {
          void togglePublish()
            .then((nextPublished) => {
              if (nextPublished && formId) {
                const url = `${window.location.origin}/stage/${formId}`;
                setPublishedUrl(url);
                pushToast({ title: "Form published", description: url });
                return;
              }
              setPublishedUrl(null);
            })
            .catch(() => pushToast({ title: "Publish update failed", tone: "error" }));
        }}
        saveState={saveState}
      />

      <BuilderCanvas collapsedLibrary={libraryCollapsed} onToggleLibrary={() => setLibraryCollapsed((prev) => !prev)} />
      <SettingsPanel username={currentUserName} />
      <LogicMapPanel schema={schema} visible={logicOpen} />
      <LivePreview schema={schema} />
      <AccessPanel formId={formId} open={accessOpen} onClose={() => setAccessOpen(false)} />
      <CommandPalette />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-none fixed bottom-5 right-5 z-30 rounded-2xl border border-white/10 bg-slate-950/65 px-3 py-2 text-xs text-slate-200 shadow-soft"
      >
        <div className="inline-flex items-center gap-2">
          <Compass className="h-3.5 w-3.5 text-cyan-300" />
          <span>{history.length} revisions captured</span>
        </div>
      </motion.div>

      {publishedUrl && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-5 left-1/2 z-30 w-[min(92vw,680px)] -translate-x-1/2 rounded-2xl border border-emerald-200/30 bg-emerald-300/10 p-3 shadow-soft"
        >
          <div className="mb-2 text-xs font-semibold text-emerald-100">Published URL</div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={publishedUrl}
              className="min-w-[280px] flex-1 rounded-xl border border-white/20 bg-slate-950/55 px-3 py-2 text-xs text-slate-100"
            />
            <button
              className="rounded-xl bg-emerald-300/30 px-3 py-2 text-xs font-semibold text-emerald-50"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(publishedUrl);
                  pushToast({ title: "Link copied" });
                } catch {
                  pushToast({ title: "Copy failed", tone: "error" });
                }
              }}
            >
              Copy URL
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
