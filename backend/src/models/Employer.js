import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const employerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  industry: { type: String, required: true },
  contactInformation: {
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String }
  },
  password: { type: String, required: true },

  // 🔑 Reference to Admin (Matches your existing structure)
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

  // 🔔 NEW: Notification System for Reports
  notifications: [
    {
      message: { type: String },
      adminName: { type: String },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // 📊 NEW: Metadata for report tracking
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

const Employer = mongoose.models.Employer || mongoose.model("Employer", employerSchema);

export default Employer;