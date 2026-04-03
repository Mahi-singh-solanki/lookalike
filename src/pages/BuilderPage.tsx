import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  FileText,
  FolderKanban,
  HelpCircle,
  Home,
  House,
  LayoutTemplate,
  Menu,
  Plus,
  Search,
  Settings,
  // TrayArrowDown,
  User,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { formsApi } from "../lib/api";
import { CommandPalette } from "../components/builder/CommandPalette";
import { useBuilderStore } from "../store/builderStore";
import { useAuthStore } from "../store/authStore";
import { useUiStore } from "../store/uiStore";

const templateMock = [
  {
    id: "tmp-feedback",
    title: "Product Feedback",
    subtitle: "Collect user suggestions in 2 mins",
    accent: "from-[#f4e8ff] to-[#e7ddff]",
  },
  {
    id: "tmp-onboarding",
    title: "Client Onboarding",
    subtitle: "Kick off projects with clean intake",
    accent: "from-[#e6f4ff] to-[#d8ecff]",
  },
  {
    id: "tmp-event",
    title: "Event Registration",
    subtitle: "Capture attendees and preferences",
    accent: "from-[#ffe6f3] to-[#f5d9ff]",
  },
];

const recentsMock = [
  {
    id: "rec-01",
    title: "Hiring Intake Form",
    meta: "Updated 2 hours ago",
    count: "12 responses",
  },
  {
    id: "rec-02",
    title: "Bug Triage Survey",
    meta: "Updated yesterday",
    count: "19 responses",
  },
  {
    id: "rec-03",
    title: "Workshop RSVP",
    meta: "Updated 3 days ago",
    count: "8 responses",
  },
];

