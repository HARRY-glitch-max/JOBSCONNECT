import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";

// --- 1. MODEL REGISTRATION ---
import "./models/Jobseeker.js"; 
import "./models/Employer.js";
import "./models/Job.js";
import "./models/Interview.js";
import Chat from "./models/Chat.js"; 

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.ALLOWED_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS policy blocked origin: ${origin}`), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- 2. ROUTE REGISTRATION ---
import jobseekerRoutes from "./routes/jobseekerRoutes.js";
import employerRoutes from "./routes/employerRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import testRoutes from "./routes/testRoutes.js";

app.use("/api/jobseekers", jobseekerRoutes);
app.use("/api/employers", employerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/test", testRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const startServer = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);

    // --- 3. SOCKET.IO INITIALIZATION ---
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"], 
    });

    app.set("socketio", io);

    io.on("connection", (socket) => {
      console.log(`🔌 Connected: ${socket.id}`);

      // ✅ FIX: Robust Room Joining
      // We trim and stringify to ensure "65a..." always matches "65a..."
      socket.on("join", (userId) => {
        if (!userId) return;
        const room = userId === "admin" ? "admin_room" : userId.toString().trim();
        socket.join(room);
        console.log(`👤 User joined room: ${room}`);
      });

      socket.on("send_message", async (data) => {
        try {
          const { senderId, receiverId, message, senderType } = data;

          if (!senderId || !receiverId || !message) {
            return socket.emit("error", { message: "Incomplete message data" });
          }
          
          const JobSeeker = mongoose.model("JobSeeker");
          const Employer = mongoose.model("Employer");

          let senderData, receiverData, receiverType;

          // Normalize senderType to match DB (handle "Jobseeker" vs "JobSeeker")
          const normalizedSenderType = (senderType?.toLowerCase() === 'jobseeker') ? 'JobSeeker' : 'Employer';

          // Resolve Sender
          if (normalizedSenderType === "JobSeeker") {
            senderData = await JobSeeker.findById(senderId).select("name avatar");
          } else {
            const emp = await Employer.findById(senderId).select("companyName avatar");
            senderData = { name: emp?.companyName, avatar: emp?.avatar };
          }

          // Resolve Receiver
          const empCheck = await Employer.findById(receiverId).select("companyName avatar");
          if (empCheck) {
            receiverData = { name: empCheck.companyName, avatar: empCheck.avatar };
            receiverType = "Employer";
          } else {
            const jsCheck = await JobSeeker.findById(receiverId).select("name avatar");
            receiverData = jsCheck;
            receiverType = "JobSeeker";
          }

          // Persist to DB
          const newChat = new Chat({
            senderId,
            senderName: senderData?.name || "User",
            senderAvatar: senderData?.avatar || null,
            senderModel: normalizedSenderType,
            receiverId,
            receiverName: receiverData?.name || "User",
            receiverAvatar: receiverData?.avatar || null,
            receiverModel: receiverType,
            message: message.trim(),
            timestamp: new Date()
          });

          const savedMsg = await newChat.save();

          // ✅ FIX: Instant Delivery to BOTH Rooms
          const targetRoom = receiverId.toString().trim();
          const senderRoom = senderId.toString().trim();
          
          // 1. Emit to the person receiving the message
          io.to(targetRoom).emit("receive_message", savedMsg);
          
          // 2. Emit back to the sender (updates all their open tabs instantly)
          io.to(senderRoom).emit("receive_message", savedMsg); 

          // 3. UI Notification
          io.to(targetRoom).emit("new_conversation_notification", { 
            from: senderData?.name,
            message: message.substring(0, 30) + "..."
          });

        } catch (err) {
          console.error("❌ Socket Error:", err);
          socket.emit("error", { message: "Messaging failed" });
        }
      });

      socket.on("disconnect", () => {
        console.log(`❌ Disconnected: ${socket.id}`);
      });
    });

    app.use(notFound);
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("💥 Startup Error:", err);
    process.exit(1);
  }
};

startServer();