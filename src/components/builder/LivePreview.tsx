import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { FormField, FormSchema } from "../../types/form";
import { useBuilderStore } from "../../store/builderStore";

const PreviewField = ({
  field,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  field: FormField;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) => {
  const options = field.options ?? ["Option 1", "Option 2"];

  const renderInput = () => {
    if (field.type === "textarea") return <textarea className="w-full rounded-xl border border-slate-200 px-3 py-2" />;
    if (field.type === "select") {
      return (
        <select className="w-full rounded-xl border border-slate-200 px-3 py-2">
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      );
    }
    if (field.type === "multiselect") {
      return (
        <select multiple className="w-full rounded-xl border border-slate-200 px-3 py-2">
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      );
    }
    if (field.type === "radio") {
      return (
        <div className="space-y-2 text-sm">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input type="radio" name={field.id} /> {option}
            </label>
          ))}
        </div>
      );
    }
    if (field.type === "checkbox") return <input type="checkbox" />;
    if (field.type === "date") return <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2" />;
    if (field.type === "email") return <input type="email" className="w-full rounded-xl border border-slate-200 px-3 py-2" />;
    if (field.type === "phone") return <input type="tel" className="w-full rounded-xl border border-slate-200 px-3 py-2" />;
    if (field.type === "number") return <input type="number" className="w-full rounded-xl border border-slate-200 px-3 py-2" />;
    if (field.type === "rating") return <input type="range" min={1} max={5} className="w-full accent-cyan-500" />;
    if (field.type === "slider") return <input type="range" min={0} max={100} className="w-full accent-cyan-500" />;
    if (field.type === "file") return <input type="file" className="w-full min-w-0 text-sm" />;
    return <input className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Type here" />;
  };

  return (
    <motion.div className="mb-4 flex w-full min-w-0 items-center gap-2">
      <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-soft">
        <label className="mb-2 block break-words text-sm font-semibold">{field.label}</label>
        {renderInput()}
      </div>
      <div className="flex h-[120px] w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-1 py-2">
        <div className="flex flex-col gap-1">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 disabled:opacity-40"
            title="Move up"
          >
            Up
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 disabled:opacity-40"
            title="Move down"
          >
            Down
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const LivePreview = ({ schema }: { schema: FormSchema }) => {
  const previewMode = useBuilderStore((state) => state.previewMode);
  const [previewOrder, setPreviewOrder] = useState<string[]>([]);

  useEffect(() => {
    setPreviewOrder((prev) => {
      const fieldIds = schema.fields.map((field) => field.id);
      const existing = prev.filter((id) => fieldIds.includes(id));
      const missing = fieldIds.filter((id) => !existing.includes(id));
      return [...existing, ...missing];
    });
  }, [schema.fields]);

  const sortedFields = useMemo(() => {
    const indexById = new Map(previewOrder.map((id, index) => [id, index]));
    return [...schema.fields].sort((a, b) => (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0));
  }, [previewOrder, schema.fields]);

  const moveOnePlace = (fieldId: string, direction: -1 | 1) => {
    setPreviewOrder((prev) => {
      const index = prev.indexOf(fieldId);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  return (
    <AnimatePresence>
      {previewMode !== "off" && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={`${previewMode === "split" ? "fixed right-6 top-24 z-30 h-[70vh] w-[min(34vw,560px)] min-w-[360px]" : "fixed inset-0 z-40 p-8"}`}
        >
          <div className="soft-scroll h-full overflow-x-hidden overflow-y-auto rounded-3xl bg-slate-50 p-6 shadow-glow">
            <div className="mb-5 text-lg font-bold text-slate-900">{schema.title}</div>
            {sortedFields.map((field) => (
              <motion.div key={field.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <PreviewField
                  field={field}
                  canMoveUp={sortedFields.findIndex((entry) => entry.id === field.id) > 0}
                  canMoveDown={sortedFields.findIndex((entry) => entry.id === field.id) < sortedFields.length - 1}
                  onMoveUp={() => moveOnePlace(field.id, -1)}
                  onMoveDown={() => moveOnePlace(field.id, 1)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
