import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CircleHelp,
  Download,
  FileText,
  House,
  LayoutTemplate,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  User,
} from "lucide-react";
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

type SaveState = "idle" | "saving" | "saved";
type HomeTab = "home" | "forms" | "templates" | "help";

const templateMock = [
  { id: "tmp-1", title: "Customer Feedback", subtitle: "NPS + free text" },
  { id: "tmp-2", title: "Project Intake", subtitle: "Scope + timeline" },
  { id: "tmp-3", title: "Hiring Pipeline", subtitle: "Role scorecard" },
];

const statsMock = [
  { label: "Total Forms", value: "14", tone: "from-[#dccbf2] to-[#cdb6e7]" },
  { label: "Total Responses", value: "50", tone: "from-[#dce8ef] to-[#cbdde7]" },
  { label: "Active Forms", value: "5", tone: "from-[#e2c6ef] to-[#d2aee6]" },
  { label: "This Month", value: "↑37%", tone: "from-[#e5dfef] to-[#d8d1e5]" },
];

const sidebarItems = [
  { id: "menu", label: "Menu", icon: Menu, type: "action" as const },
  { id: "create", label: "Create", icon: Plus, type: "create" as const },
  { id: "home", label: "Home", icon: House, type: "tab" as const, tab: "home" as HomeTab },
  { id: "forms", label: "Forms", icon: FileText, type: "tab" as const, tab: "forms" as HomeTab },
  { id: "responses", label: "Responses", icon: Download, type: "responses" as const },
  { id: "templates", label: "Templates", icon: LayoutTemplate, type: "tab" as const, tab: "templates" as HomeTab },
  { id: "help", label: "Help", icon: CircleHelp, type: "tab" as const, tab: "help" as HomeTab },
];

