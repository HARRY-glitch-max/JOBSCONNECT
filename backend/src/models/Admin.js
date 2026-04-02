import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // ✅ Role field ensures authorization middleware works correctly
  role: { 
    type: String, 
    default: "admin", 
    immutable: true 
  },
  employerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Employer", 
    required: true 
  }
}, { timestamps: true });

// ✅ FIXED: Hash password before saving
adminSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Use genSalt (bcryptjs standard) instead of getSalt
    const salt = await bcrypt.genSalt(10); 
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error); // Pass errors to Mongoose error handling
  }
});

// ✅ Compare entered password with hashed password
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Prevent OverwriteModelError
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

export default Admin;