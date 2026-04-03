import clsx from "clsx";
import type { ConnectionStatus } from "../../store/builderStore";

export const ConnectionBadge = ({ status }: { status: ConnectionStatus }) => {
  return (
    <div
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-semibold",
        status === "connected" && "bg-emerald-400/20 text-emerald-200",
        status === "reconnecting" && "bg-amber-400/20 text-amber-100",
        status === "disconnected" && "bg-rose-400/20 text-rose-100",
      )}
    >
      {status === "connected" ? "Connected" : status === "reconnecting" ? "Reconnecting" : "Disconnected"}
    </div>
  );
};
