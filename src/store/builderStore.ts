import { create } from "zustand";
import { formsApi } from "../lib/api";
import { getSocket } from "../lib/socket";
import { DEFAULT_LABEL_BY_TYPE } from "../lib/fieldCatalog";
import type { FormSchema, PresenceUser, RealtimeSchemaEvent } from "../types/form";

const defaultSchema: FormSchema = {
  title: "Untitled FormFlow",
  fields: [],
  version: 0,
  updatedAt: Date.now(),
};

const CANVAS_WIDTH = 3200;
const CANVAS_HEIGHT = 2200;
const FIELD_WIDTH = 300;
const FIELD_HEIGHT = 140;
const H_GAP = 80;
const V_GAP = 70;
const PADDING_X = 120;
const PADDING_Y = 120;

const randomColor = (input: string) => {
  const palette = ["#34d399", "#60a5fa", "#f59e0b", "#f472b6", "#22d3ee", "#a78bfa"];
  const hash = input.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

const snap20 = (value: number) => Math.round(value / 20) * 20;

const createGridLayoutFields = (fields: FormSchema["fields"], columns = 4): FormSchema["fields"] => {
  const maxColumns = Math.max(1, Math.floor((CANVAS_WIDTH - PADDING_X * 2) / (FIELD_WIDTH + H_GAP)));
  const totalColumns = Math.min(columns, maxColumns);

  return fields.map((field, index) => {
    const col = index % totalColumns;
    const row = Math.floor(index / totalColumns);
    const x = snap20(PADDING_X + col * (FIELD_WIDTH + H_GAP));
    const y = snap20(PADDING_Y + row * (FIELD_HEIGHT + V_GAP));
    return {
      ...field,
      x: Math.max(40, Math.min(CANVAS_WIDTH - FIELD_WIDTH, x)),
      y: Math.max(40, Math.min(CANVAS_HEIGHT - FIELD_HEIGHT, y)),
      width: field.width ?? 280,
    };
  });
};

const shouldAutoLayoutFields = (fields: FormSchema["fields"]) => {
  if (fields.length <= 1) return false;
  if (fields.some((field) => field.x === undefined || field.y === undefined)) return true;
  const buckets = new Set(fields.map((field) => `${snap20(field.x ?? 0)}:${snap20(field.y ?? 0)}`));
  return buckets.size <= Math.ceil(fields.length * 0.7);
};

interface BuilderState {
  formId: number | null;
  schema: FormSchema;
  isPublished: boolean;
  selectedFieldId: string | null;
  history: FormSchema[];
  historyIndex: number;
  connectionStatus: ConnectionStatus;
  presenceUsers: PresenceUser[];
  editingByField: Record<string, string>;
  myClientId: string;
  previewMode: "split" | "overlay" | "off";
  liveActivityTick: number;
  setPreviewMode: (mode: "split" | "overlay" | "off") => void;
  setFormId: (id: number) => void;
  loadForm: (id: number) => Promise<void>;
  createForm: (title: string) => Promise<number | null>;
  updateSchemaLocal: (schema: FormSchema, pushHistory?: boolean) => void;
  patchField: (fieldId: string, patch: Partial<FormSchema["fields"][number]>) => void;
  addField: (type: FormSchema["fields"][number]["type"], x: number, y: number) => void;
  removeField: (fieldId: string) => void;
  selectField: (fieldId: string | null) => void;
  connectRealtime: (username: string, userId: string) => void;
  disconnectRealtime: () => void;
  togglePublish: () => Promise<boolean>;
  emitCursor: (x: number, y: number) => void;
  setEditingField: (fieldId: string | null, username: string | null) => void;
  syncSchemaToBackend: () => Promise<void>;
  broadcastSchema: () => void;
  autoArrange: () => void;
  undo: () => void;
  redo: () => void;
  applyRemoteSchema: (event: RealtimeSchemaEvent) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useBuilderStore = create<BuilderState>((set, get) => ({
  formId: null,
  schema: defaultSchema,
  isPublished: true,
  selectedFieldId: null,
  history: [defaultSchema],
  historyIndex: 0,
  connectionStatus: "disconnected",
  presenceUsers: [],
  editingByField: {},
  myClientId: crypto.randomUUID(),
  previewMode: "split",
  liveActivityTick: 0,
  setPreviewMode: (mode) => set({ previewMode: mode }),
  setFormId: (id) => set({ formId: id }),
  createForm: async (title) => {
    const nextSchema = { ...get().schema, title, updatedAt: Date.now(), version: 0 };
    const created = await formsApi.create(nextSchema);
    set({ formId: created.id, schema: nextSchema, isPublished: true });
    return created.id;
  },
  loadForm: async (id) => {
    const data = await formsApi.get(id);
    const rawFields = (data.schema?.fields ?? []).map((field, idx) => ({
      ...field,
      x: field.x ?? 120 + (idx % 3) * 280,
      y: field.y ?? 120 + Math.floor(idx / 3) * 160,
    }));
    const fields = shouldAutoLayoutFields(rawFields) ? createGridLayoutFields(rawFields, 4) : rawFields;

    const loadedSchema = {
      ...defaultSchema,
      ...data.schema,
      fields,
      updatedAt: Date.now(),
      version: data.schema?.version ?? 0,
    } satisfies FormSchema;
    set({
      formId: id,
      schema: loadedSchema,
      isPublished: !Boolean(data.is_expired),
      history: [loadedSchema],
      historyIndex: 0,
      selectedFieldId: null,
    });
  },
  updateSchemaLocal: (schema, pushHistory = true) => {
    const next = { ...schema, updatedAt: Date.now(), version: (schema.version ?? 0) + 1 };

    set((state) => {
      const historyBase = state.history.slice(0, state.historyIndex + 1);
      const history = pushHistory ? [...historyBase, next] : [...historyBase.slice(0, -1), next];
      return {
        schema: next,
        history,
        historyIndex: history.length - 1,
        liveActivityTick: state.liveActivityTick + 1,
      };
    });

    get().broadcastSchema();

    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      void get().syncSchemaToBackend();
    }, 500);
  },
  patchField: (fieldId, patch) => {
    const schema = get().schema;
    get().updateSchemaLocal({
      ...schema,
      fields: schema.fields.map((field) => (field.id === fieldId ? { ...field, ...patch } : field)),
    });
  },
  addField: (type, x, y) => {
    const schema = get().schema;
    const id = crypto.randomUUID();
    const field = {
      id,
      type,
      label: DEFAULT_LABEL_BY_TYPE[type],
      required: false,
      options: type === "select" || type === "radio" || type === "multiselect" ? ["Option 1", "Option 2"] : undefined,
      visibility: { mode: "all" as const, rules: [] },
      config: {
        placeholder:
          type === "text"
            ? "Type here"
            : type === "textarea"
              ? "Write your answer"
              : type === "email"
                ? "name@email.com"
                : type === "phone"
                  ? "+1 555 000 0000"
                  : type === "number"
                    ? "0"
                    : undefined,
        min: type === "rating" ? 1 : type === "slider" ? 0 : undefined,
        max: type === "rating" ? 5 : type === "slider" ? 100 : undefined,
        step: type === "rating" ? 1 : type === "slider" ? 1 : type === "number" ? 1 : undefined,
      },
      x: Math.round(x / 20) * 20,
      y: Math.round(y / 20) * 20,
      width: 280,
      style: {
        accent: "#78e8ff",
        radius: 16,
      },
    };
    get().updateSchemaLocal({ ...schema, fields: [...schema.fields, field] });
    set({ selectedFieldId: id });
  },
  removeField: (fieldId) => {
    const schema = get().schema;
    get().updateSchemaLocal({ ...schema, fields: schema.fields.filter((field) => field.id !== fieldId) });
    set({ selectedFieldId: null });
  },
  selectField: (fieldId) => set({ selectedFieldId: fieldId }),
  syncSchemaToBackend: async () => {
    const { formId, schema } = get();
    if (!formId) return;
    try {
      await formsApi.update(formId, schema);
    } catch (error) {
      console.error("Schema update failed", error);
    }
  },
  broadcastSchema: () => {
    const { formId, schema, myClientId } = get();
    if (!formId) return;
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit("schema_update", {
      type: "SCHEMA_UPDATE",
      formId,
      schema,
      version: schema.version ?? 0,
      userId: myClientId,
      at: Date.now(),
    });
  },
  applyRemoteSchema: (event) => {
    const { myClientId, schema } = get();
    if (event.userId === myClientId) return;
    if ((event.version ?? 0) < (schema.version ?? 0)) return;

    const remote = {
      ...event.schema,
      version: event.version,
      updatedAt: event.at,
    };

    set((state) => ({
      schema: remote,
      history: [...state.history.slice(0, state.historyIndex + 1), remote],
      historyIndex: state.historyIndex + 1,
      liveActivityTick: state.liveActivityTick + 1,
    }));
  },
  connectRealtime: (username, userId) => {
    const socket = getSocket();
    socket.connect();

    socket.off("connect");
    socket.off("disconnect");
    socket.off("reconnect_attempt");
    socket.off("joined");
    socket.off("presence_update");
    socket.off("schema_updated");
    socket.off("editing_updated");
    socket.off("cursor_moved");
    socket.off("undo_redo_synced");

    socket.on("connect", () => {
      set({ connectionStatus: "connected" });
      const { formId } = get();
      socket.emit("join", {
        username,
        userId,
        formId: formId ?? 0,
        color: randomColor(username),
      });
    });

    socket.on("disconnect", () => set({ connectionStatus: "disconnected" }));
    socket.on("reconnect_attempt", () => set({ connectionStatus: "reconnecting" }));

    socket.on("joined", (payload) => {
      set({ presenceUsers: payload.users ?? [] });
    });

    socket.on("presence_update", (users: PresenceUser[]) => {
      set((state) => ({
        presenceUsers: users,
        liveActivityTick: state.liveActivityTick + 1,
      }));
    });

    socket.on("cursor_moved", (user: PresenceUser) => {
      set((state) => ({
        presenceUsers: state.presenceUsers.some((entry) => entry.socketId === user.socketId)
          ? state.presenceUsers.map((entry) => (entry.socketId === user.socketId ? { ...entry, ...user } : entry))
          : [...state.presenceUsers, user],
      }));
    });

    socket.on("schema_updated", (event: RealtimeSchemaEvent) => {
      get().applyRemoteSchema(event);
    });

    socket.on("editing_updated", (payload: { fieldId: string | null; username: string | null }) => {
      set((state) => {
        const nextEditing = { ...state.editingByField };
        if (!payload.fieldId || !payload.username) {
          if (payload.fieldId) delete nextEditing[payload.fieldId];
          return { editingByField: nextEditing };
        }
        nextEditing[payload.fieldId] = payload.username;
        return { editingByField: nextEditing };
      });
    });

    socket.on("undo_redo_synced", (event: RealtimeSchemaEvent) => {
      get().applyRemoteSchema(event);
    });
  },
  disconnectRealtime: () => {
    const socket = getSocket();
    socket.disconnect();
    set({ connectionStatus: "disconnected", presenceUsers: [], editingByField: {} });
  },
  togglePublish: async () => {
    const { formId, isPublished } = get();
    if (!formId) return isPublished;
    await formsApi.togglePublish(formId);
    const next = !isPublished;
    set({ isPublished: next });
    return next;
  },
  emitCursor: (x, y) => {
    const { formId } = get();
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit("cursor_move", { x, y, formId });
  },
  setEditingField: (fieldId, username) => {
    const { formId } = get();
    const socket = getSocket();
    set((state) => {
      const nextEditing = { ...state.editingByField };
      if (!fieldId || !username) {
        if (fieldId) delete nextEditing[fieldId];
      } else {
        nextEditing[fieldId] = username;
      }
      return { editingByField: nextEditing };
    });
    if (socket.connected) {
      socket.emit("field_editing", {
        formId,
        fieldId,
        username,
      });
    }
  },
  autoArrange: () => {
    const { schema } = get();
    const arranged = createGridLayoutFields(schema.fields, 4);
    get().updateSchemaLocal({
      ...schema,
      fields: arranged,
    });
  },
  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const historyIndex = state.historyIndex - 1;
      const schema = state.history[historyIndex];
      return { schema, historyIndex };
    });

    const { formId, schema, myClientId } = get();
    const socket = getSocket();
    socket.emit("undo_redo", { formId, schema, userId: myClientId, version: schema.version ?? 0, at: Date.now() });
    void get().syncSchemaToBackend();
  },
  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const historyIndex = state.historyIndex + 1;
      const schema = state.history[historyIndex];
      return { schema, historyIndex };
    });

    const { formId, schema, myClientId } = get();
    const socket = getSocket();
    socket.emit("undo_redo", { formId, schema, userId: myClientId, version: schema.version ?? 0, at: Date.now() });
    void get().syncSchemaToBackend();
  },
}));
