import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Layers3 } from "lucide-react";
import { GlassPanel } from "../common/GlassPanel";
import { useBuilderStore } from "../../store/builderStore";
import { FIELD_CATALOG } from "../../lib/fieldCatalog";
import type { FieldType } from "../../types/form";

const FieldChip = ({ type }: { type: FieldType }) => {
  const addField = useBuilderStore((state) => state.addField);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${type}`,
    data: { type },
  });

  return (
    <motion.button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      whileHover={{ scale: 1.03, x: 2 }}
      whileTap={{ scale: 0.98 }}
      onDoubleClick={() => addField(type, 220, 220)}
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm capitalize"
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.35 : 1,
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <div className="font-medium">{type}</div>
      <div className="mt-1 text-[11px] text-slate-300">{FIELD_CATALOG.find((item) => item.type === type)?.examples.join(", ")}</div>
    </motion.button>
  );
};

export const FieldLibrary = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
  return (
    <motion.div className="fixed left-5 top-24 z-20" initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
      <GlassPanel className="w-[250px] p-3">
        <button className="mb-3 flex w-full items-center justify-between rounded-xl bg-white/10 px-3 py-2" onClick={onToggle}>
          <span className="text-sm font-semibold">Field Library</span>
          <Layers3 className="h-4 w-4" />
        </button>

        {!collapsed && (
          <div className="soft-scroll grid max-h-[58vh] grid-cols-1 gap-2 overflow-auto pr-1">
            {FIELD_CATALOG.map((item) => (
              <FieldChip key={item.type} type={item.type} />
            ))}
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
};
