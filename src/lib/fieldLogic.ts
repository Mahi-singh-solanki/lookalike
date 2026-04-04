import type { FieldCondition, FieldType, FormField } from "../types/form";

const toComparableNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (value === undefined || value === null) return [];
  return [String(value)];
};

const isEmptyValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
};

const evaluateRule = (rule: FieldCondition, answers: Record<string, unknown>): boolean => {
  const actual = answers[rule.fieldId];
  const expected = rule.value ?? "";

  switch (rule.operator) {
    case "equals":
      return toStringArray(actual).includes(expected);
    case "not_equals":
      return !toStringArray(actual).includes(expected);
    case "contains":
      if (Array.isArray(actual)) return actual.map((item) => String(item)).includes(expected);
      return String(actual ?? "").toLowerCase().includes(expected.toLowerCase());
    case "not_contains":
      if (Array.isArray(actual)) return !actual.map((item) => String(item)).includes(expected);
      return !String(actual ?? "").toLowerCase().includes(expected.toLowerCase());
    case "gt": {
      const a = toComparableNumber(actual);
      const b = toComparableNumber(expected);
      return a !== null && b !== null && a > b;
    }
    case "gte": {
      const a = toComparableNumber(actual);
      const b = toComparableNumber(expected);
      return a !== null && b !== null && a >= b;
    }
    case "lt": {
      const a = toComparableNumber(actual);
      const b = toComparableNumber(expected);
      return a !== null && b !== null && a < b;
    }
    case "lte": {
      const a = toComparableNumber(actual);
      const b = toComparableNumber(expected);
      return a !== null && b !== null && a <= b;
    }
    case "is_empty":
      return isEmptyValue(actual);
    case "is_not_empty":
      return !isEmptyValue(actual);
    default:
      return true;
  }
};

export const isFieldVisible = (field: FormField, answers: Record<string, unknown>): boolean => {
  const rules = field.visibility?.rules ?? [];
  if (!rules.length) return true;
  const mode = field.visibility?.mode ?? "all";
  const matches = rules.map((rule) => evaluateRule(rule, answers));
  return mode === "any" ? matches.some(Boolean) : matches.every(Boolean);
};

export const getDefaultMin = (type: FieldType): number => {
  if (type === "rating") return 1;
  return 0;
};

export const getDefaultMax = (type: FieldType): number => {
  if (type === "rating") return 5;
  if (type === "slider") return 100;
  return 100;
};

export const getDefaultStep = (type: FieldType): number => {
  if (type === "rating") return 1;
  if (type === "number") return 1;
  return 1;
};
