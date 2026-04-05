import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    // ✅ Job reference
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    // ✅ Applicant reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobSeeker",
      required: true,
    },

    // ✅ Employer reference (Changed to required for Dashboard/Reports consistency)
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true, 
    },

    // ✅ Resume file path or URL
    resume: {
      type: String,
      required: true,
    },

    // ✅ NEW: Specific skills for THIS application
    skills: {
      type: [String], 
      required: [true, "Please list your relevant skills"],
      validate: [v => v.length > 0, "At least one skill is required"]
    },

    // ✅ NEW: Personal bio/pitch for the employer
    bio: {
      type: String,
      required: [true, "A short bio/pitch is required"],
      trim: true,
      maxLength: [1000, "Bio cannot exceed 1000 characters"]
    },

    // ✅ Optional cover letter
    coverLetter: {
      type: String,
      trim: true,
    },

    // ✅ Application status
    status: {
      type: String,
      enum: ["submitted", "reviewing", "shortlisted", "rejected", "hired"],
      default: "submitted",
    },

    // ✅ Shortlist date
    shortlistedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Optimized compound index for high-performance dashboard filtering
applicationSchema.index({ employerId: 1, status: 1 });
applicationSchema.index({ jobId: 1, userId: 1 });

const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);

export default Application;