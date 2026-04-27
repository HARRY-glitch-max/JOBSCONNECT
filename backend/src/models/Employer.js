import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const employerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  industry: { type: String, required: true },
  contactInformation: {
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String }
  },
  password: { type: String, required: true },

  // 🔑 NEW: Role Definition
  // We use enum to strictly enforce that the role can only be 'employer'
  role: {
    type: String,
    required: true,
    enum: ["employer"], 
    default: "employer"
  },

  // 🇰🇪 Nationality Enforcement
  nationality: { 
    type: String, 
    required: true, 
    default: "Kenyan" 
  },

  // 📍 Registration Metadata
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
  lastReportReceived: { type: Date },

  // ✅ Password Reset Fields
  resetPasswordToken: { 
    type: String,
    select: false // Don't return by default in queries
  },
  resetPasswordExpire: { 
    type: Date,
    select: false // Don't return by default in queries
  }
}, { timestamps: true });

// ✅ Hash password before saving
employerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ Add matchPassword method
employerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Employer = mongoose.models.Employer || mongoose.model("Employer", employerSchema);

export default Employer;