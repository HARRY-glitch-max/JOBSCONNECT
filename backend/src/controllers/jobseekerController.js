import User from "../models/Jobseeker.js";
import generateToken from "../utils/generateToken.js";
import { notifyJobseeker } from "../utils/notifyJobseeker.js";
import axios from "axios"; // Added for Geolocation

// =======================
// Register jobseeker
// =======================
export const registerUser = async (req, res) => {
  try {
    let { name, email, password, nationality } = req.body;

    // 1. BASIC VALIDATION
    if (!name || !email || !password || !nationality) {
      return res.status(400).json({ message: "Please provide all required fields including nationality." });
    }

    if (typeof email !== "string") {
      return res.status(400).json({ message: "Email must be a string." });
    }

    // 2. STRICTOR NATIONALITY CHECK
    if (nationality.toLowerCase() !== 'kenyan') {
      return res.status(403).json({ 
        message: "JobsConnect is currently exclusive to Kenyan nationals." 
      });
    }

    // 3. GEOLOCATION CHECK (Kenya Only)
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Enforce IP blocking only in production to allow local Windows development
    if (process.env.NODE_ENV === 'production') {
      try {
        const geo = await axios.get(`http://ip-api.com/json/${userIp}`);
        if (geo.data.status === "success" && geo.data.countryCode !== "KE") {
          return res.status(403).json({ 
            message: "Registration must be completed while physically located in Kenya." 
          });
        }
      } catch (geoErr) {
        console.error("Geo-verification failed:", geoErr.message);
        // Optional: Decide if you want to block registration if the Geo API is down
      }
    }

    email = email.toLowerCase();

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists." });
    }

    // 4. CREATE USER
    const user = await User.create({ 
      name, 
      email, 
      password, 
      nationality: "Kenyan" // Hardcoded to ensure data consistency
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

// =======================
// Login jobseeker
// =======================
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Both email and password are required." });
    }

    if (typeof email !== "string") {
      return res.status(400).json({ message: "Email must be a string." });
    }

    email = email.toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id, "jobseeker"),
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

// =======================
// Get all jobseekers
// =======================
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("GET USERS ERROR:", err);
    res.status(500).json({ message: "Server error fetching users." });
  }
};

// =======================
// Get jobseeker by ID
// =======================
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);

  } catch (err) {
    console.error("GET USER ERROR:", err);
    res.status(500).json({ message: "Server error fetching user." });
  }
};

// =======================
// Update jobseeker profile
// =======================
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email && typeof req.body.email === "string"
      ? req.body.email.toLowerCase()
      : user.email;
    user.bio = req.body.bio || user.bio;
    user.skills = req.body.skills || user.skills;
    user.cv = req.body.cv || user.cv;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      skills: updatedUser.skills,
      cv: updatedUser.cv,
    });

  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    res.status(500).json({ message: "Server error updating user." });
  }
};

// =======================
// Delete jobseeker
// =======================
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "User deleted successfully." });

  } catch (err) {
    console.error("DELETE USER ERROR:", err);
    res.status(500).json({ message: "Server error deleting user." });
  }
};

// =======================
// Get logged-in jobseeker profile
// =======================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);

  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error fetching profile." });
  }
};

// =======================
// Notify jobseeker
// =======================
export const notifyJobseekerById = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Jobseeker not found." });
    }

    await notifyJobseeker({
      email: user.email,
      name: user.name,
      subject,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Notification sent to ${user.email}`,
    });

  } catch (err) {
    console.error("NOTIFY ERROR:", err);
    res.status(500).json({ message: "Server error sending notification." });
  }
};