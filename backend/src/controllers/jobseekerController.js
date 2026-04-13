import User from "../models/Jobseeker.js";
import generateToken from "../utils/generateToken.js";
import { notifyJobseeker } from "../utils/notifyJobseeker.js";
import axios from "axios";

// ==========================================
// 1. AUTHENTICATION
// ==========================================

export const registerUser = async (req, res) => {
  try {
    let { name, email, password, nationality } = req.body;

    // 🛑 VALIDATION: Ensure all fields are strings and exist
    if (!name || !email || !password || !nationality) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    if (nationality.toLowerCase() !== 'kenyan') {
      return res.status(403).json({ message: "JobsConnect is exclusive to Kenyan nationals." });
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

    email = String(email).toLowerCase(); // 🛡️ Force string type
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists." });

    const user = await User.create({ name, email, password, nationality: "Kenyan" });

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

    // 🛑 VALIDATION: Prevent .toLowerCase() crash
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
// 2. LOGGED-IN PROFILE (The "/me" Logic)
// ==========================================

export const getUserProfile = async (req, res) => {
  try {
    // ✅ Uses _id or id (whichever is passed by middleware)
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
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

    // Update fields
    user.name = req.body.name || user.name;
    user.bio = req.body.bio || user.bio;
    user.skills = req.body.skills || user.skills;
    user.cv = req.body.cv || user.cv;

    if (req.body.email && typeof req.body.email === "string") {
      const newEmail = req.body.email.toLowerCase();
      if (newEmail !== user.email) {
        const emailExists = await User.findOne({ email: newEmail });
        if (emailExists) return res.status(400).json({ message: "Email already in use." });
        user.email = newEmail;
      }
    }

    if (req.body.password) user.password = req.body.password;

    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      skills: updatedUser.skills,
      cv: updatedUser.cv,
      message: "Profile updated successfully!"
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error updating profile." });
  }
};

// ==========================================
// 3. ADMINISTRATIVE / COLLECTION
// ==========================================

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ message: "Server error fetching users." });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    console.error("GET BY ID ERROR:", err);
    res.status(500).json({ message: "Server error fetching user." });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    Object.assign(user, req.body);
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    console.error("ADMIN UPDATE ERROR:", err);
    res.status(500).json({ message: "Server error updating user." });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Server error deleting user." });
  }
};

export const notifyJobseekerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Jobseeker not found." });

    await notifyJobseeker({
      email: user.email,
      name: user.name,
      subject: req.body.subject,
      message: req.body.message,
    });

    res.json({ success: true, message: `Notification sent to ${user.email}` });
  } catch (err) {
    console.error("NOTIFY ERROR:", err);
    res.status(500).json({ message: "Server error sending notification." });
  }
};