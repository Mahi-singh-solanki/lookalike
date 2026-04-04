import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlassPanel } from "../common/GlassPanel";
import { useBuilderStore } from "../../store/builderStore";
import type { ConditionOperator, FieldCondition, FormField } from "../../types/form";

const tabs = ["General", "Validation", "Logic", "Style"] as const;
type Tab = (typeof tabs)[number];

const choiceTypes = new Set(["select", "radio", "multiselect"]);
const numericTypes = new Set(["number", "slider", "rating"]);

const operators: Array<{ value: ConditionOperator; label: string; needsValue: boolean }> = [
  { value: "equals", label: "Equals", needsValue: true },
  { value: "not_equals", label: "Not equals", needsValue: true },
  { value: "contains", label: "Contains", needsValue: true },
  { value: "not_contains", label: "Not contains", needsValue: true },
  { value: "gt", label: "Greater than", needsValue: true },
  { value: "gte", label: "Greater or equal", needsValue: true },
  { value: "lt", label: "Less than", needsValue: true },
  { value: "lte", label: "Less or equal", needsValue: true },
  { value: "is_empty", label: "Is empty", needsValue: false },
  { value: "is_not_empty", label: "Is not empty", needsValue: false },
];

const normalizeOptions = (raw: string): string[] =>
  raw
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

