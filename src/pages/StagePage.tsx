import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { formsApi, responsesApi, uploadApi } from "../lib/api";
import type { FormSchema } from "../types/form";
import { useUiStore } from "../store/uiStore";
import { isFieldVisible } from "../lib/fieldLogic";

const parseDefaultByType = (field: FormSchema["fields"][number], value: string): unknown => {
  if (field.type === "number" || field.type === "slider" || field.type === "rating") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  if (field.type === "checkbox") {
    return value.toLowerCase() === "true";
  }
  if (field.type === "multiselect") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return value;
};

export const StagePage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [showValidationPulse, setShowValidationPulse] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const numericFormId = Number(formId);

  useEffect(() => {
    if (!numericFormId) return;
    formsApi
      .get(numericFormId)
      .then((data) => {
        setSchema(data.schema);
        setIsPublished(!Boolean(data.is_expired));
        const defaults = Object.fromEntries(
          (data.schema?.fields ?? [])
            .filter((field) => field.config?.defaultValue !== undefined && field.config.defaultValue !== "")
            .map((field) => [field.id, parseDefaultByType(field, field.config?.defaultValue ?? "")]),
        );
        setAnswers(defaults);
      })
      .catch(() => pushToast({ title: "Failed to load form" }));
  }, [numericFormId, pushToast]);

  const visibleFields = useMemo(
    () => (schema?.fields ?? []).filter((field) => isFieldVisible(field, answers)),
    [answers, schema?.fields],
  );

  const progress = useMemo(() => {
    if (!visibleFields.length) return 0;
    const filled = visibleFields.filter((f) => answers[f.id] !== undefined && answers[f.id] !== "").length;
    return Math.round((filled / visibleFields.length) * 100);
  }, [answers, visibleFields]);

  if (!schema) {
    return <div className="grid min-h-screen place-items-center text-slate-300">Loading form...</div>;
  }

  if (!isPublished) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="rounded-3xl border border-rose-300/20 bg-rose-300/10 p-6">
          <h2 className="text-xl font-bold text-rose-100">This form is currently unpublished</h2>
          <p className="mt-2 text-sm text-rose-50/80">Ask the owner to publish it again.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="stage-page-bg grid min-h-screen place-items-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[min(620px,94vw)] rounded-[2rem] border border-white/55 bg-white/90 p-8 text-center text-slate-800 shadow-glow"
        >
          <h1 className="text-3xl font-bold">Thanks for filling the form</h1>
          <p className="mt-2 text-sm text-slate-600">Your response has been submitted successfully.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              Submit Another Response
            </button>
            <button className="rounded-xl bg-slate-200 px-4 py-2 text-sm" onClick={() => navigate("/")}>
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const setAnswer = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const renderInput = (field: FormSchema["fields"][number]) => {
    const options = field.options ?? ["Option 1", "Option 2"];
    const min = field.config?.min ?? (field.type === "rating" ? 1 : 0);
    const max = field.config?.max ?? (field.type === "rating" ? 5 : 100);
    const step = field.config?.step ?? 1;
    const placeholder = field.config?.placeholder ?? "";
    if (field.type === "textarea") {
      return (
        <textarea
          rows={field.config?.rows ?? 3}
          value={String(answers[field.id] ?? "")}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-cyan-300"
          onChange={(event) => setAnswer(field.id, event.target.value)}
        />
      );
    }
    if (field.type === "select") {
      return (
        <select
          value={String(answers[field.id] ?? "")}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-cyan-300"
          onChange={(event) => setAnswer(field.id, event.target.value)}
        >
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
          value={Array.isArray(answers[field.id]) ? (answers[field.id] as unknown[]).map((entry) => String(entry)) : []}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-cyan-300"
          onChange={(event) => setAnswer(field.id, Array.from(event.currentTarget.selectedOptions).map((option) => option.value))}
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
              <input
                type="radio"
                name={field.id}
                value={option}
                checked={answers[field.id] === option}
                onChange={(event) => setAnswer(field.id, event.target.value)}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }
    if (field.type === "checkbox") {
      return <input type="checkbox" checked={Boolean(answers[field.id])} onChange={(event) => setAnswer(field.id, event.target.checked)} />;
    }
    if (field.type === "rating") {
      return (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={typeof answers[field.id] === "number" ? Number(answers[field.id]) : min}
          className="w-full accent-cyan-500"
          onChange={(event) => setAnswer(field.id, Number(event.target.value))}
        />
      );
    }
    if (field.type === "slider") {
      return (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={typeof answers[field.id] === "number" ? Number(answers[field.id]) : min}
          className="w-full accent-cyan-500"
          onChange={(event) => setAnswer(field.id, Number(event.target.value))}
        />
      );
    }
    if (field.type === "file") {
      return (
        <input
          type="file"
          accept={field.config?.accept}
          multiple={Boolean(field.config?.multiple)}
          onChange={async (event) => {
            const files = field.config?.multiple ? Array.from(event.target.files ?? []) : [event.target.files?.[0]].filter(Boolean) as File[];
            if (!files.length) return;
            try {
              const uploads = await Promise.all(files.map((file) => uploadApi.upload(file)));
              const urls = uploads.map((entry) => entry.url);
              setAnswer(field.id, field.config?.multiple ? urls : urls[0]);
              pushToast({ title: "File uploaded" });
            } catch {
              pushToast({
                title: "Upload failed",
                description: "Configure Cloudinary env vars and upload preset",
                tone: "error",
              });
            }
          }}
        />
      );
    }

    return (
      <input
        type={
          field.type === "number"
            ? "number"
            : field.type === "email"
              ? "email"
              : field.type === "phone"
                ? "tel"
                : field.type === "date"
                  ? "date"
                  : "text"
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-cyan-300"
        placeholder={placeholder}
        value={String(answers[field.id] ?? "")}
        min={field.type === "number" ? field.config?.min : undefined}
        max={field.type === "number" ? field.config?.max : undefined}
        step={field.type === "number" ? field.config?.step : undefined}
        onChange={(event) =>
          setAnswer(field.id, field.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)
        }
      />
    );
  };

  return (
    <div className="stage-page-bg min-h-screen px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mx-auto w-[min(860px,96vw)] rounded-[2rem] border border-white/55 bg-white/90 p-6 text-slate-800 shadow-glow ${
          showValidationPulse ? "ring-2 ring-rose-300/60" : ""
        }`}
      >
        <header className="mb-6">
          <div className="text-xs uppercase tracking-wide text-slate-500">Live Form</div>
          <h1 className="mt-1 text-3xl font-bold">{schema.title}</h1>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <motion.div className="h-full bg-cyan-500" animate={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 text-xs text-slate-500">{progress}% complete</div>
        </header>

        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {visibleFields.map((field) => (
              <motion.div
                key={field.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
              >
                <label className="mb-2 block text-sm font-semibold">{field.label}</label>
                {renderInput(field)}
                {field.config?.helpText && <p className="mt-2 text-xs text-slate-500">{field.config.helpText}</p>}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        <div className="mt-7 flex flex-wrap gap-2">
          <button
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white"
            onClick={async () => {
              const missingRequired = visibleFields.some((field) => {
                if (!field.required) return false;
                const value = answers[field.id];
                if (Array.isArray(value)) return value.length === 0;
                return value === undefined || value === null || value === "";
              });
              if (missingRequired) {
                setShowValidationPulse(true);
                setTimeout(() => setShowValidationPulse(false), 600);
                pushToast({ title: "Please fill all required visible fields", tone: "error" });
                return;
              }
              try {
                await responsesApi.submit(numericFormId, answers);
                pushToast({ title: "Form submitted successfully" });
                setSubmitted(true);
                setShowValidationPulse(false);
              } catch (error: any) {
                setShowValidationPulse(true);
                setTimeout(() => setShowValidationPulse(false), 600);
                pushToast({ title: "Submission failed", description: error?.message ?? "Please check required fields", tone: "error" });
              }
            }}
          >
            Submit Response
          </button>
          <button className="rounded-xl bg-slate-200 px-4 py-2 text-sm" onClick={() => navigate(`/`)}>
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};
