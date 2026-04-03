import axios from "axios";
import type { FormResponse, FormSchema, FormSummary, UserProfile } from "../types/form";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("formflow_token");
  if (token) {
    config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  async signup(payload: { name: string; email: string; password: string }) {
    return (await api.post("/user/register", payload)).data;
  },
  async login(payload: { email: string; password: string }) {
    return (await api.post("/user/login", payload)).data as { access_token: string };
  },
  async me() {
    return (await api.get("/user/me")).data as UserProfile;
  },
};

export const formsApi = {
  async create(schema: FormSchema) {
    return (await api.post("/forms/", schema)).data as { id: number; message: string };
  },
  async get(formId: number) {
    return (await api.get(`/forms/${formId}`)).data as {
      id: number;
      title: string;
      schema: FormSchema;
      is_expired?: boolean;
    };
  },
  async update(formId: number, schema: FormSchema) {
    return (await api.put(`/forms/${formId}`, schema)).data;
  },
  async listMyForms() {
    return (await api.get("/user/forms")).data as FormSummary[];
  },
  async togglePublish(formId: number) {
    return (await api.put(`/forms/${formId}/update`)).data as { message: string };
  },
  async addAdmins(formId: number, userIds: number[]) {
    return (await api.post(`/forms/${formId}/admins`, { user_ids: userIds })).data as { message: string };
  },
  async getAdmins(formId: number) {
    return (await api.get(`/forms/${formId}/admins`)).data as Array<{ id: number; email: string }>;
  },
};

export const responsesApi = {
  async submit(formId: number, answers: Record<string, unknown>) {
    const data = (await api.post(`/forms/responses/${formId}`, { answers })).data as { error?: string; message?: string };
    if (data?.error) {
      throw new Error(data.error);
    }
    return data;
  },
  async get(formId: number) {
    const data = (await api.get(`/forms/responses/${formId}`)).data as FormResponse[] | { error?: string };
    if (!Array.isArray(data) && data?.error) {
      throw new Error(data.error);
    }
    return (Array.isArray(data) ? data : []) as FormResponse[];
  },
  exportCsvUrl(formId: number) {
    return `${API_BASE_URL}/forms/responses/${formId}/export`;
  },
};

export const aiApi = {
  async prompt(question: string) {
    return (await api.post("/user/chat", { question })).data as Record<string, unknown>;
  },
};

export const uploadApi = {
  async upload(file: File) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
    if (cloudName && uploadPreset) {
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", file);
      cloudinaryData.append("upload_preset", uploadPreset);
      const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: "POST",
        body: cloudinaryData,
      });
      if (!cloudinaryResponse.ok) throw new Error("Cloudinary upload failed");
      const uploaded = (await cloudinaryResponse.json()) as { secure_url: string };
      return { url: uploaded.secure_url };
    }

    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("formflow_token") ?? "";
    const authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: authorization,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("File upload failed");
    }

    return (await response.json()) as { url: string };
  },
};
