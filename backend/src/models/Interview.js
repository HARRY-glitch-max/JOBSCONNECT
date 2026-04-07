import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    // ✅ Matches "JobSeeker" model for smooth .populate()
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "JobSeeker", 
      required: true 
    },
    
    // Links to the specific job posting
    jobId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Job", 
      required: true 
    },
    
    // Links to the employer who scheduled it
    employerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Employer", 
      required: true 
    }, 
    
    // Time & Place
    date: { 
      type: Date, 
      required: true 
    },
    time: { 
      type: String 
    },
    location: { 
      type: String, 
      required: true 
    },
    
    // ✅ Logic for Pass/Fail Buttons
    // status: "scheduled" -> "completed" (once decision is made)
    status: { 
      type: String, 
      enum: ["scheduled", "completed", "cancelled"], 
      default: "scheduled" 
    },
    // result: "pending" -> "passed" OR "failed"
    result: { 
      type: String, 
      enum: ["passed", "failed", "pending"], 
      default: "pending" 
    }, 
    
    // Employer notes (Why they passed/failed)
    feedback: { 
      type: String 
    } 
  }, 
  { timestamps: true } // Auto-generates createdAt and updatedAt
);

// Prevent re-compilation errors during Nodemon restarts
const Interview = mongoose.models.Interview || mongoose.model("Interview", interviewSchema);

export default Interview;