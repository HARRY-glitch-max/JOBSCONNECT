import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");
    console.log("URI:", process.env.MONGO_URI);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Wait 30s before failing
      socketTimeoutMS: 45000,          // Close sockets after 45s inactivity
      maxPoolSize: 10,                 // Maintain up to 10 connections
      minPoolSize: 2,                  // Keep at least 2 connections ready
      retryWrites: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // ==============================
    // Connection Event Listeners
    // ==============================

    mongoose.connection.on("connected", () => {
      console.log("🟢 MongoDB connection established");
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔁 MongoDB reconnected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });

  } catch (error) {
    console.error("💥 MongoDB initial connection failed:", error.message);

    // Instead of crashing immediately, retry after delay
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;