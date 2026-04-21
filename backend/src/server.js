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

// --- MODEL REGISTRATION ---
import "./models/Jobseeker.js";
import "./models/Employer.js";
import "./models/Job.js";
import "./models/Interview.js";
import Chat from "./models/Chat.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

/* =============================
   SECURITY & MIDDLEWARE
============================= */

app.use(helmet({ crossOriginResourcePolicy: false }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =============================
   ✅ PRODUCTION-SAFE CORS
============================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://jobsconnect-b7uh.vercel.app/",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      // Allow localhost
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow ALL vercel preview deployments
      if (origin.includes("vercel.app")) {
        return callback(null, true);
      }

      console.error("❌ CORS blocked:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =============================
   ROUTES
============================= */

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

/* =============================
   ROOT & HEALTH ROUTES
============================= */

app.get("/", (req, res) => {
  res.json({
    message: "JOBCONNECT API is live 🚀",
    status: "Healthy",
    timestamp: new Date(),
  });
});

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date() })
);

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

/* =============================
   SERVER START
============================= */

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    /* =============================
       SOCKET.IO
    ============================= */

    const io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin || origin.includes("vercel.app") || origin.includes("localhost")) {
            return callback(null, true);
          }
          return callback(new Error("Socket CORS blocked"));
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    app.set("socketio", io);

    io.on("connection", (socket) => {
      console.log(`🔌 Connected: ${socket.id}`);

      socket.on("join", (userId) => {
        if (!userId) return;
        const room = userId === "admin" ? "admin_room" : userId.toString().trim();
        socket.join(room);
        console.log(`👤 User joined room: ${room}`);
      });

      socket.on("send_message", async (data) => {
        try {
          const { senderId, receiverId, message, senderType } = data;
          if (!senderId || !receiverId || !message) return;

          const JobSeeker = mongoose.model("JobSeeker");
          const Employer = mongoose.model("Employer");

          let senderData, receiverData, receiverType;

          const normalizedSenderType =
            senderType?.toLowerCase() === "jobseeker"
              ? "JobSeeker"
              : "Employer";

          if (normalizedSenderType === "JobSeeker") {
            senderData = await JobSeeker.findById(senderId).select("name avatar");
          } else {
            const emp = await Employer.findById(senderId).select("companyName avatar");
            senderData = { name: emp?.companyName, avatar: emp?.avatar };
          }

          const empCheck = await Employer.findById(receiverId).select("companyName avatar");

          if (empCheck) {
            receiverData = { name: empCheck.companyName, avatar: empCheck.avatar };
            receiverType = "Employer";
          } else {
            const jsCheck = await JobSeeker.findById(receiverId).select("name avatar");
            receiverData = jsCheck;
            receiverType = "JobSeeker";
          }

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
            timestamp: new Date(),
          });

          const savedMsg = await newChat.save();

          io.to(receiverId.toString().trim()).emit("receive_message", savedMsg);
          io.to(senderId.toString().trim()).emit("receive_message", savedMsg);

        } catch (err) {
          console.error("❌ Socket Error:", err);
        }
      });

      socket.on("disconnect", () =>
        console.log(`❌ Disconnected: ${socket.id}`)
      );
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