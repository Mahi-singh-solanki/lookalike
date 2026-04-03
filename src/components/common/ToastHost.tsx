import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "../../store/uiStore";

export const ToastHost = () => {
  const { toasts, dismissToast } = useUiStore();

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[100] flex w-[320px] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            className="pointer-events-auto glass rounded-2xl px-4 py-3 text-sm"
            onClick={() => dismissToast(toast.id)}
          >
            <div className="font-semibold">{toast.title}</div>
            {toast.description && <div className="mt-1 text-xs text-slate-300">{toast.description}</div>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
