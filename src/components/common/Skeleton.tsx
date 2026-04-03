import { motion } from "framer-motion";

export const SkeletonBlock = ({ className }: { className?: string }) => (
  <motion.div
    className={`rounded-2xl bg-slate-500/20 ${className ?? "h-5 w-full"}`}
    animate={{ opacity: [0.5, 0.95, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.4 }}
  />
);
