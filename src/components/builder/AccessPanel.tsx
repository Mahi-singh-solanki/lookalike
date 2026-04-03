import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { formsApi } from "../../lib/api";
import { useUiStore } from "../../store/uiStore";
import { GlassPanel } from "../common/GlassPanel";

interface AdminUser {
  id: number;
  email: string;
}

export const AccessPanel = ({
  formId,
  open,
  onClose,
}: {
  formId: number | null;
  open: boolean;
  onClose: () => void;
}) => {
  const pushToast = useUiStore((state) => state.pushToast);
  const [userIdsInput, setUserIdsInput] = useState("");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const parsedIds = useMemo(() => {
    return Array.from(
      new Set(
        userIdsInput
          .split(/[\s,]+/)
          .map((entry) => Number(entry.trim()))
          .filter((num) => Number.isInteger(num) && num > 0),
      ),
    );
  }, [userIdsInput]);

  const loadAdmins = async () => {
    if (!formId) return;
    try {
      const list = await formsApi.getAdmins(formId);
      setAdmins(Array.isArray(list) ? list : []);
    } catch {
      setAdmins([]);
    }
  };

  useEffect(() => {
    if (!open || !formId) return;
    void loadAdmins();
  }, [open, formId]);

  return (
    <AnimatePresence>
      {open && formId && (
        <motion.div className="fixed right-5 top-24 z-40 w-[360px]" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
          <GlassPanel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Share Form Access</div>
              <button className="rounded-lg bg-white/10 px-2 py-1 text-xs" onClick={onClose}>
                Close
              </button>
            </div>

            <div className="text-xs text-slate-300">Enter user IDs (comma or space separated)</div>
            <input
              value={userIdsInput}
              onChange={(event) => setUserIdsInput(event.target.value)}
              placeholder="e.g. 2, 5, 7"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm"
            />

            <button
              disabled={loading || parsedIds.length === 0}
              className="mt-3 w-full rounded-xl bg-cyan-300/25 px-3 py-2 text-sm disabled:opacity-60"
              onClick={async () => {
                if (!formId || parsedIds.length === 0) return;
                setLoading(true);
                try {
                  await formsApi.addAdmins(formId, parsedIds);
                  pushToast({ title: "Access granted", description: `Added user IDs: ${parsedIds.join(", ")}` });
                  setUserIdsInput("");
                  await loadAdmins();
                } catch {
                  pushToast({ title: "Failed to add admins", description: "Verify user IDs", tone: "error" });
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Saving..." : "Grant Access"}
            </button>

            <div className="mt-4 text-xs text-slate-300">Users with access</div>
            <div className="soft-scroll mt-2 max-h-40 space-y-2 overflow-auto pr-1">
              {admins.length === 0 && <div className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-400">No admins added yet.</div>}
              {admins.map((admin) => (
                <div key={admin.id} className="rounded-xl bg-white/5 px-3 py-2 text-xs">
                  <div className="font-semibold">User #{admin.id}</div>
                  <div className="text-slate-300">{admin.email}</div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
