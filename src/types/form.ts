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

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  options?: string[];
  conditions?: Record<string, unknown>[];
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
  region?: string;
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
