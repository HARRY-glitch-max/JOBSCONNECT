import Chat from "../models/Chat.js";
import JobSeeker from "../models/Jobseeker.js";
import Employer from "../models/Employer.js";
import Application from "../models/Application.js";
import mongoose from "mongoose";

/**
 * 🛡️ Security Helper
 * Verifies that a connection exists and returns the application 
 * to confirm who is who.
 */
const checkApplicationExists = async (id1, id2) => {
  return await Application.findOne({
    $or: [
      { userId: id1, employerId: id2 },
      { userId: id2, employerId: id1 }
    ]
  }).lean();
};

// --- 1. Send a New Message ---
export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message, senderType } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ message: "Message content cannot be empty." });
    }

    // 1. Authorization Check
    const hasConnection = await checkApplicationExists(senderId, receiverId);
    if (!hasConnection) {
      return res.status(403).json({ 
        message: "Access Denied: Connection only allowed after an application is submitted." 
      });
    }

    // 2. Determine Logic based on senderType (Case Insensitive)
    const isJobSeekerSender = senderType?.toLowerCase() === "jobseeker";
    
    const senderModelName = isJobSeekerSender ? "Jobseeker" : "Employer";
    const receiverModelName = isJobSeekerSender ? "Employer" : "Jobseeker";

    const SenderModel = isJobSeekerSender ? JobSeeker : Employer;
    const ReceiverModel = isJobSeekerSender ? Employer : JobSeeker;

    // 3. Fetch Profile details for the Chat Document
    const [sender, receiver] = await Promise.all([
      SenderModel.findById(senderId).select("name companyName avatar").lean(),
      ReceiverModel.findById(receiverId).select("name companyName avatar").lean()
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Sender or Receiver profile not found." });
    }

    // 4. Create Chat with Dynamic Ref fields
    const newChat = new Chat({
      senderId,
      senderModel: senderModelName, // ✅ Required for Dynamic Ref
      senderName: sender.companyName || sender.name || "Unknown",
      senderAvatar: sender.avatar || null,
      
      receiverId,
      receiverModel: receiverModelName, // ✅ Required for Dynamic Ref
      receiverName: receiver.companyName || receiver.name || "Unknown",
      receiverAvatar: receiver.avatar || null,
      
      message: message.trim(),
    });

    const savedChat = await newChat.save();
    res.status(201).json(savedChat);
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ message: "Server error while sending message." });
  }
};

// --- 2. Get Chat History ---
export const getChatHistory = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    // Verification
    const hasConnection = await checkApplicationExists(senderId, receiverId);
    if (!hasConnection) {
      return res.status(403).json({ message: "Authorization failed: No active application found." });
    }

    const chats = await Chat.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
    .sort({ createdAt: 1 })
    .lean();

    res.status(200).json(chats);
  } catch (error) {
    console.error("Fetch History Error:", error);
    res.status(500).json({ message: "Error retrieving chat history." });
  }
};

// --- 3. Get Inbox (Aggregate Sidebar) ---
export const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format." });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const inbox = await Chat.aggregate([
      {
        $match: {
          $or: [{ senderId: userObjectId }, { receiverId: userObjectId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          // Grouping by unique pair of IDs
          _id: {
            $cond: [
              { $gt: ["$senderId", "$receiverId"] },
              { s: "$senderId", r: "$receiverId" },
              { s: "$receiverId", r: "$senderId" }
            ]
          },
          lastMessage: { $first: "$message" },
          createdAt: { $first: "$createdAt" },
          contactId: {
            $first: { $cond: [{ $eq: ["$senderId", userObjectId] }, "$receiverId", "$senderId"] }
          },
          contactName: {
            $first: { $cond: [{ $eq: ["$senderId", userObjectId] }, "$receiverName", "$senderName"] }
          },
          contactAvatar: {
            $first: { $cond: [{ $eq: ["$senderId", userObjectId] }, "$receiverAvatar", "$senderAvatar"] }
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    const formattedInbox = inbox.map(item => ({
      _id: item.contactId,
      lastMessage: item.lastMessage,
      lastMessageAt: item.createdAt,
      otherUser: {
        _id: item.contactId,
        name: item.contactName,
        avatar: item.contactAvatar
      }
    }));

    res.status(200).json(formattedInbox);
  } catch (error) {
    console.error("Inbox Aggregation Error:", error);
    res.status(500).json({ message: "Error generating inbox." });
  }
};