import User from "../models/Jobseeker.js";
import generateToken from "../utils/generateToken.js";
import { notifyJobseeker, sendPasswordResetEmail, sendPasswordChangedEmail } from "../utils/sendEmail.js";
import axios from "axios";
import crypto from "crypto";

// ==========================================
// 1. AUTHENTICATION
// ==========================================

export const registerUser = async (req, res) => {
  try {
    let { name, email, password, nationality } = req.body;

    if (!name || !email || !password || !nationality) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    if (nationality.toLowerCase() !== 'kenyan') {
      return res.status(403).json({ message: "JobConnect is exclusive to Kenyan nationals." });
    }

    if (process.env.NODE_ENV === 'production') {
      const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      try {
        const geo = await axios.get(`http://ip-api.com/json/${userIp}`);
        if (geo.data.status === "success" && geo.data.countryCode !== "KE") {
          return res.status(403).json({ message: "Registration must be completed in Kenya." });
        }
      } catch (geoErr) {
        console.error("Geo-verification failed:", geoErr.message);
      }
    }

    email = String(email).toLowerCase();
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists." });

    const user = await User.create({ name, email, password, nationality: "Kenyan" });

    // 🚀 JobConnect Welcome Email
    await notifyJobseeker({
      email: user.email,
      name: user.name,
      subject: "Welcome to JobConnect!",
      message: "Your professional account is ready. Complete your profile to start receiving job matches tailored to your skills.",
      ctaText: "Complete My Profile",
      ctaLink: "http://localhost:5173/profile" 
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id, "jobseeker"),
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Valid email is required." });
    }
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id, "jobseeker"),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

// ==========================================
// 2. PROFILE LOGIC
// ==========================================

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select("-password -resetPasswordToken -resetPasswordExpire");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error fetching profile." });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.name = req.body.name || user.name;
    user.bio = req.body.bio || user.bio;
    user.skills = req.body.skills || user.skills;
    user.cv = req.body.cv || user.cv;

    if (req.body.email) {
      const newEmail = String(req.body.email).toLowerCase();
      if (newEmail !== user.email) {
        const exists = await User.findOne({ email: newEmail });
        if (exists) return res.status(400).json({ message: "Email already in use." });
        user.email = newEmail;
      }
    }

    if (req.body.password) user.password = req.body.password;
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      message: "Profile updated successfully!"
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error updating profile." });
  }
};

// ==========================================
// 3. PASSWORD MANAGEMENT
// ==========================================

/**
 * @desc Change Password (while logged in)
 */
export const changeUserPassword = async (req, res) => {
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

    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    // Set and save new password
    user.password = newPassword;
    await user.save();

    // Send confirmation email
    sendPasswordChangedEmail({
      email: user.email,
      name: user.name,
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

/**
 * @desc Forgot Password - Send Reset Link via Email
 */
export const forgotUserPassword = async (req, res) => {
  try {
    let { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Please provide an email address." });
    }

    email = email.toLowerCase();
    const user = await User.findOne({ email });
    
    if (!user) {
      // For security, don't reveal that email doesn't exist
      return res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token and save to database
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save({ validateBeforeSave: false });

    // Create reset URL - Using frontend URL for better UX
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}?role=jobseeker`;
    
    try {
      // Use the dedicated password reset email function
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl: resetUrl,
      });

      res.status(200).json({ 
        message: "Password reset link sent to your email address." 
      });
    } catch (emailError) {
      console.error("EMAIL SEND ERROR:", emailError);
      
      // Reset token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      res.status(500).json({ 
        message: "Failed to send reset email. Please try again later." 
      });
    }
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: "Server error processing forgot password request." });
  }
};

/**
 * @desc Reset Password - Using Token from Email
 */
export const resetUserPassword = async (req, res) => {
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

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select("+resetPasswordToken +resetPasswordExpire");

    if (!user) {
      return res.status(400).json({ 
        message: "Invalid or expired reset token. Please request a new password reset." 
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // Send confirmation email
    sendPasswordChangedEmail({
      email: user.email,
      name: user.name,
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
// 4. ADMINISTRATIVE / COLLECTION
// ==========================================

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -resetPasswordToken -resetPasswordExpire");
    res.json(users);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ message: "Server error fetching users." });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -resetPasswordToken -resetPasswordExpire");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    console.error("GET USER BY ID ERROR:", err);
    res.status(500).json({ message: "Server error." });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    Object.assign(user, req.body);
    if (req.body.email) user.email = req.body.email.toLowerCase();

    const updatedUser = await user.save();
    const sanitizedUser = updatedUser.toObject();
    delete sanitizedUser.password;
    delete sanitizedUser.resetPasswordToken;
    delete sanitizedUser.resetPasswordExpire;
    
    res.json({
      success: true,
      message: "User updated successfully",
      user: sanitizedUser
    });
  } catch (err) {
    console.error("ADMIN UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error updating user." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Server error deleting user." });
  }
};

export const notifyJobseekerById = async (req, res) => {
  try {
    const { subject, message, ctaText, ctaLink } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Jobseeker not found." });

    await notifyJobseeker({
      email: user.email,
      name: user.name,
      subject: subject || "Update on your JobConnect Account",
      message: message || "You have a new notification waiting in your dashboard.",
      ctaText: ctaText || "View Dashboard",
      ctaLink: ctaLink || "http://localhost:5173/dashboard"
    });

    res.json({ success: true, message: `Notification sent to ${user.email}` });
  } catch (err) {
    console.error("NOTIFY ERROR:", err);
    res.status(500).json({ message: "Server error sending notification." });
  }
};