const toNumberOrUndefined = (value: string): number | undefined => {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const inputCls = "w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm";

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

  const patchConfig = (field: FormField, patch: Partial<NonNullable<FormField["config"]>>) => {
    patchField(field.id, { config: { ...(field.config ?? {}), ...patch } });
  };

  const patchRule = (field: FormField, ruleId: string, patch: Partial<FieldCondition>) => {
    const visibility = field.visibility ?? { mode: "all" as const, rules: [] };
    patchField(field.id, {
      visibility: {
        ...visibility,
        rules: visibility.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)),
      },
    });
  };

  const addRule = (field: FormField) => {
    const visibility = field.visibility ?? { mode: "all" as const, rules: [] };
    const fallbackTarget = schema.fields.find((candidate) => candidate.id !== field.id)?.id ?? "";
    patchField(field.id, {
      visibility: {
        ...visibility,
        rules: [
          ...visibility.rules,
          { id: crypto.randomUUID(), fieldId: fallbackTarget, operator: "equals", value: "" } satisfies FieldCondition,
        ],
      },
    });
  };

  const removeRule = (field: FormField, ruleId: string) => {
    const visibility = field.visibility ?? { mode: "all" as const, rules: [] };
    patchField(field.id, {
      visibility: {
        ...visibility,
        rules: visibility.rules.filter((rule) => rule.id !== ruleId),
      },
    });
  };

  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          className="fixed right-5 top-24 z-30 w-[360px]"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
        >
          <GlassPanel className="max-h-[78vh] overflow-y-auto p-4">
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
              <div className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Label</label>
                  <input className={inputCls} value={selected.label} onChange={(event) => patchField(selected.id, { label: event.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Help text</label>
                  <input
                    className={inputCls}
                    value={selected.config?.helpText ?? ""}
                    onChange={(event) => patchConfig(selected, { helpText: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Placeholder</label>
                  <input
                    className={inputCls}
                    value={selected.config?.placeholder ?? ""}
                    onChange={(event) => patchConfig(selected, { placeholder: event.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Default value</label>
                  <input
                    className={inputCls}
                    value={selected.config?.defaultValue ?? ""}
                    onChange={(event) => patchConfig(selected, { defaultValue: event.target.value })}
                  />
                </div>
                {choiceTypes.has(selected.type) && (
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Options (one per line)</label>
                    <textarea
                      className={`${inputCls} min-h-[90px]`}
                      value={(selected.options ?? []).join("\n")}
                      onChange={(event) => patchField(selected.id, { options: normalizeOptions(event.target.value) })}
                    />
                  </div>
                )}
                {selected.type === "textarea" && (
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Rows</label>
                    <input
                      className={inputCls}
                      type="number"
                      min={2}
                      value={selected.config?.rows ?? ""}
                      onChange={(event) => patchConfig(selected, { rows: toNumberOrUndefined(event.target.value) })}
                    />
                  </div>
                )}
                {selected.type === "file" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Accept (e.g. .pdf,image/*)</label>
                      <input
                        className={inputCls}
                        value={selected.config?.accept ?? ""}
                        onChange={(event) => patchConfig(selected, { accept: event.target.value })}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={Boolean(selected.config?.multiple)}
                        onChange={(event) => patchConfig(selected, { multiple: event.target.checked })}
                      />
                      Allow multiple files
                    </label>
                  </>
                )}
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(selected.required)}
                    onChange={(event) => patchField(selected.id, { required: event.target.checked })}
                  />
                  Required
                </label>
              </div>
            )}

            {tab === "Validation" && (
              <div className="space-y-3 text-sm">
                {numericTypes.has(selected.type) ? (
                  <>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Minimum</label>
                      <input
                        className={inputCls}
                        type="number"
                        value={selected.config?.min ?? ""}
                        onChange={(event) => patchConfig(selected, { min: toNumberOrUndefined(event.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Maximum</label>
                      <input
                        className={inputCls}
                        type="number"
                        value={selected.config?.max ?? ""}
                        onChange={(event) => patchConfig(selected, { max: toNumberOrUndefined(event.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Step</label>
                      <input
                        className={inputCls}
                        type="number"
                        value={selected.config?.step ?? ""}
                        onChange={(event) => patchConfig(selected, { step: toNumberOrUndefined(event.target.value) })}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-300">No numeric constraints for this field type.</div>
                )}
              </div>
            )}

            {tab === "Logic" && (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Show field when</label>
                  <select
                    className={inputCls}
                    value={selected.visibility?.mode ?? "all"}
                    onChange={(event) =>
                      patchField(selected.id, {
                        visibility: {
                          mode: event.target.value === "any" ? "any" : "all",
                          rules: selected.visibility?.rules ?? [],
                        },
                      })
                    }
                  >
                    <option value="all">All rules match</option>
                    <option value="any">Any rule matches</option>
                  </select>
                </div>

                {(selected.visibility?.rules ?? []).map((rule) => {
                  const operator = operators.find((entry) => entry.value === rule.operator) ?? operators[0];
                  return (
                    <div key={rule.id} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-2">
                      <select className={inputCls} value={rule.fieldId} onChange={(event) => patchRule(selected, rule.id, { fieldId: event.target.value })}>
                        <option value="">Select field</option>
                        {schema.fields
                          .filter((entry) => entry.id !== selected.id)
                          .map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.label}
                            </option>
                          ))}
                      </select>
                      <select
                        className={inputCls}
                        value={rule.operator}
                        onChange={(event) => patchRule(selected, rule.id, { operator: event.target.value as ConditionOperator })}
                      >
                        {operators.map((entry) => (
                          <option key={entry.value} value={entry.value}>
                            {entry.label}
                          </option>
                        ))}
                      </select>
                      {operator.needsValue && (
                        <input
                          className={inputCls}
                          value={rule.value ?? ""}
                          placeholder="Comparison value"
                          onChange={(event) => patchRule(selected, rule.id, { value: event.target.value })}
                        />
                      )}
                      <button className="w-full rounded-lg bg-rose-300/20 px-2 py-1 text-xs text-rose-100" onClick={() => removeRule(selected, rule.id)}>
                        Remove rule
                      </button>
                    </div>
                  );
                })}

                <button className="w-full rounded-xl bg-cyan-300/20 px-3 py-2 text-xs text-cyan-100" onClick={() => addRule(selected)}>
                  Add condition rule
                </button>
              </div>
            )}

            {tab === "Style" && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Node color</label>
                  <input
                    type="color"
                    value={selected.style?.accent ?? "#78e8ff"}
                    onChange={(event) => patchField(selected.id, { style: { ...selected.style, accent: event.target.value } })}
                    className="h-9 w-full rounded-lg border border-white/20 bg-transparent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-300">Corner radius</label>
                  <input
                    className={inputCls}
                    type="number"
                    min={4}
                    max={40}
                    value={selected.style?.radius ?? 16}
                    onChange={(event) =>
                      patchField(selected.id, {
                        style: {
                          ...selected.style,
                          radius: toNumberOrUndefined(event.target.value) ?? 16,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}

            <button className="mt-4 w-full rounded-xl bg-rose-300/20 px-3 py-2 text-xs text-rose-100" onClick={() => removeField(selected.id)}>
              Delete Field
            </button>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
