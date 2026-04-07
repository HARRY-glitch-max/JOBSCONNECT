import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const jobseekerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true 
    },
    password: { type: String, required: true },

    nationality: { 
      type: String, 
      required: true, 
      default: "Kenyan" 
    },

    registrationLocation: {
      country: { type: String, default: "Kenya" },
      countryCode: { type: String, default: "KE" }
    },

    bio: { type: String },
    skills: [{ type: String }],
    cv: { type: String },
    avatar: { type: String },

    role: {
      type: String,
      enum: ["jobseeker"],
      default: "jobseeker",
    },
  },
  { timestamps: true }
);

// Hash password before saving
jobseekerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Add matchPassword method
jobseekerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ FIX: Variables and Model Strings must be consistent
// Using "JobSeeker" (Capital S) everywhere to match your Interview/Application refs
const JobSeeker = mongoose.models.JobSeeker || mongoose.model("JobSeeker", jobseekerSchema);

export default JobSeeker;