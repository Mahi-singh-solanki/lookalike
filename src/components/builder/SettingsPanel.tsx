import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlassPanel } from "../common/GlassPanel";
import { useBuilderStore } from "../../store/builderStore";

const tabs = ["General", "Validation", "Logic", "Style"] as const;

type Tab = (typeof tabs)[number];

export const SettingsPanel = ({ username }: { username: string }) => {
  const [tab, setTab] = useState<Tab>("General");
  const { selectedFieldId, schema, patchField, removeField, setEditingField } = useBuilderStore();
  const selected = useMemo(() => schema.fields.find((field) => field.id === selectedFieldId), [selectedFieldId, schema.fields]);

  useEffect(() => {
    if (!selectedFieldId) {
      setEditingField(null, null);
      return;
    }
    setEditingField(selectedFieldId, username);
    return () => setEditingField(selectedFieldId, null);
  }, [selectedFieldId, setEditingField, username]);

  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          className="fixed right-5 top-24 z-30 w-[320px]"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
        >
          <GlassPanel className="p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {tabs.map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`rounded-full px-3 py-1 text-xs ${tab === item ? "bg-cyan-300/20 text-cyan-100" : "bg-white/10"}`}
                >
                  {item}
                </button>
              ))}
            </div>

            {tab === "General" && (
              <div className="space-y-2 text-sm">
                <label className="block text-xs text-slate-300">Label</label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2"
                  value={selected.label}
                  onChange={(event) => patchField(selected.id, { label: event.target.value })}
                />
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.required)}
                    onChange={(event) => patchField(selected.id, { required: event.target.checked })}
                  />
                  Required
                </label>
              </div>
            )}

            {tab === "Validation" && <div className="text-xs text-slate-300">Server-side schema validation active in backend.</div>}
            {tab === "Logic" && <div className="text-xs text-slate-300">Connect this field in Logic Map for branching conditions.</div>}
            {tab === "Style" && (
              <div className="space-y-2">
                <label className="block text-xs text-slate-300">Accent</label>
                <input
                  type="color"
                  value={selected.style?.accent ?? "#78e8ff"}
                  onChange={(event) => patchField(selected.id, { style: { ...selected.style, accent: event.target.value } })}
                  className="h-9 w-full rounded-lg border border-white/20 bg-transparent"
                />
              </div>
            )}

            <button
              className="mt-4 w-full rounded-xl bg-rose-300/20 px-3 py-2 text-xs text-rose-100"
              onClick={() => removeField(selected.id)}
            >
              Delete Field
            </button>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
