import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    // ✅ Links to JobSeeker
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "JobSeeker", 
      required: true 
    },
    
    // ✅ Links to the specific job posting
    jobId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Job", 
      required: true 
    },
    
    // ✅ Links to the employer
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
      type: String,
      required: true 
    },
    location: { 
      type: String, // Can be "Zoom", "Office Address", etc.
      required: true 
    },
    meetingLink: {
      type: String // Optional: For remote interviews
    },
    
    /**
     * ✅ LOGIC UPDATE:
     * We keep 'status' as 'scheduled' even after the interview.
     * The 'result' field will tell the story of what happened.
     */
    status: { 
      type: String, 
      enum: ["scheduled", "cancelled"], 
      default: "scheduled" 
    },

    result: { 
      type: String, 
      enum: ["pending", "passed", "failed"], 
      default: "pending" 
    }, 
    
    // Feedback/Notes visible to both parties
    feedback: { 
      type: String,
      trim: true
    } 
  }, 
  { timestamps: true }
);

// Helpful Virtual (Optional): Checks if the interview date has passed
interviewSchema.virtual('isPast').get(function() {
  return new Date() > this.date;
});

const Interview = mongoose.models.Interview || mongoose.model("Interview", interviewSchema);

export default Interview;