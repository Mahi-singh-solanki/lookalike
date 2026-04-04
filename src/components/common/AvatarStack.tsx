import { motion } from "framer-motion";
import type { PresenceUser } from "../../types/form";

export const AvatarStack = ({ users }: { users: PresenceUser[] }) => {
  return (
    <div className="flex ml-2 items-center">
      {users.slice(0, 5).map((user, idx) => (
        <motion.div
          key={user.socketId}
          className="relative -ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/50 text-xs font-bold"
          style={{ backgroundColor: user.color, zIndex: 10 - idx }}
          title={user.username}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {user.username.slice(0, 1).toUpperCase()}
        </motion.div>
      ))}
      <div className="ml-2 text-xs text-slate-200">{users.length} live</div>
    </div>
  );
};
