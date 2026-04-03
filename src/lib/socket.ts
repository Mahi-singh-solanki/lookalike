import { io, type Socket } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:8000";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 5000,
      timeout: 12000,
      auth: {
        token: localStorage.getItem("formflow_token"),
      },
    });
  }

  socket.auth = {
    token: localStorage.getItem("formflow_token"),
  };

  return socket;
};
