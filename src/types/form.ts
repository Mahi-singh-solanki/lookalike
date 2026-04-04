export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "multiselect"
  | "rating"
  | "slider"
  | "file";

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "is_empty"
  | "is_not_empty";

export interface FieldCondition {
  id: string;
  fieldId: string;
  operator: ConditionOperator;
  value?: string;
}

export interface FieldVisibility {
  mode: "all" | "any";
  rules: FieldCondition[];
}

export interface FieldConfig {
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  accept?: string;
  multiple?: boolean;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  options?: string[];
  conditions?: Record<string, unknown>[];
  visibility?: FieldVisibility;
  config?: FieldConfig;
  x?: number;
  y?: number;
  width?: number;
  style?: {
    radius?: number;
    accent?: string;
  };
}

export interface FormSchema {
  title: string;
  fields: FormField[];
  updatedAt?: number;
  version?: number;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
}

export interface FormSummary {
  id: number;
  title: string;
  created_at: string;
}

export interface PresenceUser {
  socketId: string;
  userId?: string;
  username: string;
  color: string;
  x: number;
  y: number;
  editingFieldId?: string | null;
}

export interface FormResponse {
  id: number;
  answers: Record<string, unknown>;
  submitted_at: string;
}

export interface RealtimeSchemaEvent {
  formId: number;
  schema: FormSchema;
  version: number;
  userId: string;
  at: number;
}
