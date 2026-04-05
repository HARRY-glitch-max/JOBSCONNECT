import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const employerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  industry: { type: String, required: true },
  contactInformation: {
    email: { type: String, required: true, unique: true }, // Added unique for better integrity
    phone: { type: String },
    address: { type: String }
  },
  password: { type: String, required: true },

  // 🇰🇪 NEW: Nationality Enforcement
  // Set to required to match your new controller logic
  nationality: { 
    type: String, 
    required: true, 
    default: "Kenyan" 
  },

  // 📍 NEW: Registration Metadata
  // Stores the country detected during registration for audit purposes
  registrationLocation: {
    country: { type: String, default: "Kenya" },
    countryCode: { type: String, default: "KE" }
  },

  // 🔑 Reference to Admin
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

  // 🔔 Notification System for Reports
  notifications: [
    {
      message: { type: String },
      adminName: { type: String },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // 📊 Metadata for report tracking
  lastReportReceived: { type: Date }
}, { timestamps: true });

// ✅ Hash password before saving
employerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ✅ Add matchPassword method
employerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Handle potential model overwrite issues in development
const Employer = mongoose.models.Employer || mongoose.model("Employer", employerSchema);

export default Employer;