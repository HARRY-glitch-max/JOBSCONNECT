import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
  // ✅ FIX: Changed ref to "JobSeeker" (Capital S) to match your Jobseeker.js model
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "JobSeeker", 
    required: true 
  },
  
  // Reference to the Job being applied for
  jobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Job", 
    required: true 
  },
  
  // Track the employer who scheduled the session
  employerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employer", 
    required: true 
  }, 
  
  // Scheduling details
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
  
  // Lifecycle and Results
  status: { 
    type: String, 
    enum: ["scheduled", "completed", "cancelled"], 
    default: "scheduled" 
  },
  result: { 
    type: String, 
    enum: ["passed", "failed", "pending"], 
    default: "pending" 
  }, 
  
  // Post-interview notes
  feedback: { 
    type: String 
  } 
}, { timestamps: true });

// Ensure the model name "Interview" is consistent with your controller imports
const Interview = mongoose.models.Interview || mongoose.model("Interview", interviewSchema);

export default Interview;