import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // The recipient of the notification (can be JobSeeker or Employer)
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true 
      // Removed strict 'ref' here to allow for both JobSeeker and Employer IDs
    },
    
    type: { 
      type: String, 
      enum: [
        "interview", 
        "interview_result", 
        "application_status", 
        "message", 
        "job_posting", 
        "job_update", 
        "job_delete",
        "report" // ✅ Added for Admin -> Employer reporting
      ],
      required: true 
    },
    
    content: { 
      type: String, 
      required: true 
    },

    isRead: { 
      type: Boolean, 
      default: false 
    },

    // Dynamic link to redirect the user (e.g., to a specific Job or Report page)
    link: { 
      type: String 
    }
  },
  { timestamps: true }
);

// Indexing userId for faster notification fetching when the user logs in
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;