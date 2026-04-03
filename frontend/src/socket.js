import { io } from "socket.io-client";

// Use your backend URL. 
// In development, this is usually http://localhost:5000
const URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = io(URL, {
  autoConnect: true,
  withCredentials: true,
});