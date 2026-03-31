import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    // ✅ SENDER LOGIC
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel", // Tells Mongoose to look at senderModel field
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["Jobseeker", "Employer"], // Must match your Model names exactly
    },
    senderName: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
      default: null,
    },

    // ✅ RECEIVER LOGIC
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "receiverModel", // Tells Mongoose to look at receiverModel field
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ["Jobseeker", "Employer"],
    },
    receiverName: {
      type: String,
      required: true,
    },
    receiverAvatar: {
      type: String,
      default: null,
    },

    // ✅ MESSAGE CONTENT
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ STATUS & TIMING
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { 
    timestamps: true, // This automatically creates 'createdAt' and 'updatedAt'
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ✅ Performance Optimization
// Indexing helps speed up the "Inbox" and "History" queries significantly
chatSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;