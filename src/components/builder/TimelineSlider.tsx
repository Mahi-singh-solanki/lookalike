import { motion } from "framer-motion";
import { GlassPanel } from "../common/GlassPanel";

export const TimelineSlider = ({
  max,
  index,
  onChange,
}: {
  max: number;
  index: number;
  onChange: (next: number) => void;
}) => {
  return (
    <motion.div className="fixed bottom-4 left-1/2 z-30 w-[min(75vw,640px)] -translate-x-1/2" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <GlassPanel className="px-5 py-3">
        <div className="mb-2 text-xs text-slate-300">Time Travel</div>
        <input
          type="range"
          min={0}
          max={Math.max(max, 0)}
          value={index}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-cyan-300"
        />
      </GlassPanel>
    </motion.div>
  );
};