export const BuilderPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const pushToast = useUiStore((state) => state.pushToast);
  const { token, user } = useAuthStore();

  const { formId, schema, isPublished, setFormId, loadForm, createForm, connectRealtime, disconnectRealtime, togglePublish } = useBuilderStore();

  const [myForms, setMyForms] = useState<Array<{ id: number; title: string; created_at: string }>>([]);
  const [query, setQuery] = useState("");
  const [loadingForms, setLoadingForms] = useState(false);

  const currentUserName = useMemo(() => user?.name ?? user?.email ?? "Designer", [user]);

  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [navigate, token]);

  useEffect(() => {
    const formIdFromUrl = Number(params.formId);
    if (Number.isFinite(formIdFromUrl) && formIdFromUrl > 0) {
      void loadForm(formIdFromUrl).then(() => setFormId(formIdFromUrl));
      return;
    }

    if (!formId) {
      void createForm("Untitled FormFlow").then((id) => {
        if (id) {
          navigate(`/builder/${id}`, { replace: true });
        }
      });
    }
  }, [params.formId, formId, createForm, loadForm, navigate, setFormId]);

  useEffect(() => {
    if (!user || !formId) return;
    connectRealtime(currentUserName, String(user.id));
    return () => disconnectRealtime();
  }, [connectRealtime, currentUserName, disconnectRealtime, formId, user]);

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

  const totalForms = myForms.length || 14;
  const filteredForms = useMemo(() => {
    if (!query.trim()) return myForms;
    const lowered = query.toLowerCase();
    return myForms.filter((item) => item.title.toLowerCase().includes(lowered));
  }, [myForms, query]);

  const recentCards = useMemo(() => {
    if (filteredForms.length > 0) {
      return filteredForms.slice(0, 3).map((item, index) => ({
        id: `live-${item.id}`,
        title: item.title,
        meta: `Created ${new Date(item.created_at).toLocaleDateString()}`,
        count: `${8 + index * 7} responses`,
      }));
    }
    return recentsMock;
  }, [filteredForms]);

  const sidebarItems = [
    { id: "menu", label: "Menu", icon: Menu, action: () => pushToast({ title: "Menu opened" }) },
    {
      id: "create",
      label: "Create",
      icon: Plus,
      action: async () => {
        try {
          const id = await createForm("Untitled FormFlow");
          if (id) {
            pushToast({ title: "New form created" });
            navigate(`/builder/${id}`);
          }
        } catch {
          pushToast({ title: "Failed to create form", tone: "error" });
        }
      },
    },
    { id: "home", label: "Home", icon: House, action: () => pushToast({ title: "Already on home" }) },
    {
      id: "forms",
      label: "Forms",
      icon: FileText,
      action: () => {
        if (myForms[0]) {
          navigate(`/builder/${myForms[0].id}`);
          return;
        }
        pushToast({ title: "No forms yet", description: "Create one to get started" });
      },
    },
    {
      id: "responses",
      label: "Responses",
      icon: TrayArrowDown,
      action: () => {
        if (formId) {
          navigate(`/vault/${formId}`);
          return;
        }
        pushToast({ title: "No active form selected" });
      },
    },
    { id: "templates", label: "Templates", icon: LayoutTemplate, action: () => pushToast({ title: "Browse templates below" }) },
    { id: "help", label: "Help", icon: HelpCircle, action: () => pushToast({ title: "Help center coming soon" }) },
  ];

  return (
    <div className="builder-dashboard-bg min-h-screen p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1400px] overflow-hidden rounded-[34px] border border-[#b6d6ff] bg-[#f7f9fd]/95 shadow-[0_24px_80px_rgba(102,142,210,0.2)]">
        <aside className="w-[108px] shrink-0 border-r border-[#d8e4f7] bg-[#eef2f8] px-3 py-5">
          <nav className="flex h-full flex-col items-center gap-3">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === "home";
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`flex w-full flex-col items-center rounded-2xl px-2 py-3 text-center transition ${
                    active
                      ? "bg-white text-slate-800 shadow-[0_10px_24px_rgba(118,147,200,0.2)]"
                      : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  <span className="mt-1 text-[11px] font-medium">{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => pushToast({ title: "No new notifications" })}
              className="mt-2 flex w-full flex-col items-center rounded-2xl px-2 py-3 text-slate-500 transition hover:bg-white/70 hover:text-slate-800"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
            </button>

            <div className="mt-auto flex w-full flex-col gap-3">
              <button
                onClick={() => pushToast({ title: "Settings panel coming soon" })}
                className="flex w-full flex-col items-center rounded-2xl px-2 py-3 text-slate-500 transition hover:bg-white/70 hover:text-slate-800"
              >
                <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
                <span className="mt-1 text-[11px] font-medium">Settings</span>
              </button>
              <button
                onClick={() => pushToast({ title: `Signed in as ${currentUserName}` })}
                className="flex w-full flex-col items-center rounded-2xl px-2 py-3 text-slate-500 transition hover:bg-white/70 hover:text-slate-800"
              >
                <User className="h-[18px] w-[18px]" strokeWidth={2} />
                <span className="mt-1 text-[11px] font-medium">Profile</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="soft-scroll flex-1 overflow-y-auto px-5 py-7 sm:px-8 md:px-10">
          <header>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-[44px]">
                <span className="bg-gradient-to-r from-[#86c5ff] to-[#76aff0] bg-clip-text text-transparent">Start </span>
                <span className="bg-gradient-to-r from-[#8b63f5] via-[#c46df0] to-[#ec7dbf] bg-clip-text text-transparent">building </span>
                <span className="bg-gradient-to-r from-[#4e9ae8] to-[#77bef8] bg-clip-text text-transparent">your next form</span>
              </h1>
              <p className="text-sm italic text-slate-500 md:pb-2">drag, drop, add logic, &amp; go live in minutes</p>
            </div>
          </header>

          <div className="mt-7 flex justify-center">
            <label className="flex w-full max-w-[720px] items-center gap-3 rounded-full bg-[#e8edf4] px-5 py-4 text-sm text-slate-500 shadow-inner">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search forms, templates and more"
                className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-500"
              />
            </label>
          </div>

          <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-gradient-to-br from-[#f0e6ff] to-[#ddd8ff] p-4 shadow-[0_10px_20px_rgba(130,116,196,0.16)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Forms</div>
              <div className="mt-2 text-3xl font-bold text-slate-800">{totalForms}</div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-[#dff1ff] to-[#c9e7ff] p-4 shadow-[0_10px_20px_rgba(95,151,204,0.15)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Responses</div>
              <div className="mt-2 text-3xl font-bold text-slate-800">50</div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-[#ffdff0] to-[#f2d7ff] p-4 shadow-[0_10px_20px_rgba(182,120,181,0.16)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Forums</div>
              <div className="mt-2 text-3xl font-bold text-slate-800">5</div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-[#efedf8] to-[#dfdcef] p-4 shadow-[0_10px_20px_rgba(120,122,154,0.16)]">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">This Month</div>
              <div className="mt-2 flex items-center gap-2 text-3xl font-bold text-slate-800">
                <span className="text-2xl">?</span>
                <span>37%</span>
              </div>
            </div>
          </section>

          <section className="mt-9">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700">Popular Templates</h2>
              <button
                onClick={async () => {
                  try {
                    const nextPublished = await togglePublish();
                    pushToast({ title: nextPublished ? "Current form published" : "Current form unpublished" });
                  } catch {
                    pushToast({ title: "Publish update failed", tone: "error" });
                  }
                }}
                className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"
              >
                {isPublished ? "Unpublish Active Form" : "Publish Active Form"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {templateMock.map((template) => (
                <article
                  key={template.id}
                  className={`min-h-[145px] rounded-3xl border border-[#e1e7f0] bg-gradient-to-br ${template.accent} p-4 text-left shadow-[0_10px_22px_rgba(128,140,172,0.12)]`}
                >
                  <div className="inline-flex items-center rounded-full bg-white/70 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    Mock Template
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-slate-800">{template.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{template.subtitle}</p>
                  <button
                    onClick={() => pushToast({ title: `${template.title} template selected` })}
                    className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    Use template
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-9 pb-4">
            <h2 className="mb-4 text-lg font-semibold text-slate-700">Recents</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {recentCards.map((item) => (
                <article
                  key={item.id}
                  className="flex min-h-[168px] flex-col justify-between rounded-3xl border border-[#e1e7f0] bg-[#edf1f6] p-5 shadow-[0_10px_20px_rgba(140,156,190,0.12)]"
                >
                  <div>
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-500">
                      <FolderKanban className="h-3 w-3" />
                      {item.id.startsWith("live") ? "Live Form" : "Mock Data"}
                    </div>
                    <h3 className="text-base font-semibold text-slate-800">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">{item.count}</span>
                    <button
                      onClick={() => {
                        if (formId) {
                          navigate(`/vault/${formId}`);
                          return;
                        }
                        pushToast({ title: "Open any form first to view responses" });
                      }}
                      className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      View
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {loadingForms && <p className="mt-3 text-xs text-slate-500">Loading your forms...</p>}
            {!loadingForms && myForms.length === 0 && (
              <p className="mt-3 text-xs text-slate-500">Showing mock recent data until your first forms are created.</p>
            )}
          </section>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};