export const BuilderPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const pushToast = useUiStore((state) => state.pushToast);
  const darkMode = useUiStore((state) => state.darkMode);
  const toggleDarkMode = useUiStore((state) => state.toggleDarkMode);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

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

  const [activeTab, setActiveTab] = useState<HomeTab>("home");
  const [query, setQuery] = useState("");
  const [loadingForms, setLoadingForms] = useState(false);
  const [myForms, setMyForms] = useState<Array<{ id: number; title: string; created_at: string }>>([]);
  const [publishedMap, setPublishedMap] = useState<Record<number, boolean>>({});

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
        const statuses = await Promise.all(
          forms.map(async (entry) => {
            try {
              const full = await formsApi.get(entry.id);
              return [entry.id, !Boolean(full.is_expired)] as const;
            } catch {
              return [entry.id, false] as const;
            }
          }),
        );
        setPublishedMap(Object.fromEntries(statuses));
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

  const recents = useMemo(() => {
    if (filteredForms.length > 0) {
      return filteredForms.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        meta: `Updated ${new Date(item.created_at).toLocaleDateString()}`,
        responses: `${Math.max(5, item.id % 20)} responses`,
      }));
    }
    return [
      { id: -1, title: "Hiring Intake", meta: "Updated 2 hours ago", responses: "12 responses" },
      { id: -2, title: "Bug Triage Survey", meta: "Updated yesterday", responses: "19 responses" },
      { id: -3, title: "Workshop RSVP", meta: "Updated 3 days ago", responses: "8 responses" },
    ];
  }, [filteredForms]);

  const onCreate = async () => {
    try {
      const id = await createForm("Untitled FormFlow");
      if (id) navigate(`/builder/${id}`);
    } catch {
      pushToast({ title: "Failed to create form", tone: "error" });
    }
  };

  const onResponses = () => {
    if (myForms[0]?.id) {
      navigate(`/vault/${myForms[0].id}`);
      return;
    }
    pushToast({ title: "No form available for responses yet" });
  };

  const mainContent = () => {
    if (activeTab === "forms") {
      return (
        <section className="px-10 py-8">
          <h2 className="text-3xl font-semibold text-slate-700 dark:text-slate-200">Forms</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All forms connected to your account.</p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredForms.map((form) => (
              <motion.button
                key={form.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/builder/${form.id}`)}
                className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
              >
                <div className="text-base font-semibold text-slate-700 dark:text-slate-100">{form.title}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Created {new Date(form.created_at).toLocaleDateString()}
                </div>
                <div className="mt-3 text-xs">
                  <span
                    className={`rounded-full px-2 py-1 ${
                      publishedMap[form.id] ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                    }`}
                  >
                    {publishedMap[form.id] ? "Published" : "Unpublished"}
                  </span>
                </div>
              </motion.button>
            ))}
            {!loadingForms && filteredForms.length === 0 && (
              <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                No forms yet. Click Create to start.
              </div>
            )}
          </div>
        </section>
      );
    }

    if (activeTab === "templates") {
      return (
        <section className="px-10 py-8">
          <h2 className="text-3xl font-semibold text-slate-700 dark:text-slate-200">Templates</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Starter layouts to jump into creation quickly.</p>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {templateMock.map((template) => (
              <motion.article
                key={template.id}
                whileHover={{ y: -3 }}
                className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
              >
                <div className="mb-4 h-28 rounded-2xl border border-slate-200/80 bg-slate-100/90 dark:border-slate-700 dark:bg-slate-800/80" />
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-100">{template.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{template.subtitle}</div>
              </motion.article>
            ))}
          </div>
        </section>
      );
    }

    if (activeTab === "help") {
      return (
        <section className="px-10 py-8">
          <h2 className="text-3xl font-semibold text-slate-700 dark:text-slate-200">Help</h2>
          <div className="mt-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            Need help? Open a form and use the AI assistant (Cmd/Ctrl + K), or use the Forms tab to continue existing work.
          </div>
        </section>
      );
    }

    return (
      <>
        <section className="px-10 pt-10">
          <div className="text-center">
            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              <span className="bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent">Start </span>
              <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">building </span>
              <span className="bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent">your next form</span>
            </h1>
            <p className="mt-1 text-right text-sm italic text-sky-700 dark:text-sky-300">drag, drop, add logic, &amp; go live in minutes</p>
          </div>

          <div className="mt-8 flex justify-center">
            <label className="flex w-[min(760px,90%)] items-center gap-2 rounded-full border border-slate-300 bg-slate-100/95 px-5 py-4 text-lg text-slate-500 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300">
              <Search className="h-5 w-5" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search forms, templates and more"
                className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-500 dark:text-slate-200"
              />
            </label>
          </div>
        </section>

        <section className="px-10 pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {statsMock.map((item) => (
              <motion.article
                key={item.label}
                whileHover={{ y: -2 }}
                className={`rounded-2xl border border-slate-300/70 bg-gradient-to-br ${item.tone} p-4 shadow-sm dark:border-slate-700 dark:from-slate-800 dark:to-slate-700`}
              >
                <div className="text-[32px] font-bold text-slate-700 dark:text-slate-100">{item.value}</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.label}</div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="px-10 pt-10">
          <h2 className="text-4xl font-medium text-slate-700 dark:text-slate-200">Popular Templates</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {templateMock.map((template) => (
              <motion.article
                key={template.id}
                whileHover={{ y: -3 }}
                className="rounded-3xl border border-slate-300/70 bg-white/65 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/55"
              >
                <div className="h-28 rounded-2xl border border-slate-300/70 bg-slate-100/90 dark:border-slate-700 dark:bg-slate-800/70" />
                <div className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-100">{template.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{template.subtitle}</div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="px-10 pb-10 pt-10">
          <h2 className="text-4xl font-medium text-slate-700 dark:text-slate-200">Recents</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {recents.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ y: -3 }}
                onClick={() => (item.id > 0 ? navigate(`/builder/${item.id}`) : onCreate())}
                className="rounded-3xl border border-slate-300/70 bg-white/65 p-5 text-left shadow-sm dark:border-slate-700 dark:bg-slate-900/55"
              >
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-100">{item.title}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.meta}</div>
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">{item.responses}</div>
              </motion.button>
            ))}
          </div>
        </section>
      </>
    );
  };

  if (isEditorMode) {
    return (
      <div className="shell-screen grain-layer">
        <div className="shell-container">
          <aside className="shell-sidebar">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.type === "create") return void onCreate();
                    if (item.type === "responses") return onResponses();
                    if (item.type === "tab" && item.tab === "home") return navigate("/builder");
                    if (item.type === "tab") pushToast({ title: `${item.label} available on Home` });
                  }}
                  className={`shell-nav-item ${item.id === "create" ? "active" : ""}`}
                >
                  <span className="shell-nav-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="shell-nav-label">{item.label}</span>
                </button>
              );
            })}
            <button className="shell-nav-item mt-auto" onClick={toggleDarkMode}>
              <span className="shell-nav-icon">{darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</span>
              <span className="shell-nav-label">Theme</span>
            </button>
            <button className="shell-nav-item">
              <span className="shell-nav-icon">
                <Bell className="h-5 w-5" />
              </span>
            </button>
            <button className="shell-nav-item">
              <span className="shell-nav-icon">
                <Settings className="h-5 w-5" />
              </span>
              <span className="shell-nav-label">Settings</span>
            </button>
            <button className="shell-nav-item">
              <span className="shell-nav-icon">
                <User className="h-5 w-5" />
              </span>
              <span className="shell-nav-label">Profile</span>
            </button>
          </aside>

          <main className="shell-main overflow-hidden">
            <div className="builder-editor-bg relative min-h-full overflow-hidden rounded-r-[28px]">
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
                className="pointer-events-none fixed bottom-3 right-4 z-30 rounded-xl border border-white/20 bg-black/40 px-3 py-1 text-xs text-white"
              >
                {history.length} revisions
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
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="shell-screen grain-layer">
      <div className="shell-container">
        <aside className="shell-sidebar">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.type === "tab" && item.tab === activeTab;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.type === "create") return void onCreate();
                  if (item.type === "responses") return onResponses();
                  if (item.type === "tab") return setActiveTab(item.tab);
                  pushToast({ title: `${item.label} opened` });
                }}
                className={`shell-nav-item ${isActive ? "active" : ""}`}
              >
                <span className="shell-nav-icon">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="shell-nav-label">{item.label}</span>
              </button>
            );
          })}
          <button className="shell-nav-item mt-auto" onClick={toggleDarkMode}>
            <span className="shell-nav-icon">{darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</span>
            <span className="shell-nav-label">Theme</span>
          </button>
          <button className="shell-nav-item">
            <span className="shell-nav-icon">
              <Bell className="h-5 w-5" />
            </span>
          </button>
          <button className="shell-nav-item">
            <span className="shell-nav-icon">
              <Settings className="h-5 w-5" />
            </span>
            <span className="shell-nav-label">Settings</span>
          </button>
          <button className="shell-nav-item">
            <span className="shell-nav-icon">
              <User className="h-5 w-5" />
            </span>
            <span className="shell-nav-label">Profile</span>
          </button>
        </aside>

        <main className="shell-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="min-h-full rounded-r-[28px]"
            >
              {mainContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};
