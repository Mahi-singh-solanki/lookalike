import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { formsApi, responsesApi, uploadApi } from "../lib/api";
import type { FormSchema } from "../types/form";
import { useUiStore } from "../store/uiStore";

export const StagePage = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const numericFormId = Number(formId);

  useEffect(() => {
    if (!numericFormId) return;
    formsApi
      .get(numericFormId)
      .then((data) => {
        setSchema(data.schema);
        setIsPublished(!Boolean(data.is_expired));
      })
      .catch(() => pushToast({ title: "Failed to load form" }));
  }, [numericFormId, pushToast]);

  const progress = useMemo(() => {
    if (!schema || !schema.fields.length) return 0;
    const filled = schema.fields.filter((f) => answers[f.id] !== undefined && answers[f.id] !== "").length;
    return Math.round((filled / schema.fields.length) * 100);
  }, [answers, schema]);

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

  const setAnswer = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const renderInput = (field: FormSchema["fields"][number]) => {
    const options = field.options ?? ["Option 1", "Option 2"];
    if (field.type === "textarea") {
      return <textarea className="w-full rounded-xl border border-slate-200 px-3 py-2" onChange={(event) => setAnswer(field.id, event.target.value)} />;
    }
    if (field.type === "select") {
      return (
        <select className="w-full rounded-xl border border-slate-200 px-3 py-2" onChange={(event) => setAnswer(field.id, event.target.value)}>
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
              <input type="radio" name={field.id} value={option} onChange={(event) => setAnswer(field.id, event.target.value)} />
              {option}
            </label>
          ))}
        </div>
      );
    }
    if (field.type === "checkbox") {
      return <input type="checkbox" onChange={(event) => setAnswer(field.id, event.target.checked)} />;
    }
    if (field.type === "rating") {
      return (
        <input
          type="range"
          min={1}
          max={5}
          className="w-full accent-cyan-500"
          onChange={(event) => setAnswer(field.id, Number(event.target.value))}
        />
      );
    }
    if (field.type === "slider") {
      return (
        <input
          type="range"
          min={0}
          max={100}
          className="w-full accent-cyan-500"
          onChange={(event) => setAnswer(field.id, Number(event.target.value))}
        />
      );
    }
    if (field.type === "file") {
      return (
        <input
          type="file"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              const uploaded = await uploadApi.upload(file);
              setAnswer(field.id, uploaded.url);
              pushToast({ title: "File uploaded" });
            } catch {
              pushToast({
                title: "Upload failed",
                description: "Configure /upload backend endpoint or Cloudinary env vars",
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
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
        onChange={(event) => setAnswer(field.id, field.type === "number" ? Number(event.target.value) : event.target.value)}
      />
    );
  };

  return (
    <div className="soft-scroll min-h-screen overflow-auto p-6">
      <div className="mx-auto w-[min(760px,95vw)] rounded-[2rem] bg-slate-50 p-7 text-slate-800 shadow-glow">
        <h1 className="text-2xl font-bold">{schema.title}</h1>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <motion.div className="h-full bg-cyan-500" animate={{ width: `${progress}%` }} />
        </div>

        <div className="mt-6 space-y-4">
          {schema.fields.map((field) => (
            <motion.div key={field.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 p-4">
              <label className="mb-2 block text-sm font-semibold">{field.label}</label>
              {renderInput(field)}
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            className="rounded-xl bg-cyan-500 px-4 py-2 text-white"
            onClick={async () => {
              try {
                await responsesApi.submit(numericFormId, answers);
                pushToast({ title: "Form submitted successfully" });
                setAnswers({});
              } catch (error: any) {
                pushToast({ title: "Submission failed", description: error?.message ?? "Please check required fields", tone: "error" });
              }
            }}
          >
            Submit
          </button>
          <button className="rounded-xl bg-slate-200 px-4 py-2" onClick={() => navigate(`/`)}>
            Back to Builder
          </button>
        </div>
      </div>
    </div>
  );
};
