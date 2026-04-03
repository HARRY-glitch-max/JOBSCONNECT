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

// --- MY MODEL IMPORTS ---
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
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS policy blocked origin: ${origin}`), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Importing Routes ---
import jobseekerRoutes from "./routes/jobseekerRoutes.js";
import employerRoutes from "./routes/employerRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import testRoutes from "./routes/testRoutes.js";

app.use("/api/jobseekers", jobseekerRoutes);
app.use("/api/employers", employerRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/test", testRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is alive" });
});

app.get("/", (req, res) => {
  res.send("Job Connect API is running...");
});

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    app.set("socketio", io);

    io.on("connection", (socket) => {
      console.log("🔌 User connected:", socket.id);

      socket.on("join", (userId) => {
        if (userId === "admin") {
          socket.join("admin_room");
          console.log("Administrator joined the global admin room");
        }
        socket.join(userId.toString());
        console.log(`User ${userId} joined their private room`);
      });

      socket.on("send_message", async (msg) => {
        try {
          const { senderId, receiverId, message, senderType } = msg;
          const JobSeeker = mongoose.model("JobSeeker");
          const Employer = mongoose.model("Employer");

          let sender, receiver, receiverType;

          // 1. Resolve Sender
          if (senderType === "JobSeeker") {
            sender = await JobSeeker.findById(senderId).select("name avatar");
          } else if (senderType === "Employer") {
            sender = await Employer.findById(senderId).select("companyName avatar");
          } else if (senderType === "Admin") {
            sender = { name: "System Admin", avatar: null };
          }

          // 2. Resolve Receiver & Dynamic Model Type
          if (receiverId === "admin") {
            receiver = { name: "Platform Admin", avatar: null };
            receiverType = "Admin";
          } else {
            // Check Employer first, then JobSeeker to determine receiverModel
            const emp = await Employer.findById(receiverId).select("companyName avatar");
            if (emp) {
              receiver = emp;
              receiverType = "Employer";
            } else {
              receiver = await JobSeeker.findById(receiverId).select("name avatar");
              receiverType = "JobSeeker";
            }
          }

          // 3. Create Chat with REQUIRED Model Fields
          const chat = new Chat({
            senderId,
            senderName: sender?.name || sender?.companyName || "Unknown",
            senderAvatar: sender?.avatar || null,
            senderModel: senderType, // ✅ FIXED: Required field
            
            receiverId,
            receiverName: receiver?.name || receiver?.companyName || "Unknown",
            receiverAvatar: receiver?.avatar || null,
            receiverModel: receiverType, // ✅ FIXED: Required field
            
            message,
            timestamp: new Date(),
          });

          const savedMsg = await chat.save();

          // 4. Real-time Delivery
          if (receiverId === "admin") {
            io.to("admin_room").emit("receive_message", savedMsg);
          } else {
            io.to(receiverId.toString()).emit("receive_message", savedMsg);
          }
          
          io.to(senderId.toString()).emit("receive_message", savedMsg);

        } catch (err) {
          console.error("Socket Messaging Error:", err);
          socket.emit("error", { message: "Validation failed: model paths required." });
        }
      });

      socket.on("typing", ({ receiverId, isTyping }) => {
        const target = receiverId === "admin" ? "admin_room" : receiverId.toString();
        socket.to(target).emit("display_typing", { isTyping });
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://0.0.0.0:${PORT}`);
    });

    const shutdown = async () => {
      console.log("\nShutting down...");
      server.close();
      await mongoose.connection.close();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("Startup error:", err.stack || err);
    process.exit(1);
  }
};

startServer();