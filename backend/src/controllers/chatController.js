import Chat from "../models/Chat.js";
import JobSeeker from "../models/Jobseeker.js";
import Employer from "../models/Employer.js";
import Application from "../models/Application.js";
import mongoose from "mongoose";

/**
 * 🛡️ Security Helper
 * Verifies that a connection exists via an application.
 */
const checkApplicationExists = async (id1, id2) => {
  const connection = await Application.findOne({
    $or: [
      { userId: id1, employerId: id2 },
      { userId: id2, employerId: id1 },
    ],
  }).lean();
  
  console.log("🛡️ Connection Security Check:", connection ? "✅ FOUND" : "❌ NOT FOUND");
  return connection;
};

// =====================================================
// 1️⃣ SEND MESSAGE
// =====================================================
export const sendMessage = async (req, res) => {
  try {
    console.log("📩 Incoming Message Request:", req.body);

    const { senderId, receiverId, message, senderType } = req.body;

    // 1. Basic Validation
    if (!senderId || !receiverId || !senderType || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    // 2. Authorization Check
    const hasConnection = await checkApplicationExists(senderId, receiverId);
    if (!hasConnection) {
      return res.status(403).json({
        message: "Access Denied: No job application found between these users.",
      });
    }

    // 3. Logic to determine which Model to use
    const isJobSeekerSender = senderType.toLowerCase().includes("jobseeker");

    // Model Classes for query
    const SenderModel = isJobSeekerSender ? JobSeeker : Employer;
    const ReceiverModel = isJobSeekerSender ? Employer : JobSeeker;

    /** * ⚠️ FIXED CASING HERE 
     * Changed "JobSeeker" -> "Jobseeker" to match your Chat Schema Enum 
     */
    const senderModelName = isJobSeekerSender ? "Jobseeker" : "Employer";
    const receiverModelName = isJobSeekerSender ? "Employer" : "Jobseeker";

    // 4. Fetch Profiles
    const [sender, receiver] = await Promise.all([
      SenderModel.findById(senderId).select("name companyName avatar").lean(),
      ReceiverModel.findById(receiverId).select("name companyName avatar").lean(),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Sender or Receiver profile not found." });
    }

    // 5. Create and Save Chat Document
    const newChat = new Chat({
      senderId,
      senderModel: senderModelName,
      senderName: sender.companyName || sender.name || "User",
      senderAvatar: sender.avatar || null,
      receiverId,
      receiverModel: receiverModelName,
      receiverName: receiver.companyName || receiver.name || "User",
      receiverAvatar: receiver.avatar || null,
      message: message.trim(),
    });

    const savedChat = await newChat.save();
    console.log("✅ Message Saved Successfully");
    return res.status(201).json(savedChat);

  } catch (error) {
    console.error("🔥 Critical Send Message Error:", error);
    return res.status(500).json({
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};

// =====================================================
// 2️⃣ GET CHAT HISTORY
// =====================================================
export const getChatHistory = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const chats = await Chat.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
    .sort({ createdAt: 1 })
    .lean();

    return res.status(200).json(chats);
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving history." });
  }
};

// =====================================================
// 3️⃣ GET USER INBOX
// =====================================================
export const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const inbox = await Chat.aggregate([
      { $match: { $or: [{ senderId: userObjectId }, { receiverId: userObjectId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ["$senderId", "$receiverId"] },
              { s: "$senderId", r: "$receiverId" },
              { s: "$receiverId", r: "$senderId" },
            ],
          },
          lastMessage: { $first: "$message" },
          createdAt: { $first: "$createdAt" },
          contactId: { $first: { $cond: [{ $eq: ["$senderId", userObjectId] }, "$receiverId", "$senderId"] } },
          contactName: { $first: { $cond: [{ $eq: ["$senderId", userObjectId] }, "$receiverName", "$senderName"] } },
          contactAvatar: { $first: { $cond: [{ $eq: ["$senderId", userObjectId] }, "$receiverAvatar", "$senderAvatar"] } },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const formattedInbox = inbox.map((item) => ({
      _id: item.contactId,
      lastMessage: item.lastMessage,
      lastMessageAt: item.createdAt,
      otherUser: { _id: item.contactId, name: item.contactName, avatar: item.contactAvatar },
    }));

    return res.status(200).json(formattedInbox);
  } catch (error) {
    return res.status(500).json({ message: "Error generating inbox." });
  }
};