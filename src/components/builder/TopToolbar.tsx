import { motion } from "framer-motion";
import { Check, Eye, EyeOff, GitBranch, History, Moon, ShieldPlus, Sparkles, Sun } from "lucide-react";
import { GlassPanel } from "../common/GlassPanel";
import { AvatarStack } from "../common/AvatarStack";
import { ConnectionBadge } from "../common/ConnectionBadge";
import { useBuilderStore } from "../../store/builderStore";
import { useUiStore } from "../../store/uiStore";
import { useThemeStore } from "../../store/themeStore";
import { useNavigate } from "react-router-dom";
import { Undo2,Redo2,Bot,User,ChevronLeft,ChevronRight     } from 'lucide-react';
import { useState } from "react";

export const TopToolbar = ({
  onOpenAccess,
  logicOpen,
  onToggleLogic,
  onAutoArrange,
  formTitle,
  onFormTitleChange,
  isPublished,
  onTogglePublish,
  saveState,
}: {
  onOpenAccess: () => void;
  logicOpen: boolean;
  onToggleLogic: () => void;
  onAutoArrange: () => void;
  formTitle: string;
  onFormTitleChange: (title: string) => void;
  isPublished: boolean;
  onTogglePublish: () => void;
  saveState: "idle" | "saving" | "saved";
}) => {
  const navigate = useNavigate();
  const { presenceUsers, connectionStatus, previewMode, setPreviewMode, undo, redo, formId } = useBuilderStore();
  const { setCommandPalette } = useUiStore();
  const [embed,Setembed]=useState(false);
  const theme = useThemeStore((state) => state.theme);
  const cycleTheme = useThemeStore((state) => state.cycleTheme);
const embedCode = `<iframe 
  src="http://localhost:5173/stage/${formId}"
  width="100%"
  height="600"
  style="border:none;">
</iframe>`;
  return (
    <>
    <motion.div layout className="pointer-events-none fixed  right-12 top-4 z-30 w-[min(98vw,1320px)] ">
      <GlassPanel className="pointer-events-auto flex flex-wrap items-center justify-between gap-y-2 border border-white/10 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <div className="rounded-xl bg-cyan-300/20 px-3 py-1 text-xs font-semibold text-cyan-100">Canvas</div>
          <input
            value={formTitle}
            onChange={(event) => onFormTitleChange(event.target.value)}
            className="w-[min(42vw,300px)] min-w-[180px] rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-50"
            placeholder="Untitled FormFlow"
          />
          <ConnectionBadge status={connectionStatus} />
          <div className="rounded-xl bg-white/10 px-2.5 py-1 text-[11px] text-slate-200">
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "All changes saved" : "Ready"}
          </div>
          <button
            className="rounded-lg bg-white/10 px-2 py-1 text-xs"
            onClick={() => setPreviewMode(previewMode === "off" ? "split" : "off")}
          >
            {previewMode === "off" ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button className="rounded-lg bg-white/10 px-2 py-1 text-xs" onClick={undo}>
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button className="rounded-lg bg-white/10 px-2 py-1 text-xs" onClick={redo}>
            <Redo2 className="h-3.5 w-3.5"/>
          </button>
          <button className="rounded-lg bg-white/10 px-2 py-1 text-xs" onClick={onToggleLogic}>
            <GitBranch className="mr-1 inline h-3.5 w-3.5" />
            {logicOpen ? "Hide Logic" : "Show Logic"}
          </button>
          <button className="rounded-lg bg-white/10 px-2 py-1 text-xs" onClick={onAutoArrange}>
            Arrange
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {formId && (
            <button
              className={`rounded-xl px-3 py-1 text-xs font-semibold ${isPublished ? "bg-rose-300/20 text-rose-100" : "bg-emerald-300/20 text-emerald-100"}`}
              onClick={onTogglePublish}
            >
              {isPublished ? "Unpublish" : "Publish Form"}
            </button>
          )}
          <button
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-300/20 px-3 py-1 text-xs font-semibold text-emerald-100"
            onClick={() => setPreviewMode(previewMode === "off" ? "split" : "off")}
          >
            <Check className="h-3.5 w-3.5" />
            Preview
          </button>
          <button className="rounded-xl bg-white/10 px-3 py-1 text-xs" onClick={() => setCommandPalette(true)}>
            <Bot className="mr-1 inline h-3 w-3" /> AI
          </button>
          {formId && (
            <button className="rounded-xl bg-white/10 px-3 py-1 text-xs" onClick={onOpenAccess}>
              <User  className="-mr-1 inline h-3.5 w-3.5" /> + Access
            </button>
          )}
          {formId && (
            <button className="rounded-xl bg-white/10 px-3 py-1 text-xs" onClick={()=>Setembed(!embed)}>
              <ChevronLeft   className="-mr-1 inline h-3.5 w-3.5" /><ChevronRight   className="-mr-1 inline h-3.5 w-3.5" />
            </button>
          )}
          <AvatarStack  users={presenceUsers} />
          <button className="rounded-lg bg-white/10 p-2" onClick={cycleTheme}>
            {theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "aurora" ? <Sparkles className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          {formId && (
            <button className="rounded-lg bg-indigo-300/20 px-3 py-1 text-xs" onClick={() => navigate(`/vault/${formId}`)}>
              Responses
            </button>
          )}
        </div>
       
      </GlassPanel>
      
    </motion.div>
    {embed && (
  <div className="fixed right-10 top-20 z-50 w-[400px] rounded-xl bg-gray-800  p-4 shadow-lg">
    <h3 className="mb-2 text-sm font-semibold text-white">
      Embed Code
    </h3>

    <textarea
      readOnly
      value={embedCode}
      className="w-full h-40 rounded-lg border border-gray-600 p-2 text-xs text-white bg-gray-800"
    />

    <button
      className="mt-2 rounded-lg bg-black px-3 py-1 text-white text-xs"
      onClick={() => navigator.clipboard.writeText(embedCode)}
    >
      Copy Code
    </button>
  </div>
)}
    </>
  );
};
