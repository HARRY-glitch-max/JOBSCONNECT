import Admin from "../models/Admin.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Interview from "../models/Interview.js";
import Employer from "../models/Employer.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import { sendPasswordResetEmail, sendPasswordChangedEmail } from "../utils/sendEmail.js";

// ==========================================
// Register admin linked to employer
// ==========================================
export const registerAdmin = async (req, res) => {
  try {
    let { name, email, password, employerId } = req.body;

    if (!name || !email || !password || !employerId) {
      return res.status(400).json({ message: "Please provide name, email, password, and employerId." });
    }

    email = email.toLowerCase();
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists." });
    }

    const admin = await Admin.create({ 
      name, 
      email, 
      password, 
      employerId 
    });

    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      employerId: admin.employerId,
      token: generateToken(admin._id, "admin", admin.employerId),
    });
  } catch (error) {
    console.error("REGISTER ADMIN ERROR:", error);
    res.status(500).json({ message: "Server error during admin registration." });
  }
};

// ==========================================
// Login admin
// ==========================================
export const loginAdmin = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Both email and password are required." });
    }

    email = email.toLowerCase();
    const admin = await Admin.findOne({ email }).populate("employerId");

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!admin.employerId) {
      return res.status(404).json({ 
        message: "Admin account found, but linked Employer record is missing." 
      });
    }

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      employerId: admin.employerId, 
      token: generateToken(admin._id, "admin", admin.employerId._id),
    });
  } catch (error) {
    console.error("LOGIN ADMIN ERROR:", error);
    res.status(500).json({ message: "Server error during admin login." });
  }
};

// ==========================================
// Get Admin Profile
// ==========================================
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).populate("employerId");

    if (!admin) {
      return res.status(404).json({ message: "Admin profile not found." });
    }

    res.json(admin);
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error fetching admin profile." });
  }
};

// ==========================================
// Update Admin Profile
// ==========================================
export const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    admin.name = req.body.name || admin.name;
    admin.email = (req.body.email || admin.email).toLowerCase();

    // Only update password if provided in request
    if (req.body.password) {
      admin.password = req.body.password;
    }

    const updatedAdmin = await admin.save();

    res.json({
      _id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      employerId: updatedAdmin.employerId,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: "Server error updating profile." });
  }
};

// ==========================================
// Change Password (while logged in)
// ==========================================
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Please provide both current password and new password." 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long." 
      });
    }

    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Verify current password
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Set and save new password
    admin.password = newPassword;
    await admin.save();

    // Send confirmation email (don't await to avoid blocking response)
    sendPasswordChangedEmail({
      email: admin.email,
      name: admin.name,
    }).catch(err => console.error("Failed to send password change confirmation:", err));

    res.json({ 
      message: "Password changed successfully. Please log in again with your new password.",
      shouldLogout: true
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error changing password." });
  }
};

// ==========================================
// Forgot Password - Send Reset Link via Email
// ==========================================
export const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Please provide an email address." });
    }

    email = email.toLowerCase();
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      // For security, don't reveal that email doesn't exist
      return res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token and save to database
    admin.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    
    admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await admin.save({ validateBeforeSave: false });

    // Create reset URL - Using frontend URL for better UX
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}?role=admin`;
    
    try {
      // Use the dedicated password reset email function
      await sendPasswordResetEmail({
        email: admin.email,
        name: admin.name,
        resetUrl: resetUrl,
      });

      res.status(200).json({ 
        message: "Password reset link sent to your email address." 
      });
    } catch (emailError) {
      console.error("EMAIL SEND ERROR:", emailError);
      
      // Reset token fields if email fails
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpire = undefined;
      await admin.save({ validateBeforeSave: false });
      
      res.status(500).json({ 
        message: "Failed to send reset email. Please try again later." 
      });
    }
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error processing forgot password request." });
  }
};

// ==========================================
// Reset Password - Using Token from Email
// ==========================================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Please provide a new password." });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long." 
      });
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find admin with valid token
    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() } // Token hasn't expired
    });

    if (!admin) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token. Please request a new password reset." 
      });
    }

    // Set new password
    admin.password = password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;
    
    await admin.save();

    // Send confirmation email (don't await to avoid blocking response)
    sendPasswordChangedEmail({
      email: admin.email,
      name: admin.name,
    }).catch(err => console.error("Failed to send password change confirmation:", err));

    res.json({ 
      message: "Password reset successful. You can now log in with your new password." 
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error resetting password." });
  }
};

// ==========================================
// Generate employer-scoped reports (Live Stats)
// ==========================================
export const getAdminReports = async (req, res) => {
  try {
    const employerId = req.user.employerId; 

    if (!employerId) {
      return res.status(400).json({ message: "Employer ID missing in token authorization." });
    }

    const [
      totalJobs, activeJobs, closedJobs,
      totalApps, shortlistedApps, hiredApps, rejectedApps, pendingApps,
      totalInterviews, completedInterviews, scheduledInterviews, cancelledInterviews
    ] = await Promise.all([
      Job.countDocuments({ employerId }),
      Job.countDocuments({ employerId, status: "active" }),
      Job.countDocuments({ employerId, status: "closed" }),
      Application.countDocuments({ employerId }),
      Application.countDocuments({ employerId, status: "shortlisted" }),
      Application.countDocuments({ employerId, status: "hired" }),
      Application.countDocuments({ employerId, status: "rejected" }),
      Application.countDocuments({ employerId, status: "pending" }),
      Interview.countDocuments({ employerId }),
      Interview.countDocuments({ employerId, status: "completed" }),
      Interview.countDocuments({ employerId, status: "scheduled" }),
      Interview.countDocuments({ employerId, status: "cancelled" })
    ]);

    res.json({
      jobs: { total: totalJobs, active: activeJobs, closed: closedJobs },
      applications: {
        total: totalApps,
        shortlisted: shortlistedApps,
        hired: hiredApps,
        rejected: rejectedApps,
        pending: pendingApps
      },
      interviews: {
        total: totalInterviews,
        completed: completedInterviews,
        scheduled: scheduledInterviews,
        cancelled: cancelledInterviews
      }
    });
  } catch (error) {
    console.error("ADMIN REPORTS ERROR:", error);
    res.status(500).json({ message: "Server error generating dashboard reports." });
  }
};

// ==========================================
// Trigger New Report Generation & Notify Employer
// ==========================================
export const generateNewReport = async (req, res) => {
  try {
    const employerId = req.user.employerId;
    const adminName = req.user.name;

    if (!employerId) {
      return res.status(400).json({ message: "Employer ID missing." });
    }

    const updatedEmployer = await Employer.findByIdAndUpdate(
      employerId,
      {
        $push: {
          notifications: {
            message: `A new real-time hiring report has been generated by Admin: ${adminName}`,
            adminName: adminName,
            createdAt: new Date()
          }
        },
        $set: { lastReportReceived: new Date() }
      },
      { new: true }
    );

    if (!updatedEmployer) {
      return res.status(404).json({ message: "Employer not found to notify." });
    }

    res.status(201).json({ 
      message: `Report generated successfully. ${updatedEmployer.companyName} has been notified.`,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error("GENERATE REPORT ERROR:", error);
    res.status(500).json({ message: "Failed to process report generation." });
  }
};