import { motion } from "framer-motion";
import type { FormField } from "../../types/form";

interface CanvasFieldProps {
  field: FormField;
  selected: boolean;
  editingUser?: string;
  onSelect: () => void;
  onPositionChange: (x: number, y: number) => void;
}

const NodeInputPreview = ({ field }: { field: FormField }) => {
  const options = field.options ?? ["Option 1", "Option 2"];
  const min = field.config?.min ?? (field.type === "rating" ? 1 : 0);
  const max = field.config?.max ?? (field.type === "rating" ? 5 : 100);
  const step = field.config?.step ?? 1;
  const placeholder =
    field.config?.placeholder ??
    (field.type === "email"
      ? "name@email.com"
      : field.type === "phone"
        ? "+1 555 000 0000"
        : field.type === "number"
          ? "0"
          : field.type === "textarea"
            ? "Long answer"
            : "Type here");

  if (field.type === "textarea") {
    return (
      <textarea
        disabled
        rows={field.config?.rows ?? 3}
        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300"
        placeholder={placeholder}
      />
    );
  }
  if (field.type === "select") {
    return (
      <select disabled className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    );
  }
  if (field.type === "multiselect") {
    return <select multiple disabled className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300">{options.map((option) => <option key={option}>{option}</option>)}</select>;
  }
  if (field.type === "radio") {
    return (
      <div className="space-y-1 text-xs text-slate-300">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2">
            <input disabled type="radio" name={field.id} />
            {option}
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input disabled type="checkbox" /> Checked / unchecked
      </label>
    );
  }
  if (field.type === "date") return <input disabled type="date" className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300" />;
  if (field.type === "email") return <input disabled type="email" className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300" placeholder={placeholder} />;
  if (field.type === "phone") return <input disabled type="tel" className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300" placeholder={placeholder} />;
  if (field.type === "number") {
    return (
      <input
        disabled
        type="number"
        min={field.config?.min}
        max={field.config?.max}
        step={field.config?.step}
        className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300"
        placeholder={placeholder}
      />
    );
  }
  if (field.type === "rating") return <input disabled type="range" min={min} max={max} step={step} className="w-full accent-cyan-300" />;
  if (field.type === "slider") return <input disabled type="range" min={min} max={max} step={step} className="w-full accent-cyan-300" />;
  if (field.type === "file") {
    return (
      <input
        disabled
        type="file"
        accept={field.config?.accept}
        multiple={Boolean(field.config?.multiple)}
        className="w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-cyan-300/30 file:px-2 file:py-1"
      />
    );
  }

  return <input disabled type="text" className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-300" placeholder={placeholder} />;
};

export const CanvasField = ({ field, selected, editingUser, onSelect, onPositionChange }: CanvasFieldProps) => {
  return (
    <motion.div
      data-canvas-field="true"
      drag
      dragMomentum
      dragElastic={0.12}
      onDragEnd={(_, info) => {
        const x = Math.round(((field.x ?? 100) + info.offset.x) / 20) * 20;
        const y = Math.round(((field.y ?? 100) + info.offset.y) / 20) * 20;
        onPositionChange(x, y);
      }}
      className={`absolute w-[280px] border p-4 shadow-glow ${
        selected ? "border-cyan-300/80 bg-cyan-300/10" : "border-white/15 bg-slate-900/60"
      }`}
      style={{
        left: field.x ?? 100,
        top: field.y ?? 100,
        borderRadius: field.style?.radius ?? 16,
        borderColor: field.style?.accent ?? (selected ? "#78e8ff" : undefined),
        backgroundColor: `${field.style?.accent ?? "#78e8ff"}1A`,
        boxShadow: selected ? `0 0 0 1px ${field.style?.accent ?? "#78e8ff"}55` : undefined,
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      whileHover={{ y: -2, scale: 1.01 }}
    >
      <div className="text-xs uppercase tracking-wide text-slate-300">{field.type}</div>
      <div className="mt-2 text-sm font-semibold">{field.label}</div>
      {field.config?.helpText && <div className="mt-1 text-xs text-slate-400">{field.config.helpText}</div>}
      <div className="pointer-events-none mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
        <NodeInputPreview field={field} />
      </div>
      {editingUser && (
        <div className="mt-2 rounded-xl bg-amber-300/20 px-2 py-1 text-[11px] text-amber-100">{editingUser} is editing...</div>
      )}
    </motion.div>
  );
};
