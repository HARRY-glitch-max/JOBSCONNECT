import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true,
    }, // Employer reference

    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: [String], default: [] }, // Skills/qualifications

    location: { type: String, required: true },
    salary: { type: String, required: true },

    // 🕒 NEW: Application Deadline
    // Stores the exact date and time the job closes
    deadline: { 
      type: Date, 
      required: true 
    },

    datePosted: { type: Date, default: Date.now },
    
    status: {
      type: String,
      enum: ["open", "closed", "in review", "expired"],
      default: "open",
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true }, // Ensure virtuals show up in API responses
    toObject: { virtuals: true }
  }
);

/**
 * 🛠️ VIRTUAL PROPERTY: isExpired
 * Usage: job.isExpired returns true or false based on current time vs deadline.
 * This is safer than relying on a static "status" string.
 */
jobSchema.virtual("isExpired").get(function () {
  return new Date() > this.deadline;
});

// Auto-update status if deadline has passed when querying
jobSchema.pre('find', function() {
  // Optional: You could add logic here to filter or mark jobs as expired on the fly
});

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

export default Job;