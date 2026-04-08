import { io } from "socket.io-client";

// radio server
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const socket = io(SERVER_URL, {
  autoConnect: true,
});
