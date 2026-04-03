import type { FieldType } from "../types/form";

export interface FieldCatalogItem {
  type: FieldType;
  examples: string[];
}

export const FIELD_CATALOG: FieldCatalogItem[] = [
  { type: "text", examples: ["name", "username", "city"] },
  { type: "textarea", examples: ["address", "bio", "comments"] },
  { type: "number", examples: ["age", "quantity", "price"] },
  { type: "select", examples: ["country", "gender", "category"] },
  { type: "radio", examples: ["yes/no", "subscription type"] },
  { type: "multiselect", examples: ["skills", "interests", "tags"] },
  { type: "checkbox", examples: ["agree terms", "preferences"] },
  { type: "date", examples: ["birthdate", "appointment"] },
  { type: "email", examples: ["email address"] },
  { type: "phone", examples: ["phone number"] },
  { type: "rating", examples: ["product rating", "feedback score"] },
  { type: "slider", examples: ["volume", "budget range"] },
  { type: "file", examples: ["resume", "image", "document"] },
];

export const DEFAULT_LABEL_BY_TYPE: Record<FieldType, string> = FIELD_CATALOG.reduce(
  (acc, item) => ({ ...acc, [item.type]: item.examples[0] ?? item.type }),
  {} as Record<FieldType, string>,
);
