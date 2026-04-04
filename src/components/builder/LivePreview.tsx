import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { FormField, FormSchema } from "../../types/form";
import { useBuilderStore } from "../../store/builderStore";
import { isFieldVisible } from "../../lib/fieldLogic";

const PreviewField = ({
  field,
  value,
  onValueChange,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  field: FormField;
  value: unknown;
  onValueChange: (value: unknown) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) => {
  const options = field.options ?? ["Option 1", "Option 2"];
  const min = field.config?.min ?? (field.type === "rating" ? 1 : 0);
  const max = field.config?.max ?? (field.type === "rating" ? 5 : 100);
  const step = field.config?.step ?? 1;
  const placeholder = field.config?.placeholder ?? "";

  const renderInput = () => {
    if (field.type === "textarea") {
      return (
        <textarea
          rows={field.config?.rows ?? 3}
          value={String(value ?? "")}
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          placeholder={placeholder}
          onChange={(event) => onValueChange(event.target.value)}
        />
      );
    }
    if (field.type === "select") {
      return (
        <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={String(value ?? "")} onChange={(event) => onValueChange(event.target.value)}>
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === "multiselect") {
      return (
        <select
          multiple
          className="w-full rounded-xl border border-slate-200 px-3 py-2"
          value={Array.isArray(value) ? value.map((entry) => String(entry)) : []}
          onChange={(event) => onValueChange(Array.from(event.currentTarget.selectedOptions).map((option) => option.value))}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === "radio") {
      return (
        <div className="space-y-2 text-sm">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input type="radio" name={field.id} checked={String(value ?? "") === option} onChange={() => onValueChange(option)} /> {option}
            </label>
          ))}
        </div>
      );
    }
    if (field.type === "checkbox") return <input type="checkbox" checked={Boolean(value)} onChange={(event) => onValueChange(event.target.checked)} />;
    if (field.type === "date")
      return <input type="date" className="w-full rounded-xl border border-slate-200 px-3 py-2" value={String(value ?? "")} onChange={(event) => onValueChange(event.target.value)} />;
    if (field.type === "email") return <input type="email" value={String(value ?? "")} onChange={(event) => onValueChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder={placeholder} />;
    if (field.type === "phone") return <input type="tel" value={String(value ?? "")} onChange={(event) => onValueChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder={placeholder} />;
    if (field.type === "number") return <input type="number" min={field.config?.min} max={field.config?.max} step={field.config?.step} value={value === undefined ? "" : String(value)} onChange={(event) => onValueChange(event.target.value === "" ? undefined : Number(event.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder={placeholder} />;
    if (field.type === "rating") return <input type="range" min={min} max={max} step={step} value={typeof value === "number" ? value : min} onChange={(event) => onValueChange(Number(event.target.value))} className="w-full accent-cyan-500" />;
    if (field.type === "slider") return <input type="range" min={min} max={max} step={step} value={typeof value === "number" ? value : min} onChange={(event) => onValueChange(Number(event.target.value))} className="w-full accent-cyan-500" />;
    if (field.type === "file") return <input type="file" accept={field.config?.accept} multiple={Boolean(field.config?.multiple)} className="w-full min-w-0 text-sm" />;
    return <input value={String(value ?? "")} onChange={(event) => onValueChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2" placeholder={placeholder || "Type here"} />;
  };

  return (
    <motion.div className="mb-4 flex w-full min-w-0 items-center gap-2">
      <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 shadow-soft">
        <label className="mb-2 block break-words text-sm font-semibold">{field.label}</label>
        {renderInput()}
        {field.config?.helpText && <p className="mt-2 text-xs text-slate-500">{field.config.helpText}</p>}
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
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setPreviewOrder((prev) => {
      const fieldIds = schema.fields.map((field) => field.id);
      const existing = prev.filter((id) => fieldIds.includes(id));
      const missing = fieldIds.filter((id) => !existing.includes(id));
      return [...existing, ...missing];
    });
  }, [schema.fields]);

  useEffect(() => {
    setAnswers((prev) => {
      const next: Record<string, unknown> = {};
      for (const field of schema.fields) {
        if (prev[field.id] !== undefined) {
          next[field.id] = prev[field.id];
          continue;
        }
        if (field.config?.defaultValue !== undefined && field.config.defaultValue !== "") {
          next[field.id] = field.config.defaultValue;
        }
      }
      return next;
    });
  }, [schema.fields]);

  const sortedFields = useMemo(() => {
    const indexById = new Map(previewOrder.map((id, index) => [id, index]));
    return [...schema.fields]
      .sort((a, b) => (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0))
      .filter((field) => isFieldVisible(field, answers));
  }, [answers, previewOrder, schema.fields]);

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
                  value={answers[field.id]}
                  onValueChange={(value) => setAnswers((prev) => ({ ...prev, [field.id]: value }))}
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
