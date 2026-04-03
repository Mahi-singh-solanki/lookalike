import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "../../store/uiStore";
import { useBuilderStore } from "../../store/builderStore";
import { aiApi } from "../../lib/api";
import type { FieldType, FormField } from "../../types/form";

const supportedTypes: FieldType[] = [
  "text",
  "textarea",
  "number",
  "select",
  "multiselect",
  "radio",
  "checkbox",
  "date",
  "file",
  "email",
  "phone",
  "rating",
  "slider",
];

const normalizeType = (type: unknown): FieldType => {
  const raw = String(type ?? "text").toLowerCase();
  if (raw === "date_range") return "date";
  return (supportedTypes.includes(raw as FieldType) ? raw : "text") as FieldType;
};

const asStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const options = value.map((entry) => String(entry).trim()).filter(Boolean);
  return options.length ? options : undefined;
};

const parseAiPayload = (payload: Record<string, unknown>, fallbackTitle: string): { title: string; fields: FormField[] } => {
  const title = (typeof payload.title === "string" && payload.title.trim()) || fallbackTitle;
  const rawFields = Array.isArray(payload.fields) ? payload.fields : [];

  const fields: FormField[] = rawFields.slice(0, 24).map((entry, index) => {
    const field = (entry ?? {}) as Record<string, unknown>;
    const type = normalizeType(field.type);
    const options = asStringArray(field.options);
    const idRaw = typeof field.id === "string" ? field.id.trim().toLowerCase() : "";

    return {
      id: idRaw || `f_${index + 1}_${crypto.randomUUID().slice(0, 6)}`,
      type,
      label: typeof field.label === "string" && field.label.trim() ? field.label.trim() : `Question ${index + 1}`,
      required: Boolean(field.required),
      options: type === "select" || type === "radio" || type === "multiselect" ? options ?? ["Option 1", "Option 2"] : undefined,
      conditions: Array.isArray(field.conditions) ? (field.conditions as Record<string, unknown>[]) : undefined,
      x: 120 + (index % 3) * 320,
      y: 120 + Math.floor(index / 3) * 170,
      width: 280,
      style: {
        accent: "#78e8ff",
        radius: 16,
      },
    };
  });

  return { title, fields };
};

const parseAiResult = (result: Record<string, unknown>, prompt: string) => {
  if (Array.isArray(result.fields)) {
    return parseAiPayload(result, "AI Generated Form");
  }

  const maybeText = [result.response, result.answer, result.output].find((entry) => typeof entry === "string") as string | undefined;
  if (maybeText) {
    try {
      const parsed = JSON.parse(maybeText) as Record<string, unknown>;
      return parseAiPayload(parsed, "AI Generated Form");
    } catch {
      const lines = maybeText
        .split(/\n|,|;/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 10);

      return {
        title: "AI Generated Form",
        fields: lines.map(
          (line, idx) =>
            ({
              id: `f_${idx + 1}_${crypto.randomUUID().slice(0, 6)}`,
              type: "text" as FieldType,
              label: line.replace(/^[-*]\s*/, ""),
              required: idx < 2,
              x: 120 + (idx % 3) * 320,
              y: 120 + Math.floor(idx / 3) * 170,
              width: 280,
              style: { accent: "#78e8ff", radius: 16 },
            }) satisfies FormField,
        ),
      };
    }
  }

  return {
    title: "AI Generated Form",
    fields: [
      {
        id: `f_${crypto.randomUUID().slice(0, 6)}`,
        type: "text" as const,
        label: prompt,
        required: true,
        x: 120,
        y: 120,
        width: 280,
        style: { accent: "#78e8ff", radius: 16 },
      },
    ],
  };
};

export const CommandPalette = () => {
  const [prompt, setPrompt] = useState("Create a job application form with conditional questions for experienced candidates");
  const [loading, setLoading] = useState(false);
  const { commandPalette, setCommandPalette, pushToast } = useUiStore();
  const { schema, updateSchemaLocal } = useBuilderStore();

  const shortcutHint = useMemo(() => (navigator.platform.includes("Mac") ? "Cmd + K" : "Ctrl + K"), []);

  if (!commandPalette) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 grid place-items-start bg-black/45 pt-24" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.div className="glass w-[min(680px,92vw)] rounded-3xl p-5" initial={{ y: -15 }} animate={{ y: 0 }}>
          <div className="mb-3 text-xs text-slate-300">AI Form Assistant ({shortcutHint})</div>
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm"
            placeholder="Describe full form flow, steps, conditions, and required fields"
          />
          <div className="mt-4 flex gap-2">
            <button
              disabled={loading}
              className="rounded-xl bg-cyan-300/25 px-4 py-2 text-sm"
              onClick={async () => {
                setLoading(true);
                try {
                  const result = await aiApi.prompt(prompt);
                  const generated = parseAiResult(result, prompt);
                  if (!generated.fields.length) {
                    throw new Error("No fields generated");
                  }

                  updateSchemaLocal({
                    ...schema,
                    title: generated.title,
                    fields: generated.fields,
                  });

                  pushToast({
                    title: "AI flow created",
                    description: `${generated.fields.length} fields mapped to canvas layout`,
                  });
                  setCommandPalette(false);
                } catch {
                  pushToast({ title: "AI generation failed", description: "Check GROQ key and backend /user/chat endpoint", tone: "error" });
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Generating..." : "Generate Flow"}
            </button>
            <button className="rounded-xl bg-white/10 px-4 py-2 text-sm" onClick={() => setCommandPalette(false)}>
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
