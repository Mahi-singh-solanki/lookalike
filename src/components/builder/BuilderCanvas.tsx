import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { MousePointer2 } from "lucide-react";
import { CanvasField } from "./CanvasField";
import { FieldLibrary } from "./FieldLibrary";
import { useBuilderStore } from "../../store/builderStore";
import type { FieldType, FormField } from "../../types/form";

const grid = 20;
const CANVAS_WIDTH = 3200;
const CANVAS_HEIGHT = 2200;

const DroppableCanvas = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop" });
  return (
    <div
      ref={setNodeRef}
      className={`relative rounded-[2.4rem] border ${isOver ? "border-cyan-300/60" : "border-white/10"}`}
      style={{
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundImage:
          "linear-gradient(to right, rgba(124,154,255,0.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(124,154,255,0.13) 1px, transparent 1px)",
        backgroundSize: `${grid}px ${grid}px`,
      }}
    >
      {children}
    </div>
  );
};

export const BuilderCanvas = ({
  collapsedLibrary,
  onToggleLibrary,
}: {
  collapsedLibrary: boolean;
  onToggleLibrary: () => void;
}) => {
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const [dragType, setDragType] = useState<FieldType | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const { schema, selectedFieldId, selectField, patchField, addField, emitCursor, presenceUsers, editingByField } = useBuilderStore();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const selectedField = useMemo(
    () => schema.fields.find((field) => field.id === selectedFieldId) ?? null,
    [selectedFieldId, schema.fields],
  );

  const onDragEnd = (event: DragEndEvent) => {
    const dataType = event.active.data.current?.type as FieldType | undefined;
    setDragType(null);
    if (!dataType || !canvasWrapRef.current) return;

    const wrap = canvasWrapRef.current;
    const rect = wrap.getBoundingClientRect();
    const translated = event.active.rect.current.translated ?? event.active.rect.current.initial;
    if (!translated) return;

    const pointerX = translated.left + translated.width / 2;
    const pointerY = translated.top + translated.height / 2;
    const droppedInsideViewport =
      pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom;
    if (!droppedInsideViewport) return;

    const x = (pointerX - rect.left + wrap.scrollLeft - offset.x) / scale;
    const y = (pointerY - rect.top + wrap.scrollTop - offset.y) / scale;
    const clampedX = Math.max(40, Math.min(CANVAS_WIDTH - 300, x));
    const clampedY = Math.max(40, Math.min(CANVAS_HEIGHT - 120, y));
    addField(dataType, clampedX, clampedY);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const dataType = event.active.data.current?.type as FieldType | undefined;
        if (dataType) setDragType(dataType);
      }}
      onDragEnd={onDragEnd}
    >
      <FieldLibrary collapsed={collapsedLibrary} onToggle={onToggleLibrary} />
      <div
        ref={canvasWrapRef}
        className="soft-scroll relative h-screen overflow-auto px-6 pb-32 pt-24"
        onMouseMove={(event) => {
          const wrap = event.currentTarget;
          const rect = wrap.getBoundingClientRect();
          const canvasX = (event.clientX - rect.left + wrap.scrollLeft - offset.x) / scale;
          const canvasY = (event.clientY - rect.top + wrap.scrollTop - offset.y) / scale;
          emitCursor(Math.max(0, Math.min(CANVAS_WIDTH, canvasX)), Math.max(0, Math.min(CANVAS_HEIGHT, canvasY)));
        }}
        onWheel={(event) => {
          if (!event.ctrlKey) return;
          event.preventDefault();
          setScale((prev) => Math.min(1.6, Math.max(0.5, prev - event.deltaY * 0.0012)));
        }}
        onMouseDown={(event) => {
          if (event.button !== 1) return;
          event.preventDefault();
          setPanning(true);
          panStart.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
        }}
        onMouseUp={() => setPanning(false)}
        onMouseLeave={() => setPanning(false)}
        onMouseMoveCapture={(event) => {
          if (!panning) return;
          setOffset({
            x: panStart.current.ox + event.clientX - panStart.current.x,
            y: panStart.current.oy + event.clientY - panStart.current.y,
          });
        }}
        onMouseDownCapture={(event) => {
          const target = event.target as HTMLElement;
          if (!target.closest("[data-canvas-field='true']")) {
            selectField(null);
          }
        }}
      >
        <motion.div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: "top left" }}>
          <DroppableCanvas>
            {schema.fields.map((field: FormField) => (
              <CanvasField
                key={field.id}
                field={field}
                selected={selectedFieldId === field.id}
                editingUser={editingByField[field.id]}
                onSelect={() => selectField(field.id)}
                onPositionChange={(x, y) => patchField(field.id, { x, y })}
              />
            ))}

            {presenceUsers.map((user) => (
              <motion.div key={user.socketId} className="pointer-events-none absolute z-40" animate={{ x: user.x, y: user.y }}>
                <div className="flex items-center gap-1">
                  <MousePointer2 className="h-4 w-4" style={{ color: user.color }} />
                  <div className="rounded-lg bg-black/70 px-2 py-0.5 text-[10px] text-white">{user.username}</div>
                </div>
              </motion.div>
            ))}
          </DroppableCanvas>
        </motion.div>

        <DragOverlay>
          {dragType && (
            <div className="w-[280px] rounded-3xl border border-cyan-200/40 bg-slate-900/80 p-4 shadow-glow">
              <div className="text-xs uppercase text-slate-300">{dragType}</div>
              <div className="mt-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-slate-200">Drop to place</div>
            </div>
          )}
        </DragOverlay>
      </div>

      {selectedField && (
        <div className="fixed bottom-3 left-4 rounded-xl bg-black/35 px-3 py-1 text-xs text-slate-200">
          Selected: {selectedField.label}
        </div>
      )}
    </DndContext>
  );
};
