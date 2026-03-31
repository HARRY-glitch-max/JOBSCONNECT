import express from "express";
import {
  sendMessage,
  getChatHistory,
  getUserChats,
} from "../controllers/chatController.js";

const router = express.Router();

/**
 * ✅ Send a new message
 * POST /api/chats/send
 * Body: { senderId, receiverId, message, senderType }
 */
router.post("/send", sendMessage);

/**
 * ✅ Get chat history between two users
 * GET /api/chats/history/:senderId/:receiverId
 */
router.get("/history/:senderId/:receiverId", getChatHistory);

/**
 * ✅ Get all unique conversations for a user (Inbox/Sidebar)
 * GET /api/chats/user/:userId
 */
router.get("/user/:userId", getUserChats);

export default router;