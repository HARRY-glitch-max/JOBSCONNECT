import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true, 
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    default: "admin", 
    immutable: true 
  },
  // ✅ Reverted to 'employerId' to match your existing MongoDB documents
  employerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employer", 
    required: true 
  }
}, { timestamps: true });

// ✅ Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10); 
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); 
  }
});

// ✅ Compare entered password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Prevent OverwriteModelError
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;